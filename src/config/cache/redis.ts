/**
 * Redis Client Factory
 *
 * Creates the appropriate Redis adapter based on configuration.
 * Supports multiple providers with automatic failover to no-op mode.
 */

import { RedisAdapter } from "@/lib/server/cache/redis-adapter.interface";
import { UpstashAdapter } from "@/lib/server/cache/adapters/upstash.adapter";
import { IORedisAdapter } from "@/lib/server/cache/adapters/ioredis.adapter";

/**
 * No-op adapter for when Redis is not configured
 * Allows the application to work without caching
 */
class NoOpAdapter implements RedisAdapter {
  async get(): Promise<string | null> {
    return null;
  }
  async set(): Promise<void> {}
  async setex(): Promise<void> {}
  async del(): Promise<void> {}
  async delMany(): Promise<void> {}
  async exists(): Promise<boolean> {
    return false;
  }
  isAvailable(): boolean {
    return false;
  }
}

let redisInstance: RedisAdapter | null = null;

/**
 * Get or create the Redis client instance (singleton pattern)
 */
export function getRedisClient(): RedisAdapter {
  if (redisInstance) {
    return redisInstance;
  }

  const provider = process.env.REDIS_PROVIDER?.toLowerCase() || "upstash";

  console.log(`Initializing Redis with provider: ${provider}`);

  switch (provider) {
    case "upstash":
      redisInstance = new UpstashAdapter();
      break;

    case "azure":
    case "standard":
    case "ioredis":
      redisInstance = new IORedisAdapter();
      break;

    default:
      console.warn(
        `Unknown Redis provider "${provider}". Falling back to no-op mode.`
      );
      redisInstance = new NoOpAdapter();
  }

  if (!redisInstance.isAvailable()) {
    console.warn(
      "Redis is not available. Application will run without caching."
    );
  } else {
    console.log("Redis initialized successfully");
  }

  return redisInstance;
}

/**
 * Default export for easy importing
 */
export const redis = getRedisClient();
