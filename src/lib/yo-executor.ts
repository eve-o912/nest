import {
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
} from 'viem'
import { base } from 'viem/chains'
import { PrivyClient } from '@privy-io/server-auth'
import { neon } from '@neondatabase/serverless'

const YOUSD_VAULT  = '0x0000000f926268be77AB7E1d17e4e4c7d4b28a65'
const YOGATEWAY    = '0xF1EeE0957267b1A474323Ff9CfF7719E964969FA'
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_DECIMALS = 6

const ERC20_ABI = [
  {
    name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'convertToAssets', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL!),
})

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

const sql = neon(process.env.DATABASE_URL!)

export interface AgentRules {
  userId: string
  walletAddress: string
  autopilot: boolean
  scheduledDay: string
  scheduledAmount: number
  monthlyBudget: number
  spentThisMonth: number
  streakProtection: boolean
  idleSweepDays: number
  enabled: boolean
}

export interface ToolResult {
  success: boolean
  tx_hash?: string
  basescan_url?: string
  amount_usdc?: number
  error?: string
  notified?: boolean
  skipped?: boolean
  skip_reason?: string
}

// ─── Live blockchain reads ─────────────────────────────

export async function getLiveUSDCBalance(address: string): Promise<number> {
  const raw = await publicClient.readContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  })
  return Number(formatUnits(raw, USDC_DECIMALS))
}

export async function getLiveVaultBalance(address: string): Promise<number> {
  const sharesRaw = await publicClient.readContract({
    address: YOUSD_VAULT as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  })
  const assetsRaw = await publicClient.readContract({
    address: YOUSD_VAULT as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'convertToAssets',
    args: [sharesRaw],
  })
  return Number(formatUnits(assetsRaw, USDC_DECIMALS))
}

// ─── YO API Reads (no key needed) ──────────────────────

export async function getUserYieldEarned(walletAddress: string): Promise<number> {
  const res = await fetch(
    `https://api.yo.xyz/api/v1/performance/user/base/${YOUSD_VAULT}/${walletAddress}` 
  )
  const data = await res.json()
  return Number(data?.data?.yieldEarned?.formatted ?? 0)
}

export async function getUserDepositHistory(walletAddress: string) {
  const res = await fetch(
    `https://api.yo.xyz/api/v1/history/user/base/${YOUSD_VAULT}/${walletAddress}?limit=10` 
  )
  const data = await res.json()
  return data?.data ?? []
}

export async function getLiveAPY(): Promise<number> {
  const res = await fetch(`https://api.yo.xyz/api/v1/vault/base/${YOUSD_VAULT}/snapshot`)
  const data = await res.json()
  return Number(data?.data?.apy?.current ?? 0)
}

export async function getDaysSinceLastDeposit(userId: string): Promise<number> {
  const rows = await sql`
    SELECT executed_at FROM agent_logs
    WHERE user_id = ${userId}
    AND tool_name IN ('deposit_to_goal','sweep_idle_usdc','protect_streak')
    AND (result->>'success')::boolean = true
    ORDER BY executed_at DESC LIMIT 1
  `
  if (rows.length === 0) return 999
  return Math.floor((Date.now() - new Date(rows[0].executed_at).getTime()) / 86400000)
}

export async function hasDepositedThisWeek(userId: string): Promise<boolean> {
  const monday = new Date()
  monday.setDate(monday.getDate() - monday.getDay() + 1)
  monday.setHours(0, 0, 0, 0)
  const rows = await sql`
    SELECT id FROM agent_logs
    WHERE user_id = ${userId}
    AND tool_name IN ('deposit_to_goal','sweep_idle_usdc','protect_streak')
    AND (result->>'success')::boolean = true
    AND executed_at >= ${monday.toISOString()}
    LIMIT 1
  `
  return rows.length > 0
}

// ─── Real deposit via YO API calldata + Privy wallet ─────

async function buildDepositTx(amountRaw: bigint) {
  // Call YO API to build deposit calldata
  const res = await fetch('https://api.yo.xyz/api/v1/transaction/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chainId: 8453,
      vault: YOUSD_VAULT,
      amount: amountRaw.toString(),
      slippageBps: 50,
    }),
  })
  const data = await res.json()
  return data?.data
}

async function buildApproveTx(amountRaw: bigint) {
  // Standard ERC20 approve calldata
  const approveSelector = '0x095ea7b3'
  const spender = YOGATEWAY.slice(2).padStart(64, '0')
  const amount = amountRaw.toString(16).padStart(64, '0')
  return {
    to: USDC_ADDRESS,
    data: `0x${approveSelector}${spender}${amount}`,
  }
}

