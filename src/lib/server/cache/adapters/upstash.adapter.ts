/**
 * Upstash Redis Adapter
 *
 * REST API-based Redis client optimized for serverless environments.
 * Perfect for Vercel deployments and edge functions.
 */

import { Redis } from "@upstash/redis";
import { RedisAdapter } from "../redis-adapter.interface";

export class UpstashAdapter implements RedisAdapter {
  private client: Redis | null = null;
  private available: boolean = false;

  constructor() {
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        console.warn(
          "Upstash Redis: Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN"
        );
        return;
      }

      this.client = new Redis({
        url,
        token,
      });

      this.available = true;
    } catch (error) {
      console.error("Failed to initialize Upstash Redis:", error);
      this.available = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.available) return null;
    try {
      // Upstash Redis can return objects directly, so we get without type constraint
      const value = await this.client.get(key);
      
      // If value is null or undefined, return null
      if (value === null || value === undefined) return null;
      
      // If it's already a string, return it
      if (typeof value === 'string') return value;
      
      // If it's an object, serialize it to JSON string
      // This handles cases where Upstash auto-deserialized JSON
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      
      // For other types, convert to string
      return String(value);
    } catch (error) {
      // Only log if Redis was previously available (avoid spam when Redis is down)
      if (this.available) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Don't log DNS/network errors repeatedly - Redis is likely not configured
        if (!errorMessage.includes('ENOTFOUND') && !errorMessage.includes('fetch failed')) {
          console.error(`Upstash Redis get error for key "${key}":`, error);
        }
      }
      // Mark as unavailable if it was a connection error
      if (error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed'))) {
        this.available = false;
      }
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.available) return;
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      // Only log if Redis was previously available (avoid spam when Redis is down)
      if (this.available) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Don't log DNS/network errors repeatedly - Redis is likely not configured
        if (!errorMessage.includes('ENOTFOUND') && !errorMessage.includes('fetch failed')) {
          console.error(`Upstash Redis set error for key "${key}":`, error);
        }
      }
      // Mark as unavailable if it was a connection error
      if (error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed'))) {
        this.available = false;
      }
    }
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    if (!this.client || !this.available) return;
    try {
      await this.client.setex(key, ttlSeconds, value);
    } catch (error) {
      // Only log if Redis was previously available (avoid spam when Redis is down)
      if (this.available) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Don't log DNS/network errors repeatedly - Redis is likely not configured
        if (!errorMessage.includes('ENOTFOUND') && !errorMessage.includes('fetch failed')) {
          console.error(`Upstash Redis setex error for key "${key}":`, error);
        }
      }
      // Mark as unavailable if it was a connection error
      if (error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed'))) {
        this.available = false;
      }
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.available) return;
    try {
      await this.client.del(key);
    } catch (error) {
      // Silently fail - cache invalidation is best-effort
      // Don't spam logs if Redis is not available
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('ENOTFOUND') && !errorMessage.includes('fetch failed')) {
        console.error(`Upstash Redis del error for key "${key}":`, error);
      }
      if (error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed'))) {
        this.available = false;
      }
    }
  }

  async delMany(keys: string[]): Promise<void> {
    if (!this.client || !this.available || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch (error) {
      // Silently fail - cache invalidation is best-effort
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('ENOTFOUND') && !errorMessage.includes('fetch failed')) {
        console.error(`Upstash Redis delMany error:`, error);
      }
      if (error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed'))) {
        this.available = false;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.available) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      // Silently fail - existence check is best-effort
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('ENOTFOUND') && !errorMessage.includes('fetch failed')) {
        console.error(`Upstash Redis exists error for key "${key}":`, error);
      }
      if (error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed'))) {
        this.available = false;
      }
      return false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }
}
