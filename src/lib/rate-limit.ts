import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { requireDatabase } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";

export async function consumeRateLimit(
  request: Request | NextRequest,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters to protect public endpoints.");
  }
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = request.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
  const keyHash = createHmac("sha256", secret)
    .update(`${scope}:${address}`)
    .digest("hex");
  const now = Math.floor(Date.now() / 1000);
  const expiredBefore = now - windowSeconds;
  const database = requireDatabase();

  await database
    .insert(rateLimits)
    .values({ keyHash, windowStartedAt: now, requestCount: 1 })
    .onConflictDoUpdate({
      target: rateLimits.keyHash,
      set: {
        windowStartedAt: sql`CASE WHEN ${rateLimits.windowStartedAt} <= ${expiredBefore} THEN ${now} ELSE ${rateLimits.windowStartedAt} END`,
        requestCount: sql`CASE WHEN ${rateLimits.windowStartedAt} <= ${expiredBefore} THEN 1 ELSE ${rateLimits.requestCount} + 1 END`,
      },
    });

  const [bucket] = await database
    .select({
      startedAt: rateLimits.windowStartedAt,
      count: rateLimits.requestCount,
    })
    .from(rateLimits)
    .where(sql`${rateLimits.keyHash} = ${keyHash}`)
    .limit(1);
  if (!bucket) throw new Error("Rate-limit counter was not available.");

  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: Math.max(1, bucket.startedAt + windowSeconds - now),
  };
}