async function executeRealDeposit(
  userId: string,
  walletAddress: string,
  amountUSDC: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const amountRaw = parseUnits(amountUSDC.toFixed(6), USDC_DECIMALS)

    // Build deposit calldata via YO API
    const depositTx = await buildDepositTx(amountRaw)
    if (!depositTx) throw new Error('Failed to build deposit tx')

    // Check allowance — approve if needed
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [walletAddress as `0x${string}`, YOGATEWAY as `0x${string}`],
    })

    // Sign + send via Privy server wallet
    const privyBase = `https://auth.privy.io/api/v1/apps/${process.env.PRIVY_APP_ID}` 
    const authHeader = `Basic ${Buffer.from(`${process.env.PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`).toString('base64')}` 

    // Approve if needed
    if (allowance < amountRaw) {
      const approveTx = await buildApproveTx(amountRaw)
      await fetch(`${privyBase}/wallets/${walletAddress}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'privy-app-id': process.env.PRIVY_APP_ID!,
        },
        body: JSON.stringify({
          method: 'eth_sendTransaction',
          caip2: 'eip155:8453',
          params: {
            transaction: {
              to: approveTx.to,
              data: approveTx.data,
              value: '0x0',
              chainId: '0x2105',
            },
          },
        }),
      })
    }

    // Send deposit
    const depositRes = await fetch(`${privyBase}/wallets/${walletAddress}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'privy-app-id': process.env.PRIVY_APP_ID!,
      },
      body: JSON.stringify({
        method: 'eth_sendTransaction',
        caip2: 'eip155:8453',
        params: {
          transaction: {
            to: depositTx.to,
            data: depositTx.data,
            value: '0x0',
            chainId: '0x2105',
          },
        },
      }),
    })

    if (!depositRes.ok) {
      const err = await depositRes.json()
      throw new Error(err.message || 'Privy RPC failed')
    }

    const { data } = await depositRes.json()
    const txHash = data.hash

    // Wait for on-chain confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 60_000,
    })

    if (receipt.status !== 'success') throw new Error('Transaction reverted')

    return { success: true, txHash }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ─── Tool executor ────────────────────────────────────

export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  rules: AgentRules
): Promise<ToolResult> {
  const moneyTools = ['deposit_to_goal', 'sweep_idle_usdc', 'protect_streak']

  if (moneyTools.includes(toolName)) {
    if (!rules.autopilot) {
      return { success: true, skipped: true, skip_reason: 'Autopilot OFF — notify only' }
    }
    const amount = args.amount_usdc ?? 1
    const remaining = rules.monthlyBudget - rules.spentThisMonth
    if (amount > remaining) {
      return { success: false, skipped: true, skip_reason: `Exceeds monthly budget. Remaining: $${remaining.toFixed(2)}` }
    }
    const liveBalance = await getLiveUSDCBalance(rules.walletAddress)
    if (liveBalance < amount) {
      return { success: false, skipped: true, skip_reason: `Insufficient USDC. Have $${liveBalance.toFixed(2)}, need $${amount}` }
    }
  }

  switch (toolName) {
    case 'deposit_to_goal': {
      const { goal_name, amount_usdc } = args
      const result = await executeRealDeposit(rules.userId, rules.walletAddress, amount_usdc)
      if (result.success) {
        await sql`UPDATE agent_rules SET spent_this_month = spent_this_month + ${amount_usdc}, updated_at = now() WHERE user_id = ${rules.userId}` 
        await sql`UPDATE goals SET deposited_amount = deposited_amount + ${amount_usdc} WHERE user_id = ${rules.userId} AND LOWER(name) = LOWER(${goal_name})` 
      }
      return {
        success: result.success,
        tx_hash: result.txHash,
        basescan_url: result.txHash ? `https://basescan.org/tx/${result.txHash}` : undefined,
        amount_usdc,
        error: result.error,
      }
    }

    case 'sweep_idle_usdc': {
      const { amount_usdc } = args
      const goals = await sql`SELECT * FROM goals WHERE user_id = ${rules.userId} AND deposited_amount < target_amount ORDER BY priority ASC LIMIT 1` 
      if (!goals.length) return { success: false, error: 'No active goals' }
      const result = await executeRealDeposit(rules.userId, rules.walletAddress, amount_usdc)
      if (result.success) {
        await sql`UPDATE agent_rules SET spent_this_month = spent_this_month + ${amount_usdc}, updated_at = now() WHERE user_id = ${rules.userId}` 
        await sql`UPDATE goals SET deposited_amount = deposited_amount + ${amount_usdc} WHERE id = ${goals[0].id}` 
      }
      return {
        success: result.success,
        tx_hash: result.txHash,
        basescan_url: result.txHash ? `https://basescan.org/tx/${result.txHash}` : undefined,
        amount_usdc,
        error: result.error,
      }
    }

    case 'protect_streak': {
      const AMOUNT = 1.0
      const goals = await sql`SELECT * FROM goals WHERE user_id = ${rules.userId} AND LOWER(name) NOT LIKE '%emergency%' AND deposited_amount < target_amount ORDER BY priority ASC LIMIT 1` 
      if (!goals.length) return { success: false, error: 'No eligible goal for streak protection' }
      const result = await executeRealDeposit(rules.userId, rules.walletAddress, AMOUNT)
      if (result.success) {
        await sql`UPDATE agent_rules SET spent_this_month = spent_this_month + ${AMOUNT}, updated_at = now() WHERE user_id = ${rules.userId}` 
        await sql`UPDATE goals SET deposited_amount = deposited_amount + ${AMOUNT} WHERE id = ${goals[0].id}` 
      }
      return {
        success: result.success,
        tx_hash: result.txHash,
        basescan_url: result.txHash ? `https://basescan.org/tx/${result.txHash}` : undefined,
        amount_usdc: AMOUNT,
        error: result.error,
      }
    }

    case 'send_notification': {
      const { message, urgency } = args
      await sql`INSERT INTO agent_logs (user_id, tool_name, input, result, reason) VALUES (${rules.userId}, 'notify', ${JSON.stringify(args)}, ${JSON.stringify({ notified: true, urgency })}, ${message})` 
      return { success: true, notified: true }
    }

    default:
      return { success: false, error: `Unknown tool: ${toolName}` }
  }
}
