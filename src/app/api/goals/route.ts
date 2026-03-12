import { query } from '@/lib/db'
import { withSecurity } from '@/lib/validation'
import { logger } from '@/lib/retry'

export const GET = withSecurity(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const userIdParam = searchParams.get('userId')
  
  if (!userIdParam) {
    return Response.json({ error: 'userId required' }, { status: 400 })
  }
  
  try {
    const goals = await query(
      `SELECT id, name, deposited_amount, target_amount 
       FROM goals 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userIdParam]
    )
    
    logger.info('Fetched goals', { userId: userIdParam, count: goals.length })
    return Response.json(goals)
  } catch (err: any) {
    logger.error('Failed to fetch goals', err, { userId: userIdParam })
    return Response.json({ 
      error: err.message || 'Failed to fetch goals' 
    }, { status: 500 })
  }
})
