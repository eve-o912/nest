// Retry logic and error handling utilities

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export class RetryableError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'socket hang up', 'fetch failed']
  } = options;

  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // Check if error is retryable
      const isRetryable = retryableErrors.some(pattern => 
        lastError!.message.includes(pattern) || 
        (lastError!.cause instanceof Error && lastError!.cause.message.includes(pattern))
      );
      
      if (!isRetryable && !(err instanceof RetryableError)) {
        throw new NonRetryableError(lastError.message);
      }
      
      if (attempt === maxAttempts) {
        throw new RetryableError(
          `Failed after ${maxAttempts} attempts: ${lastError.message}`,
          lastError
        );
      }
      
      // Exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Circuit breaker pattern for external APIs
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

export async function withCircuitBreaker<T>(
  key: string,
  operation: () => Promise<T>,
  options: {
    failureThreshold?: number;
    resetTimeoutMs?: number;
  } = {}
): Promise<T> {
  const { failureThreshold = 5, resetTimeoutMs = 60000 } = options;
  
  const breaker = circuitBreakers.get(key) || {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED'
  };
  
  // Check if we should transition from OPEN to HALF_OPEN
  if (breaker.state === 'OPEN') {
    if (Date.now() - breaker.lastFailureTime > resetTimeoutMs) {
      breaker.state = 'HALF_OPEN';
      breaker.failures = 0;
    } else {
      throw new Error(`Circuit breaker is OPEN for ${key}. Try again later.`);
    }
  }
  
  try {
    const result = await operation();
    
    // Success - reset on HALF_OPEN, keep closed otherwise
    if (breaker.state === 'HALF_OPEN') {
      breaker.state = 'CLOSED';
      breaker.failures = 0;
    }
    
    circuitBreakers.set(key, breaker);
    return result;
  } catch (err) {
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    
    if (breaker.failures >= failureThreshold) {
      breaker.state = 'OPEN';
    }
    
    circuitBreakers.set(key, breaker);
    throw err;
  }
}

// Database transaction wrapper
export async function withTransaction<T>(
  sql: any,
  operation: (trx: any) => Promise<T>
): Promise<T> {
  const trx = await sql.begin();
  try {
    const result = await operation(trx);
    await trx.commit();
    return result;
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

// Timeout wrapper
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  context?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms${context ? ` (${context})` : ''}`));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// Error classification for better handling
export function classifyError(err: unknown): {
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  retryable: boolean;
  message: string;
} {
  const message = err instanceof Error ? err.message : String(err);
  
  // Network errors
  if (message.includes('ECONNRESET') || 
      message.includes('ETIMEDOUT') || 
      message.includes('ECONNREFUSED') ||
      message.includes('socket hang up') ||
      message.includes('fetch failed')) {
    return { type: 'network', retryable: true, message };
  }
  
  // Auth errors
  if (message.includes('401') || 
      message.includes('403') || 
      message.includes('unauthorized') ||
      message.includes('authentication')) {
    return { type: 'auth', retryable: false, message };
  }
  
  // Validation errors
  if (message.includes('400') || 
      message.includes('validation') ||
      message.includes('invalid')) {
    return { type: 'validation', retryable: false, message };
  }
  
  // Server errors
  if (message.includes('500') || 
      message.includes('502') || 
      message.includes('503') ||
      message.includes('504')) {
    return { type: 'server', retryable: true, message };
  }
  
  return { type: 'unknown', retryable: false, message };
}

// Logger with structured output
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta }));
  },
  error: (message: string, err: unknown, meta?: Record<string, unknown>) => {
    const error = err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : { error: String(err) };
    console.error(JSON.stringify({ level: 'error', message, timestamp: new Date().toISOString(), error, ...meta }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta }));
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.DEBUG === 'true') {
      console.log(JSON.stringify({ level: 'debug', message, timestamp: new Date().toISOString(), ...meta }));
    }
  }
};
