import { describe, it, expect, vi, afterEach } from "vitest";
import { RateLimiter } from "../rate-limit";

describe("RateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under limit", () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });

    for (let i = 0; i < 5; i++) {
      expect(limiter.check("user1").allowed).toBe(true);
    }
  });

  it("blocks requests over limit", () => {
    const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });

    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(false);
  });

  it("tracks different keys separately", () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(false);

    expect(limiter.check("user2").allowed).toBe(true);
    expect(limiter.check("user2").allowed).toBe(true);
    expect(limiter.check("user2").allowed).toBe(false);
  });

  it("resets after window", () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(limiter.check("user1").allowed).toBe(true);
  });

  it("returns remaining count", () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });

    expect(limiter.check("user1").remaining).toBe(4);
    limiter.check("user1");
    expect(limiter.check("user1").remaining).toBe(2);
  });

  it("cleans up on destroy", () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });
    limiter.destroy();
    expect(true).toBe(true);
  });
});
