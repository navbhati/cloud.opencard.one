/**
 * IORedis Adapter
 *
 * Standard Redis client for traditional Redis servers.
 * Supports Azure Redis, AWS ElastiCache, self-hosted Redis, etc.
 * Uses TCP connection - best for long-running Node.js servers.
 */

import Redis from "ioredis";
import { RedisAdapter } from "../redis-adapter.interface";

export class IORedisAdapter implements RedisAdapter {
  private client: Redis | null = null;
  private available: boolean = false;

  constructor() {
    try {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        console.warn("IORedis: Missing REDIS_URL environment variable");
        return;
      }

      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      // Handle connection events
      this.client.on("error", (error) => {
        console.error("IORedis connection error:", error);
        this.available = false;
      });

      this.client.on("connect", () => {
        console.log("IORedis connected successfully");
        this.available = true;
      });

      // Attempt to connect
      this.client.connect().catch((error) => {
        console.error("Failed to connect to Redis:", error);
        this.available = false;
      });
    } catch (error) {
      console.error("Failed to initialize IORedis:", error);
      this.available = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`IORedis get error for key "${key}":`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error(`IORedis set error for key "${key}":`, error);
    }
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.setex(key, ttlSeconds, value);
    } catch (error) {
      console.error(`IORedis setex error for key "${key}":`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`IORedis del error for key "${key}":`, error);
    }
  }

  async delMany(keys: string[]): Promise<void> {
    if (!this.client || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch (error) {
      console.error(`IORedis delMany error:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`IORedis exists error for key "${key}":`, error);
      return false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Gracefully close the Redis connection
   * Useful for cleanup in tests or when shutting down
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}
