import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// In-memory fallback for development/testing
const memoryStore = new Map()

// Rate limiters for different endpoints
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : {
      // In-memory fallback for development
      limit: async (identifier: string) => {
        const key = `auth:${identifier}`
        const now = Date.now()
        const windowMs = 15 * 60 * 1000 // 15 minutes
        const limit = 5

        if (!memoryStore.has(key)) {
          memoryStore.set(key, [])
        }

        const attempts = memoryStore.get(key) as number[]
        const recentAttempts = attempts.filter(time => now - time < windowMs)
        
        if (recentAttempts.length >= limit) {
          return {
            success: false,
            limit,
            remaining: 0,
            reset: new Date(Math.min(...recentAttempts) + windowMs),
          }
        }

        recentAttempts.push(now)
        memoryStore.set(key, recentAttempts)

        return {
          success: true,
          limit,
          remaining: limit - recentAttempts.length,
          reset: new Date(now + windowMs),
        }
      },
    }

export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : {
      // In-memory fallback for development
      limit: async (identifier: string) => {
        const key = `api:${identifier}`
        const now = Date.now()
        const windowMs = 60 * 60 * 1000 // 1 hour
        const limit = 100

        if (!memoryStore.has(key)) {
          memoryStore.set(key, [])
        }

        const requests = memoryStore.get(key) as number[]
        const recentRequests = requests.filter(time => now - time < windowMs)
        
        if (recentRequests.length >= limit) {
          return {
            success: false,
            limit,
            remaining: 0,
            reset: new Date(Math.min(...recentRequests) + windowMs),
          }
        }

        recentRequests.push(now)
        memoryStore.set(key, recentRequests)

        return {
          success: true,
          limit,
          remaining: limit - recentRequests.length,
          reset: new Date(now + windowMs),
        }
      },
    }

export const strictRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 attempts per hour
      analytics: true,
      prefix: 'ratelimit:strict',
    })
  : {
      // In-memory fallback for development
      limit: async (identifier: string) => {
        const key = `strict:${identifier}`
        const now = Date.now()
        const windowMs = 60 * 60 * 1000 // 1 hour
        const limit = 3

        if (!memoryStore.has(key)) {
          memoryStore.set(key, [])
        }

        const attempts = memoryStore.get(key) as number[]
        const recentAttempts = attempts.filter(time => now - time < windowMs)
        
        if (recentAttempts.length >= limit) {
          return {
            success: false,
            limit,
            remaining: 0,
            reset: new Date(Math.min(...recentAttempts) + windowMs),
          }
        }

        recentAttempts.push(now)
        memoryStore.set(key, recentAttempts)

        return {
          success: true,
          limit,
          remaining: limit - recentAttempts.length,
          reset: new Date(now + windowMs),
        }
      },
    }

/**
 * Get identifier for rate limiting (IP + User Agent hash)
 */
export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] ?? request.headers.get('x-real-ip') ?? 'unknown'
  const userAgent = request.headers.get('user-agent') ?? 'unknown'
  
  // Create a simple hash of user agent to avoid storing full UA strings
  const uaHash = userAgent.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return `${ip}:${Math.abs(uaHash)}`
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: Request,
  limiter: typeof authRateLimiter,
  identifier?: string
) {
  const id = identifier ?? getRateLimitIdentifier(request)
  const result = await limiter.limit(id)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': (result.reset instanceof Date ? result.reset.getTime() : result.reset).toString(),
    },
  }
}