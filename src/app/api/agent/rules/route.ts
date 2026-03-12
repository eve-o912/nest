import { query, queryOne } from '@/lib/db'
import { 
  validateUserId, 
  validateWalletAddress,
  withValidation, 
  withSecurity 
} from '@/lib/validation'
import { logger } from '@/lib/retry'

export const GET = withSecurity(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const userIdParam = searchParams.get('userId')
  
  if (!userIdParam) {
    return Response.json({ error: 'userId required' }, { status: 400 })
  }
  
  try {
    const userId = validateUserId(userIdParam)
    const row = await queryOne(
      'SELECT * FROM agent_rules WHERE user_id = $1',
      [userId]
    )
    
    logger.info('Fetched agent rules', { userId, found: !!row })
    return Response.json(row ?? null)
  } catch (err: any) {
    logger.error('Failed to fetch rules', err, { userId: userIdParam })
    return Response.json({ 
      error: err.message || 'Failed to fetch rules' 
    }, { status: 500 })
  }
})

export const POST = withSecurity(
  withValidation(
    {
      userId: validateUserId,
      walletAddress: validateWalletAddress,
      autopilot: (v) => !!v,
      scheduledDay: (v) => String(v || 'Monday'),
      scheduledAmount: (v) => Math.max(1, Number(v || 50)),
      monthlyBudget: (v) => Math.max(1, Number(v || 200)),
      streakProtection: (v) => v !== undefined ? !!v : true,
      idleSweepDays: (v) => Math.max(1, Math.min(30, Number(v || 3))),
      enabled: (v) => !!v,
    },
    async (body) => {
      try {
        const {
          userId,
          walletAddress,
          autopilot,
          scheduledDay,
          scheduledAmount,
          monthlyBudget,
          streakProtection,
          idleSweepDays,
          enabled,
        } = body

        await query(
          `INSERT INTO agent_rules
            (user_id, wallet_address, autopilot, scheduled_day, scheduled_amount,
             monthly_budget, streak_protection, idle_sweep_days, enabled, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
           ON CONFLICT (user_id) DO UPDATE SET
            wallet_address = EXCLUDED.wallet_address,
            autopilot = EXCLUDED.autopilot,
            scheduled_day = EXCLUDED.scheduled_day,
            scheduled_amount = EXCLUDED.scheduled_amount,
            monthly_budget = EXCLUDED.monthly_budget,
            streak_protection = EXCLUDED.streak_protection,
            idle_sweep_days = EXCLUDED.idle_sweep_days,
            enabled = EXCLUDED.enabled,
            updated_at = now()`,
          [
            userId,
            walletAddress,
            autopilot,
            scheduledDay,
            scheduledAmount,
            monthlyBudget,
            streakProtection,
            idleSweepDays,
            enabled,
          ]
        )

        logger.info('Saved agent rules', { userId, walletAddress, enabled })
        return Response.json({ success: true })
      } catch (err: any) {
        logger.error('Failed to save rules', err, { userId: body.userId })
        return Response.json(
          { error: err.message || 'Failed to save rules' },
          { status: 500 }
        )
      }
    }
  )
)
