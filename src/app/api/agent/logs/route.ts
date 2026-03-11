import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })
  const logs = await sql`
    SELECT * FROM agent_logs
    WHERE user_id = ${userId}
    ORDER BY executed_at DESC
    LIMIT 30
  `
  return Response.json(logs)
}
