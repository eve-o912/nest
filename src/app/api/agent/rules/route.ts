import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })
  const rows = await sql`SELECT * FROM agent_rules WHERE user_id = ${userId}` 
  return Response.json(rows[0] ?? null)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, walletAddress, autopilot, scheduledDay, scheduledAmount,
          monthlyBudget, streakProtection, idleSweepDays, enabled } = body

  // Reset spent_this_month if new month
  const now = new Date()
  await sql`
    INSERT INTO agent_rules
      (user_id, wallet_address, autopilot, scheduled_day, scheduled_amount,
       monthly_budget, streak_protection, idle_sweep_days, enabled, updated_at)
    VALUES
      (${userId}, ${walletAddress}, ${autopilot}, ${scheduledDay}, ${scheduledAmount},
       ${monthlyBudget}, ${streakProtection}, ${idleSweepDays}, ${enabled}, now())
    ON CONFLICT (user_id) DO UPDATE SET
      wallet_address = EXCLUDED.wallet_address,
      autopilot = EXCLUDED.autopilot,
      scheduled_day = EXCLUDED.scheduled_day,
      scheduled_amount = EXCLUDED.scheduled_amount,
      monthly_budget = EXCLUDED.monthly_budget,
      streak_protection = EXCLUDED.streak_protection,
      idle_sweep_days = EXCLUDED.idle_sweep_days,
      enabled = EXCLUDED.enabled,
      updated_at = now()
  `
  return Response.json({ success: true })
}
