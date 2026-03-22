/**
 * Redis Adapter Interface
 *
 * Common interface that all Redis adapters must implement.
 * Allows switching between different Redis providers (Upstash, Azure, etc.)
 * without changing application code.
 */

export interface RedisAdapter {
  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns The cached value or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value in cache with optional expiration
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (optional)
   */
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;

  /**
   * Set a value with expiration time
   * @param key - Cache key
   * @param ttlSeconds - Time to live in seconds
   * @param value - Value to cache
   */
  setex(key: string, ttlSeconds: number, value: string): Promise<void>;

  /**
   * Delete a key from cache
   * @param key - Cache key
   */
  del(key: string): Promise<void>;

  /**
   * Delete multiple keys from cache
   * @param keys - Array of cache keys
   */
  delMany(keys: string[]): Promise<void>;

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   * @returns true if key exists, false otherwise
   */
  exists(key: string): Promise<boolean>;

  /**
   * Check if the adapter is properly configured and ready to use
   */
  isAvailable(): boolean;
}
