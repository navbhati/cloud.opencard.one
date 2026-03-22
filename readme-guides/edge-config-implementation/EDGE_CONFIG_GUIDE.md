# Edge Config Implementation Guide

## What is Edge Config?

Vercel Edge Config is a global, ultra-low latency data store for managing feature flags, configuration values, and A/B testing without deploying code changes. Access configuration in < 1ms globally.

## Quick Setup

### 1. Install Package

```bash
npm install @vercel/edge-config
```

### 2. Create Edge Config in Vercel

1. Go to Vercel Dashboard → Storage → Edge Config
2. Create new Edge Config store
3. Copy connection string

### 3. Set Environment Variable

```bash
# .env.local and Vercel
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxxxx
```

### 4. Add Configuration Values

In Vercel Edge Config dashboard:

```json
{
  "maintenanceMode": false,
  "showBetaFeatures": true,
  "maxUploadSize": 50,
  "apiEndpoint": "https://api.example.com"
}
```

## Implementation

### Three Core Files

#### 1. Provider (`src/providers/EdgeConfigProvider.tsx`)

```typescript
"use client";

import React, { createContext, useContext, useState } from "react";

type EdgeConfigs = Record<string, boolean | string | number>;
const EdgeConfigContext = createContext<EdgeConfigs | null>(null);

export function EdgeConfigProvider({
  initialEdgeConfigs,
  children,
}: {
  initialEdgeConfigs: EdgeConfigs;
  children: React.ReactNode;
}) {
  const [edgeConfigs] = useState(initialEdgeConfigs);
  return (
    <EdgeConfigContext.Provider value={edgeConfigs}>
      {children}
    </EdgeConfigContext.Provider>
  );
}

export function useEdgeConfig<T = boolean>(key: string, fallback?: T): T {
  const edgeConfigs = useContext(EdgeConfigContext) ?? {};
  return (edgeConfigs[key] as T) ?? (fallback as T);
}
```

#### 2. App Providers (`src/app/providers.tsx`)

```typescript
"use client";

import { EdgeConfigProvider } from "@/providers/EdgeConfigProvider";

export function Providers({
  children,
  edgeConfigs,
}: {
  children: React.ReactNode;
  edgeConfigs: Record<string, boolean | string | number>;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <EdgeConfigProvider initialEdgeConfigs={edgeConfigs}>
        <TooltipProvider>
          <CreditProvider enableOptimisticUpdates={true}>
            {children}
          </CreditProvider>
        </TooltipProvider>
      </EdgeConfigProvider>
    </ThemeProvider>
  );
}
```

#### 3. Root Layout (`src/app/layout.tsx`)

```typescript
import { getAll } from "@vercel/edge-config";

export default async function RootLayout({ children }) {
  const edgeConfigs = await getAll();
  
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <Providers
            edgeConfigs={
              edgeConfigs as Record<string, boolean | string | number>
            }
          >
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

## Usage Examples

### Feature Flag

```typescript
"use client";

import { useEdgeConfig } from "@/providers/EdgeConfigProvider";

export function NewFeature() {
  const isEnabled = useEdgeConfig("newFeature", false);
  
  if (!isEnabled) return null;
  
  return <div>New Feature Content</div>;
}
```

### Maintenance Mode

```typescript
export function App() {
  const maintenance = useEdgeConfig("maintenanceMode", false);
  
  if (maintenance) {
    return <MaintenancePage />;
  }
  
  return <NormalApp />;
}
```

### Dynamic Configuration

```typescript
export function UploadForm() {
  const maxSize = useEdgeConfig<number>("maxUploadSize", 50);
  const allowedFormats = useEdgeConfig<string>("allowedFormats", "jpg,png,pdf");
  
  return (
    <input 
      type="file" 
      accept={allowedFormats}
      max={maxSize * 1024 * 1024} 
    />
  );
}
```

### A/B Testing

```typescript
export function ExperimentComponent() {
  const variant = useEdgeConfig<string>("experimentVariant", "control");
  
  switch (variant) {
    case "variantA": return <VariantA />;
    case "variantB": return <VariantB />;
    default: return <Control />;
  }
}
```

### Server-Side Usage (API Routes)

```typescript
import { get } from "@vercel/edge-config";

export async function GET(request: NextRequest) {
  const featureEnabled = await get("myFeature");
  
  if (featureEnabled === false) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }
  
  // Continue with logic
}
```

## Hook API

```typescript
useEdgeConfig<T = boolean>(key: string, fallback?: T): T
```

**Supported Types:**
- `boolean` - Feature flags
- `string` - Text configuration
- `number` - Numeric values

**Examples:**

```typescript
// Boolean (default)
const flag = useEdgeConfig("feature", false);

