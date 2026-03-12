// Input validation utilities for the Nest Agent

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateWalletAddress(address: unknown): string {
  if (!address || typeof address !== 'string') {
    throw new ValidationError('Wallet address is required', 'walletAddress');
  }
  if (!ETH_ADDRESS_REGEX.test(address)) {
    throw new ValidationError('Invalid Ethereum address format', 'walletAddress');
  }
  return address.toLowerCase();
}

export function validateUserId(userId: unknown): string {
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('User ID is required', 'userId');
  }
  if (userId.length < 3 || userId.length > 128) {
    throw new ValidationError('User ID must be between 3 and 128 characters', 'userId');
  }
  // Prevent SQL injection patterns
  if (/['";\-\\]/.test(userId)) {
    throw new ValidationError('User ID contains invalid characters', 'userId');
  }
  return userId;
}

export function validateAmount(amount: unknown, min = 0.01, max = 1000000): number {
  if (amount === undefined || amount === null) {
    throw new ValidationError('Amount is required', 'amount');
  }
  const num = Number(amount);
  if (isNaN(num)) {
    throw new ValidationError('Amount must be a valid number', 'amount');
  }
  if (num < min) {
    throw new ValidationError(`Amount must be at least $${min}`, 'amount');
  }
  if (num > max) {
    throw new ValidationError(`Amount cannot exceed $${max.toLocaleString()}`, 'amount');
  }
  // Check for reasonable decimal places (USDC has 6)
  const decimals = (num.toString().split('.')[1] || '').length;
  if (decimals > 6) {
    throw new ValidationError('Amount cannot have more than 6 decimal places', 'amount');
  }
  return num;
}

export function validateGoalName(name: unknown): string {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Goal name is required', 'goalName');
  }
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    throw new ValidationError('Goal name must be between 1 and 100 characters', 'goalName');
  }
  // Prevent injection
  if (/[<>\"'\{\}\[\]]/.test(trimmed)) {
    throw new ValidationError('Goal name contains invalid characters', 'goalName');
  }
  return trimmed;
}

export function sanitizeReason(reason: unknown): string {
  if (!reason || typeof reason !== 'string') return '';
  return reason.trim().slice(0, 500).replace(/[<>\"'\{\}]/g, '');
}

// Middleware wrapper for API routes
export function withValidation<T extends Record<string, unknown>>(
  schema: { [K in keyof T]: (val: unknown) => T[K] },
  handler: (validated: T) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    try {
      let body: Record<string, unknown> = {};
      
      if (req.method !== 'GET') {
        try {
          body = await req.json();
        } catch {
          // Empty body is ok for some requests
        }
      }
      
      // Also check query params for GET requests
      const url = new URL(req.url);
      const queryParams: Record<string, unknown> = {};
      url.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
      
      const combined = { ...queryParams, ...body };
      
      const validated = {} as T;
      for (const [key, validator] of Object.entries(schema)) {
        try {
          (validated as any)[key] = validator(combined[key]);
        } catch (err) {
          if (err instanceof ValidationError) {
            return Response.json({ 
              error: err.message, 
              field: err.field 
            }, { status: 400 });
          }
          throw err;
        }
      }
      
      return await handler(validated);
    } catch (err) {
      console.error('Validation middleware error:', err);
      return Response.json({ 
        error: err instanceof Error ? err.message : 'Internal server error' 
      }, { status: 500 });
    }
  };
}

// Rate limiting store (simple in-memory, consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests = 10, 
  windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitStore.get(key);
  if (!current || now > current.resetAt) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  
  current.count++;
  return { allowed: true, remaining: maxRequests - current.count, resetAt: current.resetAt };
}

// CORS headers helper
export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const requestOrigin = origin || '';
  
  // Check if origin is allowed
  const isAllowed = allowedOrigins.some(allowed => 
    requestOrigin === allowed || allowed === '*'
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? requestOrigin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Security middleware
export function withSecurity(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    // Check rate limit
    const userId = req.headers.get('x-user-id') || 'anonymous';
    const rateLimit = checkRateLimit(userId);
    
    if (!rateLimit.allowed) {
      return Response.json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          ...getCorsHeaders(req.headers.get('origin') || undefined)
        }
      });
    }
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(req.headers.get('origin') || undefined)
      });
    }
    
    try {
      const response = await handler(req);
      
      // Add CORS and rate limit headers to response
      const newHeaders = new Headers(response.headers);
      const corsHeaders = getCorsHeaders(req.headers.get('origin') || undefined);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      newHeaders.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (err) {
      console.error('Handler error:', err);
      return Response.json({ 
        error: err instanceof Error ? err.message : 'Internal server error',
        requestId: crypto.randomUUID()
      }, { 
        status: 500,
        headers: getCorsHeaders(req.headers.get('origin') || undefined)
      });
    }
  };
}
