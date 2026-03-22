# Custom Toast Usage Guide

## Overview
A custom toast notification system built on top of Sonner that ensures only one toast is visible at a time. Each toast includes an X icon in the top-right corner for manual dismissal.

## Import

```typescript
import { toast } from "@/lib/toast";
```

## Basic Usage

### Toast Types

```typescript
// Success toast (green)
toast.success("Profile updated successfully!");

// Error toast (red)
toast.error("Failed to save changes");

// Info toast (blue)
toast.info("Thanks for your interest! It's coming soon.");

// Warning toast (yellow)
toast.warning("Your session will expire soon");

// Generic message toast
toast.message("Something happened");
```

## Advanced Usage

### With Description

```typescript
toast.success("Profile updated!", {
  description: "Your changes have been saved successfully.",
});
```

### With Custom Duration

```typescript
toast.error("Network error", {
  duration: 6000, // 6 seconds (default is 4000ms)
});
```

### With Custom Position

```typescript
toast.info("New message", {
  position: "top-right",
  // Available positions:
  // - top-left
  // - top-center  
  // - top-right
  // - bottom-left
  // - bottom-center
  // - bottom-right (default)
});
```

### With Action Button

```typescript
toast.warning("Unsaved changes", {
  description: "You have unsaved changes",
  action: {
    label: "Save",
    onClick: () => {
      // Handle save action
      saveChanges();
    },
  },
});
```

### Combining Multiple Options

```typescript
toast.success("File uploaded", {
  description: "Your file has been uploaded successfully.",
  duration: 5000,
  position: "bottom-right",
  action: {
    label: "View",
    onClick: () => {
      router.push("/files");
    },
  },
});
```

## Key Features

### 1. Auto-Dismissal
When a new toast appears, all previous toasts are automatically dismissed. This ensures only one toast is visible at a time, providing a cleaner user experience.

```typescript
toast.info("First message");
// User sees: First message

toast.success("Second message");
// First message is automatically dismissed
// User sees: Second message
```

### 2. Close Button
Every toast includes an X icon in the top-right corner that allows users to manually dismiss the notification at any time.

### 3. Consistent Defaults
- **Position**: `bottom-right`
- **Duration**: `4000ms` (4 seconds)

### 4. Type Safety
Full TypeScript support with proper type definitions for all options.

## Examples in Context

### Form Submission

```typescript
const handleSubmit = async (data: FormData) => {
  try {
    await saveProfile(data);
    toast.success("Profile saved!", {
      description: "Your profile has been updated successfully.",
    });
  } catch (error) {
    toast.error("Failed to save profile", {
      description: error.message,
    });
  }
};
```

### Feature Coming Soon

```typescript
const handleFeatureClick = () => {
  toast.info("Thanks for your interest! It's coming soon.");
};
```

### With Undo Action

```typescript
const handleDelete = (item: Item) => {
  deleteItem(item.id);
  
  toast.warning("Item deleted", {
    description: `${item.name} has been removed`,
    action: {
      label: "Undo",
      onClick: () => {
        restoreItem(item.id);
        toast.success("Item restored");
      },
    },
  });
};
```

## Current Implementation

The custom toast is currently used in:
- **Settings Layout**: For the "Insights" tab (coming soon notification)

## Technical Details

- Built on top of [Sonner](https://sonner.emilkowal.ski/)
- Uses Lucide React for the X icon
- Automatically dismisses previous toasts using `sonner.dismiss()`
- Fully customizable through the options parameter