// String with type parameter
const url = useEdgeConfig<string>("apiUrl", "https://default.com");

// Number with type parameter
const limit = useEdgeConfig<number>("maxSize", 100);
```

## Best Practices

### ✅ Do

```typescript
// Always provide fallbacks
const feature = useEdgeConfig("newFeature", false);

// Use descriptive names
const isMaintenanceMode = useEdgeConfig("maintenanceMode", false);

// Specify types for non-boolean values
const maxSize = useEdgeConfig<number>("maxUploadSize", 50);

// Use for global configuration
const rateLimit = useEdgeConfig<number>("apiRateLimit", 100);
```

### ❌ Don't

```typescript
// No fallback (will be undefined if key missing)
const feature = useEdgeConfig("feature");

// Store sensitive data
// Edge Config is accessible client-side - don't store API keys, passwords, etc.

// Store user-specific data
// Use database for user data, not Edge Config

// Store large datasets
// Keep configs lean - 512KB limit per store
```

## Updating Configuration

1. Go to Vercel Dashboard → Storage → Edge Config
2. Edit JSON configuration
3. Save changes
4. Changes propagate globally in ~1 second
5. **No deployment needed!**

## Architecture Flow

```
Vercel Edge Config (Global CDN)
        ↓
layout.tsx (Server) → Fetches all configs via getAll()
        ↓
providers.tsx (Client) → Receives configs as props
        ↓
EdgeConfigProvider → Stores in React Context
        ↓
useEdgeConfig() hook → Access anywhere in app
```

## Performance

- **Latency**: < 1ms globally
- **Propagation**: ~1 second for updates
- **Size Limit**: 512KB per store
- **Cost**: Free (included with Vercel)
- **Distribution**: Global edge network

## Troubleshooting

### Config values are undefined

**Solution:**
- Check key name spelling matches exactly
- Ensure fallback value is provided
- Verify config exists in Vercel dashboard
- Check `EDGE_CONFIG` environment variable is set

### Changes not reflecting

**Solution:**
- Wait 1-2 seconds for global propagation
- Clear browser cache and reload
- Verify changes saved in Vercel dashboard

### TypeScript errors

**Solution:**
```typescript
// Use explicit type instead of any
edgeConfigs: Record<string, boolean | string | number>
```

### Hydration errors

**Solution:**
- Configs are fetched server-side only
- Don't refetch on client
- Use the provided Context

## Testing

### Unit Tests

```typescript
import { EdgeConfigProvider } from "@/providers/EdgeConfigProvider";
import { render } from "@testing-library/react";

test("component with feature enabled", () => {
  const mockConfig = { 
    newFeature: true,
    maxSize: 50 
  };
  
  render(
    <EdgeConfigProvider initialEdgeConfigs={mockConfig}>
      <YourComponent />
    </EdgeConfigProvider>
  );
  
  // Your assertions
});
```

### Local Development

```bash
# Pull from Vercel
vercel env pull .env.local

# Or mock in code for development
const edgeConfigs = process.env.NODE_ENV === 'development'
  ? { newFeature: true, maxSize: 50 }
  : await getAll();
```

## Use Cases

| Use Case | Example Key | Type | Example Value |
|----------|------------|------|---------------|
| Feature Flag | `newDashboard` | boolean | `true` |
| Maintenance Mode | `maintenanceMode` | boolean | `false` |
| Upload Limit | `maxUploadSize` | number | `50` |
| API Endpoint | `apiEndpoint` | string | `"https://api.com"` |
| Rate Limit | `rateLimit` | number | `100` |
| A/B Variant | `experimentVariant` | string | `"variantA"` |
| Rollout % | `rolloutPercent` | number | `25` |

## Security

### ✅ Safe to Store
- Feature flags (boolean)
- A/B test variants
- Public configuration
- Rate limits
- UI settings

### ❌ Never Store
- API keys
- Passwords
- User data
- Secrets
- Database credentials

**Reason**: Edge Config values are accessible client-side through the Context.

## Summary

**What's Implemented:**
- ✅ React Context provider
- ✅ Type-safe hook
- ✅ Server-side fetching
- ✅ Global access to configs
- ✅ Fallback support

**Key Benefits:**
- Ultra-low latency (< 1ms)
- No deployment for config changes
- Global edge distribution
- Type-safe implementation
- Simple API

**Ready to Use**: Import `useEdgeConfig` and start using feature flags immediately!

---

**Documentation**: [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)  
**Status**: ✅ Production Ready

