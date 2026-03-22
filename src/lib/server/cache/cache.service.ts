/**
 * Cache Service
 *
 * High-level caching utilities with automatic serialization,
 * cache-aside pattern, and graceful error handling.
 */

import { redis } from "@/config/cache/redis";

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  USER: 300, // 5 minutes
  SESSION: 60, // 1 minute
  SHORT: 30, // 30 seconds
  MEDIUM: 600, // 10 minutes
  LONG: 3600, // 1 hour
  SOURCES: 3600, // 60 minutes (as requested - shorter TTL for freshness)
  TEMPLATES: 3600, // 60 minutes - templates don't change often
  DASHBOARD: 300, // 5 minutes - dashboard stats
} as const;

/**
 * Cache key prefixes for organization
 */
export const CacheKeys = {
  UserByClerkId: (clerkId: string) => `user:clerk:${clerkId}`,
  UserById: (userId: string) => `user:id:${userId}`,
  Session: (sessionId: string) => `session:${sessionId}`,
  CreditBalance: (userId: number) => `credits:balance:${userId}`,
  Subscription: (userId: number) => `subscription:${userId}`,
  PlansAll: "plans:all",
  PlanById: (planId: string) => `plans:${planId}`,
  UserBlobs: (userId: string) => `user:blobs:${userId}`,
  SourcesByUserId: (userId: string) => `sources:user:${userId}`,
  DashboardStats: (userId: string) => `dashboard:stats:${userId}`,
  TemplatesByContentType: (
    contentTypeId: string,
    userId: string,
    variantId?: string,
    filter?: string
  ) => {
    const parts = [`templates:${contentTypeId}:user:${userId}`];
    if (variantId) parts.push(`variant:${variantId}`);
    if (filter) parts.push(`filter:${filter}`);
    return parts.join(":");
  },
} as const;

export class CacheService {
  /**
   * Get a value from cache and parse as JSON
   * @param key - Cache key
   * @returns Parsed value or null
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;

      // If value is already an object (Upstash might auto-deserialize), return it directly
      if (typeof value === 'object' && value !== null) {
        return value as T;
      }

      // If it's a string, parse it as JSON
      if (typeof value === 'string') {
        // Handle edge case where string might be "[object Object]"
        if (value === '[object Object]') {
          console.warn(`Cache get: Invalid cached value for key "${key}" - appears to be unserialized object. Clearing cache.`);
          await this.del(key);
          return null;
        }
        return JSON.parse(value) as T;
      }

      // For other types, try to parse as JSON or return as-is
      return value as T;
    } catch (error) {
      // If JSON parse fails, the cached value might be corrupted - clear it
      if (error instanceof SyntaxError) {
        console.warn(`Cache get: Invalid JSON for key "${key}". Clearing corrupted cache entry.`);
        await this.del(key).catch(() => {}); // Best effort cleanup
      } else {
        console.error(`Cache get error for key "${key}":`, error);
      }
      return null;
    }
  }

  /**
   * Set a value in cache with JSON serialization
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (optional)
   */
  static async set(
    key: string,
    value: unknown,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.set(key, serialized, ttlSeconds);
    } catch (error) {
      console.error(`Cache set error for key "${key}":`, error);
    }
  }

  /**
   * Delete a key from cache
   * @param key - Cache key
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache del error for key "${key}":`, error);
    }
  }

  /**
   * Delete multiple keys from cache
   * @param keys - Array of cache keys
   */
  static async delMany(keys: string[]): Promise<void> {
    try {
      await redis.delMany(keys);
    } catch (error) {
      console.error(`Cache delMany error:`, error);
    }
  }

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   */
  static async exists(key: string): Promise<boolean> {
    try {
      return await redis.exists(key);
    } catch (error) {
      console.error(`Cache exists error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Cache-aside pattern wrapper
   *
   * Attempts to get value from cache. If not found, executes the function,
   * caches the result, and returns it.
   *
   * @param key - Cache key
   * @param fn - Function to execute if cache miss
   * @param ttlSeconds - Time to live in seconds
   * @param options - Optional configuration
   * @param options.forceRefresh - If true, skip cache lookup and refresh data
   * @returns The cached or freshly computed value
   *
   * @example
   * ```ts
   * // Normal usage - uses cache
   * const user = await CacheService.wrap(
   *   `user:${userId}`,
   *   () => prisma.user.findUnique({ where: { id: userId } }),
   *   CacheTTL.USER
   * );
   *
   * // Force refresh - bypasses cache and updates it
   * const freshUser = await CacheService.wrap(
   *   `user:${userId}`,
   *   () => prisma.user.findUnique({ where: { id: userId } }),
   *   CacheTTL.USER,
   *   { forceRefresh: true }
   * );
   * ```
   */
  static async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number,
    options?: { forceRefresh?: boolean }
  ): Promise<T> {
    // If force refresh is not requested, try to get from cache first
    if (!options?.forceRefresh) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Cache miss or force refresh - execute function
    try {
      const result = await fn();

      // Don't cache null/undefined results
      if (result !== null && result !== undefined) {
        await this.set(key, result, ttlSeconds);
      }

      return result;
    } catch (error) {
      // If the function fails, don't cache and rethrow
      console.error(`Cache wrap execution error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache by pattern (for related keys)
   * Note: This is a simple implementation. For pattern-based deletion,
   * consider using Redis SCAN or maintaining an index.
   *
   * @param keys - Array of keys to invalidate
   */
  static async invalidate(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.delMany(keys);
  }

  /**
   * Check if Redis is available
   */
  static isAvailable(): boolean {
    return redis.isAvailable();
  }
}

/**
 * Convenience function for cache-aside pattern
 */
export const cacheWrap = CacheService.wrap.bind(CacheService);

/**
 * Export the service as default
 */
export default CacheService;
