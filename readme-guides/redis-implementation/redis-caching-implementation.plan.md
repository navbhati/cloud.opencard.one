# Redis Caching Implementation

## Overview

Add production-ready Redis caching using Upstash for Vercel deployment with local development support. Cache user queries with intelligent invalidation and TTL strategies.

## Implementation Steps

### 1. Install Dependencies

```bash
npm install @upstash/redis ioredis
npm install -D @types/ioredis
```

### 2. Setup Configuration Files

**Create `.env.example`** with Redis connection variables:

```
REDIS_PROVIDER=upstash  # Options: upstash, azure, standard
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=  # For Azure/standard Redis (connection string)
```

### 3. Create Redis Adapter Pattern

**Create `src/lib/server/cache/redis-adapter.interface.ts`**

- Define common Redis interface (get, set, del, setex, exists)
- Type-safe contracts all adapters must implement

**Create `src/lib/server/cache/adapters/upstash.adapter.ts`**

- Upstash REST API implementation
- Serverless-friendly for Vercel

**Create `src/lib/server/cache/adapters/ioredis.adapter.ts`**

- Standard Redis implementation for Azure/self-hosted
- TCP connection-based

**Create `src/config/cache/redis.ts`**

- Factory pattern to select adapter based on `REDIS_PROVIDER` env
- Singleton pattern for connection reuse
- Graceful fallback if no Redis configured

### 4. Create Cache Service (`src/lib/server/cache/cache.service.ts`)

Implement generic caching utilities with:

- `get(key)` - Retrieve cached data
- `set(key, value, ttl)` - Store with expiration
- `del(key)` - Manual invalidation
- `wrap(key, fn, ttl)` - Cache-aside pattern wrapper
- Error handling (fail gracefully if Redis unavailable)
- JSON serialization/deserialization
- Configurable TTLs (5min for user data, 1min for sessions)

### 5. Update User Service (`src/lib/server/services/user.service.ts`)

Wrap existing functions with caching:

- **getUserByClerkId**: Cache with key `user:clerk:{clerkId}`, TTL 5 min
- **getUserProfile**: Cache with key `user:profile:{id}`, TTL 5 min
- **syncUserWithClerk**: Invalidate cache on user update

### 6. Cache Key Strategy

Consistent naming pattern:

```
user:clerk:{clerkId}
user:profile:{userId}
```

### 7. Environment Setup

Add instructions for:

- Local dev: Optional Redis (graceful degradation)
- Production: Upstash Redis setup on Vercel

## Key Files

- `src/config/cache/redis.ts` - Redis client
- `src/lib/server/cache/cache.service.ts` - Cache utilities
- `src/lib/server/services/user.service.ts` - Updated with caching
- `.env.example` - Configuration template

## Best Practices Applied

- Graceful degradation (app works without Redis)
- Automatic cache invalidation on mutations
- Type-safe implementation
- Minimal code changes to existing services
- Production-ready error handling
- Serverless-optimized (Upstash REST API)