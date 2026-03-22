import { toast as sonnerToast } from "sonner";
import {
  X,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning" | "message";

interface ToastOptions {
  message: string;
  type?: ToastType;
  description?: string;
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Track last toast to prevent duplicates
let lastToastMessage = "";
let lastToastTime = 0;

/**
 * Get icon color based on toast type
 */
const getIconColor = (type: ToastType): string => {
  switch (type) {
    case "error":
      return "#ef4444"; // red-500
    case "success":
      return "#22c55e"; // green-500
    case "warning":
      return "#f59e0b"; // amber-500
    case "info":
      return "#3b82f6"; // blue-500
    case "message":
    default:
      return "#6b7280"; // gray-500
  }
};

/**
 * Get icon component based on toast type with color
 */
const getIcon = (type: ToastType) => {
  const iconColor = getIconColor(type);
  const iconProps = {
    className: "h-5 w-5",
    style: { color: iconColor },
  };

  switch (type) {
    case "error":
      return <XCircle {...iconProps} />;
    case "success":
      return <CheckCircle2 {...iconProps} />;
    case "warning":
      return <AlertTriangle {...iconProps} />;
    case "info":
      return <Info {...iconProps} />;
    case "message":
    default:
      return <MessageSquare {...iconProps} />;
  }
};

/**
 * Custom toast utility that dismisses all previous toasts before showing a new one
 * Ensures only one toast is visible at a time
 */
export const showToast = ({
  message,
  type = "message",
  description,
  duration = 4000,
  position = "bottom-right",
  action,
}: ToastOptions) => {
  // Prevent duplicate toasts with same message within 500ms
  const now = Date.now();
  if (message === lastToastMessage && now - lastToastTime < 500) {
    return;
  }

  lastToastMessage = message;
  lastToastTime = now;

  // Dismiss all existing toasts
  sonnerToast.dismiss();

  const iconColor = getIconColor(type);
  const icon = getIcon(type);

  // Common options for all toast types with close button
  const options = {
    description,
    duration,
    position,
    action,
    icon,
    className: "text-xs font-light ",
  };

  // Small delay to ensure dismiss completes before showing new toast
  setTimeout(() => {
    // Show the appropriate toast type
    switch (type) {
      case "success":
        return sonnerToast.success(message, options);
      case "error":
        return sonnerToast.error(message, options);
      case "info":
        return sonnerToast.info(message, options);
      case "warning":
        return sonnerToast.warning(message, options);
      case "message":
      default:
        return sonnerToast(message, options);
    }
  }, 50);
};

// Promise-based toast helper, passthrough to sonner's promise API
function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  },
  options?: {
    duration?: number;
    position?: ToastOptions["position"];
  }
) {
  // `sonnerToast` is the imported toast from "sonner", which exposes `.promise`
  return (sonnerToast as any).promise(promise, messages, options);
}

// Convenience methods for different toast types
export const toast = {
  success: (
    message: string,
    options?: Omit<ToastOptions, "message" | "type">
  ) => showToast({ message, type: "success", ...options }),

  error: (message: string, options?: Omit<ToastOptions, "message" | "type">) =>
    showToast({ message, type: "error", ...options }),

  info: (message: string, options?: Omit<ToastOptions, "message" | "type">) =>
    showToast({ message, type: "info", ...options }),

  warning: (
    message: string,
    options?: Omit<ToastOptions, "message" | "type">
  ) => showToast({ message, type: "warning", ...options }),

  message: (
    message: string,
    options?: Omit<ToastOptions, "message" | "type">
  ) => showToast({ message, type: "message", ...options }),

  // Expose promise API in a JSX-safe way
  promise: toastPromise,
};
