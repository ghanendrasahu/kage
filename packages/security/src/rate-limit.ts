export class RateLimitError extends Error {
  public retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimiterConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.cleanupInterval = setInterval(() => this.cleanup(), config.windowMs * 2);
  }

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + this.config.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt,
      };
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
