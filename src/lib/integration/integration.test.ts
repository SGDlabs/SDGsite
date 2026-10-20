import { afterEach, describe, expect, it } from "vitest";
import { RATE_LIMIT, resetRateLimits, takeRequest } from "./rate-limit";
import { bearerToken, generateToken, hashToken } from "./tokens";

describe("tokens", () => {
  it("are long, random and recognizable", () => {
    const a = generateToken();
    expect(a).toMatch(/^sdg_[A-Za-z0-9_-]{43}$/);
    expect(generateToken()).not.toBe(a);
  });

  it("are stored as SHA-256", () => {
    expect(hashToken("sdg_abc")).toBe(
      "d1136b0bd40a32a10052ed110cb65cc845ad44eabce0fec2b1d43e07c4538b46",
    );
    expect(hashToken("sdg_abc")).not.toBe(hashToken("sdg_abd"));
  });

  it("come from a Bearer header only", () => {
    expect(bearerToken("Bearer sdg_x1")).toBe("sdg_x1");
    expect(bearerToken("bearer   sdg_x1 ")).toBe("sdg_x1");
    expect(bearerToken("sdg_x1")).toBeNull();
    expect(bearerToken("Bearer eyJhbGciOi")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });
});

describe("rate limit", () => {
  afterEach(resetRateLimits);

  it("lets a token through until the window is full, then says when to retry", () => {
    for (let i = 0; i < RATE_LIMIT.requests; i++) expect(takeRequest("t", 1000).ok).toBe(true);
    expect(takeRequest("t", 61_000)).toEqual({ ok: false, retryAfterSeconds: 540 });
    // other tokens have their own window
    expect(takeRequest("u", 61_000).ok).toBe(true);
  });

  it("opens a new window when the old one ends", () => {
    for (let i = 0; i < RATE_LIMIT.requests; i++) takeRequest("t", 0);
    expect(takeRequest("t", RATE_LIMIT.windowMs).ok).toBe(true);
  });
});
