import { query } from '@/lib/db'
import { validateUserId, withSecurity } from '@/lib/validation'
import { logger } from '@/lib/retry'

export const GET = withSecurity(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const userIdParam = searchParams.get('userId')
  
  if (!userIdParam) {
    return Response.json({ error: 'userId required' }, { status: 400 })
  }
  
  try {
    const userId = validateUserId(userIdParam)
    const logs = await query(
      `SELECT * FROM agent_logs
       WHERE user_id = $1
       ORDER BY executed_at DESC
       LIMIT 30`,
      [userId]
    )
    
    logger.info('Fetched agent logs', { userId, count: logs.length })
    return Response.json(logs)
  } catch (err: any) {
    logger.error('Failed to fetch logs', err, { userId: userIdParam })
    return Response.json({ 
      error: err.message || 'Failed to fetch logs' 
    }, { status: 500 })
  }
})
