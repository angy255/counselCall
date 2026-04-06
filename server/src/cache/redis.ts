import { Redis } from "@upstash/redis";
import { env } from "../config/env";

const TTL_SECONDS = 60;

type CachedAvailability = {
  isBlocked: boolean;
  ranges: Array<{ startTime: string; endTime: string }>;
};

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function availabilityKey(attorneyId: string, date: string): string {
  return `availability:${attorneyId}:${date}`;
}

function attorneyCacheSetKey(attorneyId: string): string {
  return `availability_keys:${attorneyId}`;
}

export async function getCachedAvailability(
  attorneyId: string,
  date: string,
): Promise<CachedAvailability | null> {
  if (!redis) return null;
  const key = availabilityKey(attorneyId, date);
  try {
    const value = await redis.get<CachedAvailability>(key);
    return value ?? null;
  } catch {
    return null;
  }
}

export async function setCachedAvailability(
  attorneyId: string,
  date: string,
  data: CachedAvailability,
): Promise<void> {
  if (!redis) return;
  const key = availabilityKey(attorneyId, date);
  const setKey = attorneyCacheSetKey(attorneyId);
  try {
    await redis.set(key, data, { ex: TTL_SECONDS });
    await redis.sadd(setKey, key);
    await redis.expire(setKey, 60 * 10);
  } catch {
    // Best-effort cache.
  }
}

export async function invalidateAttorneyAvailabilityCache(
  attorneyId: string,
): Promise<void> {
  if (!redis) return;
  const setKey = attorneyCacheSetKey(attorneyId);
  try {
    const keys = await redis.smembers<string[]>(setKey);
    if (Array.isArray(keys) && keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.del(setKey);
  } catch {
    // Best-effort cache.
  }
}
