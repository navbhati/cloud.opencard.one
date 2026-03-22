# CreditInfo Component Usage Guide

A flexible, multi-variant component for displaying user credit and subscription information across different parts of the application.

## Component Location
`src/components/credit-info.tsx`

## 🔗 Related Documentation
- **[Complete Credit System Guide](../contexts/CREDIT_SYSTEM_GUIDE.md)** - Full credit management system with hooks and context
- **[Usage Examples](./examples/credit-usage-example.tsx)** - Real-world code examples

## ⚡ Quick Note
This component now uses the centralized `CreditProvider` context, which means:
- All instances automatically stay in sync
- Credits update in real-time across all variants
- Optimistic updates provide instant feedback
- No need to manually refresh data

## Variants

### 1. **header** - Compact Header Display
**Use Case**: In the header breadcrumb bar, top navigation

**Features**:
- Minimal, inline layout
- Shows credit count with icon
- Optional action button
- Takes minimal space

**Example**:
```tsx
<CreditInfo variant="header" />
<CreditInfo variant="header" showAction={false} />
```

**Display**: `💳 150 credits [Upgrade]`

---

### 2. **sidebar** - Sidebar Display
**Use Case**: In the application sidebar (default variant)

**Features**:
- Two-line compact layout
- Shows plan badge and credits
- Action button below
- Current default styling

**Example**:
```tsx
<CreditInfo variant="sidebar" />
<CreditInfo /> {/* sidebar is default */}
```

**Display**:
```
Plan      [Pro]
Credits   150
[Upgrade Button]
```

---

### 3. **menu** - Dropdown Menu Display
**Use Case**: Inside dropdown menus (e.g., user settings menu, profile dropdown)

**Features**:
- Ultra-compact inline layout
- Plan and credits in rows
- Minimal spacing for menus
- Optional compact button

**Example**:
```tsx
<CreditInfo variant="menu" />
<CreditInfo variant="menu" showAction={false} />
```

**Display**:
```
Plan     [Pro]
Credits  150
[Upgrade]
```

---

### 4. **page** - Full Card Display
**Use Case**: As a feature card on pages (dashboard, settings, etc.)

**Features**:
- Full card layout with header
- Large credit display with formatting
- Progress bar (optional)
- Status badge
- Descriptive text
- Prominent action buttons

**Example**:
```tsx
<CreditInfo variant="page" />
<CreditInfo variant="page" showProgress={true} />
<CreditInfo variant="page" showAction={false} />
```

**Display**: Full card with:
- Title: "Credits & Plan"
- Description text
- Large credit number with formatting
- Progress bar showing usage
- Status badge
- Full-width action button

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"header" \| "sidebar" \| "menu" \| "page"` | `"sidebar"` | Display variant |
| `className` | `string` | `undefined` | Additional CSS classes |
| `showAction` | `boolean` | `true` | Show Upgrade/Manage button |
| `showProgress` | `boolean` | `false` | Show progress bar (page variant only) |

## Features

### Automatic Behavior
- **Loading States**: Each variant has appropriate loading spinner
- **Smart Actions**: Automatically shows "Upgrade" for Free/Starter plans, "Manage" for others
- **Smart Routing**: Directs to `/plans` for upgrade, `/settings/billing` for management
- **Number Formatting**: Automatically formats large numbers with commas
- **Responsive**: Each variant is optimized for its use case

### Data Fetched
- Plan name and ID
- Current subscription status
- Credits remaining
- Credits total (optional, for progress calculation)

## Example Usage Scenarios

### 1. In Header/Breadcrumb Area
```tsx
// In your header component
<div className="flex items-center gap-4">
  <Breadcrumb />
  <CreditInfo variant="header" />
</div>
```

### 2. In Sidebar
```tsx
// In app-sidebar.tsx
<SidebarFooter>
  <CreditInfo variant="sidebar" />
</SidebarFooter>
```

### 3. In User Dropdown Menu
```tsx
// In nav-user.tsx
<DropdownMenu>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuSeparator />
    <CreditInfo variant="menu" />
    <DropdownMenuSeparator />
    <DropdownMenuItem>Sign Out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 4. On Dashboard Page
```tsx
// In dashboard page
<div className="grid gap-6 md:grid-cols-2">
  <CreditInfo variant="page" showProgress={true} />
  <OtherCard />
</div>
```

## Customization Examples

### Custom Styling
```tsx
<CreditInfo 
  variant="header" 
  className="border-l pl-4"
/>
```

### Without Action Button
```tsx
<CreditInfo 
  variant="page" 
  showAction={false} 
  showProgress={true}
/>
```

### Compact Menu Item
```tsx
<CreditInfo 
  variant="menu"
  showAction={false}
  className="border-b pb-2 mb-2"
/>
```

## API Endpoint
The component fetches data from:
```
GET /api/credits/check
```

Expected response:
```json
{
  "subscription": {
    "planName": "Pro",
    "planId": "pro",
    "status": "active"
  },
  "creditsRemaining": 150,
  "creditsTotal": 200
}
```

## Notes
- Component is client-side only (`"use client"`)
- Automatically fetches data on mount
- Gracefully handles loading and error states
- Logs errors to console for debugging
- Uses existing UI components (Button, Badge, Card, Progress)

