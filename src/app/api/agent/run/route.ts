import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { neon } from '@neondatabase/serverless'
import { Redis } from '@upstash/redis'
import {
  getLiveUSDCBalance, getLiveVaultBalance, getLiveAPY,
  getUserYieldEarned, getUserDepositHistory,
  getDaysSinceLastDeposit, hasDepositedThisWeek,
  executeTool, type AgentRules,
} from '@/lib/yo-executor'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const sql = neon(process.env.DATABASE_URL!)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const AGENT_TOOLS = [{
  functionDeclarations: [
    {
      name: 'deposit_to_goal',
      description: 'Deposit USDC into a savings goal via YO Protocol yoUSD vault on Base. Real on-chain transaction.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          goal_name: { type: SchemaType.STRING, description: 'Exact goal name' },
          amount_usdc: { type: SchemaType.NUMBER, description: 'USDC amount (min $1)' },
          reason: { type: SchemaType.STRING, description: 'Plain English reason for user' },
        },
        required: ['goal_name', 'amount_usdc', 'reason'],
      },
    },
    {
      name: 'sweep_idle_usdc',
      description: 'Sweep idle USDC from wallet into highest priority incomplete goal.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          amount_usdc: { type: SchemaType.NUMBER },
          reason: { type: SchemaType.STRING },
        },
        required: ['amount_usdc', 'reason'],
      },
    },
    {
      name: 'protect_streak',
      description: 'Make $1 deposit to protect weekly streak. Never uses Emergency Fund.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          goal_name: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
        },
        required: ['goal_name', 'reason'],
      },
    },
    {
      name: 'send_notification',
      description: 'Alert user without moving money. Use when autopilot is OFF.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          message: { type: SchemaType.STRING },
          urgency: { type: SchemaType.STRING, enum: ['low', 'medium', 'high'] },
        },
        required: ['message', 'urgency'],
      },
    },
  ],
}]

export async function POST(req: Request) {
  const isCron = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` 
  const body = await req.json().catch(() => ({}))

  let users: AgentRules[] = []
  if (isCron) {
    if (new Date().getDate() === 1) {
      await sql`UPDATE agent_rules SET spent_this_month = 0` 
    }
    users = await sql`SELECT * FROM agent_rules WHERE enabled = true` as AgentRules[]
  } else if (body.userId) {
    const rows = await sql`SELECT * FROM agent_rules WHERE user_id = ${body.userId} AND enabled = true` 
    users = rows as AgentRules[]
  }

  const results = []

  for (const rules of users) {
    const dedupKey = `agent:${rules.userId}:${new Date().toISOString().split('T')[0]}` 
    if (isCron && await redis.get(dedupKey)) {
      results.push({ userId: rules.userId, skipped: 'already ran today' })
      continue
    }

    try {
      const [usdcBalance, vaultBalance, apy, yieldEarned, depositHistory, daysSinceDeposit, depositedThisWeek, goals] =
        await Promise.all([
          getLiveUSDCBalance(rules.walletAddress),
          getLiveVaultBalance(rules.walletAddress),
          getLiveAPY(),
          getUserYieldEarned(rules.walletAddress),
          getUserDepositHistory(rules.walletAddress),
          getDaysSinceLastDeposit(rules.userId),
          hasDepositedThisWeek(rules.userId),
          sql`SELECT * FROM goals WHERE user_id = ${rules.userId} ORDER BY priority ASC`,
        ])

      const today = new Date()
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' })
      const streakAtRisk = !depositedThisWeek && today.getDay() >= 4
      const remaining = rules.monthlyBudget - rules.spentThisMonth

      const agentPrompt = `
You are the Nest savings agent making autonomous decisions right now.
Today is ${dayOfWeek}, ${today.toDateString()}.

LIVE DATA FROM BASE BLOCKCHAIN:
- Wallet USDC: $${usdcBalance.toFixed(2)}
- yoUSD vault value: $${vaultBalance.toFixed(2)}
- Total yield earned: $${yieldEarned.toFixed(2)}
- Current APY: ${apy.toFixed(1)}%

RECENT DEPOSIT HISTORY (last 10):
${JSON.stringify(depositHistory, null, 2)}

AGENT RULES:
- Mode: ${rules.autopilot ? 'AUTOPILOT — execute real transactions' : 'NOTIFY ONLY — no transactions'}
- Scheduled deposit: $${rules.scheduledAmount} every ${rules.scheduledDay}
- Monthly budget: $${rules.monthlyBudget} | Spent: $${rules.spentThisMonth} | Remaining: $${remaining.toFixed(2)}
- Streak protection: ${rules.streakProtection ? 'ON' : 'OFF'}
- Idle sweep after: ${rules.idleSweepDays} days

ACTIVITY:
- Days since last deposit: ${daysSinceDeposit}
- Deposited this week: ${depositedThisWeek}
- Streak at risk: ${streakAtRisk}

GOALS:
${JSON.stringify(goals, null, 2)}

DECISION CHECKLIST:
1. Is today ${rules.scheduledDay} AND remaining budget >= $${rules.scheduledAmount} AND USDC balance sufficient? → deposit_to_goal
2. Has USDC been idle ${rules.idleSweepDays}+ days? → sweep_idle_usdc
3. Streak at risk AND streak_protection ON? → protect_streak ($1, not Emergency Fund)
4. Any goal falling behind deadline? → send_notification

HARD RULES:
- Never exceed $${remaining.toFixed(2)} remaining budget
- Never touch Emergency Fund for streak protection
- If autopilot OFF → only send_notification
- If USDC balance < $1 → do nothing
- Always give plain English reason

Call all applicable tools now.
`

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', tools: AGENT_TOOLS })
      const chat = model.startChat()
      let response = await chat.sendMessage(agentPrompt)
      const actions = []

      while (true) {
        const parts = response.candidates?.[0]?.content?.parts ?? []
        const toolCalls = parts.filter((p: any) => p.functionCall)
        if (!toolCalls.length) break

        const toolResults = []
        for (const part of toolCalls as any[]) {
          const { name, args } = part.functionCall
          const result = await executeTool(name, args, rules)

          await sql`
            INSERT INTO agent_logs (user_id, tool_name, input, result, reason, tx_hash)
            VALUES (
              ${rules.userId}, ${name},
              ${JSON.stringify(args)},
              ${JSON.stringify(result)},
              ${args.reason ?? ''},
              ${result.tx_hash ?? null}
            )
          `
          actions.push({ tool: name, args, result })
          toolResults.push({ functionResponse: { name, response: result } })
        }
        response = await chat.sendMessage(toolResults)
      }

      await redis.set(dedupKey, '1', { ex: 90000 })
      results.push({ userId: rules.userId, actions })

    } catch (err: any) {
      await sql`
        INSERT INTO agent_logs (user_id, tool_name, input, result, reason)
        VALUES (${rules.userId}, 'error', '{}', ${JSON.stringify({ error: err.message })}, 'Agent crashed')
      `
      results.push({ userId: rules.userId, error: err.message })
    }
  }

  return Response.json({ ran: results.length, results })
}
