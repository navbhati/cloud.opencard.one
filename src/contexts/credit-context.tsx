"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";

interface SubscriptionInfo {
  planName: string;
  planId: string;
  status: string;
  creditsRemaining: number;
  creditsTotal?: number;
}

interface CreditContextType {
  subscription: SubscriptionInfo | null;
  loading: boolean;
  error: Error | null;
  refreshCredits: () => Promise<void>;
  deductCredits: (amount: number) => void;
  updateCredits: (credits: number) => void;
  lastUpdated: Date | null;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

interface CreditProviderProps {
  children: ReactNode;
  /**
   * Auto-refresh interval in milliseconds (0 to disable)
   * @default 0 (disabled)
   */
  autoRefreshInterval?: number;
  /**
   * Enable optimistic updates for better UX
   * @default true
   */
  enableOptimisticUpdates?: boolean;
}

export function CreditProvider({
  children,
  autoRefreshInterval = 0,
  enableOptimisticUpdates = true,
}: CreditProviderProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Track ongoing requests to prevent race conditions
  const fetchControllerRef = useRef<AbortController | null>(null);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Retry initialization if backend hasn't finished creating user/credits yet
  const initRetryCountRef = useRef<number>(0);
  const initRetryTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch credits from the API
   */
  const fetchCredits = useCallback(async (showLoading = true) => {
    // Cancel any ongoing request
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch("/api/credits/check", {
        signal: controller.signal,
        cache: "no-store",
      });

      // Self-heal on first-load race (user just signed up, DB not ready yet)
      if (!response.ok) {
        // If resources are not ready yet, retry a few times while keeping loading state
        if (response.status === 404 && initRetryCountRef.current < 5) {
          const attempt = initRetryCountRef.current + 1;
          initRetryCountRef.current = attempt;
          const retryDelayMs = Math.min(2000, 400 * Math.pow(2, attempt - 1));
          if (initRetryTimerRef.current)
            clearTimeout(initRetryTimerRef.current);
          initRetryTimerRef.current = setTimeout(() => {
            // Re-run without toggling loading off
            // Keep loading spinner to avoid flicker to "No data"
            fetchCredits(true);
          }, retryDelayMs);
          return; // Exit early, keep loading on
        }

        throw new Error(`Failed to fetch credits: ${response.status}`);
      }

      const data = await response.json();

      if (data.subscription) {
        setSubscription({
          planName: data.subscription.planName,
          planId: data.subscription.planId,
          status: data.subscription.status,
          creditsRemaining: data.creditsRemaining,
          creditsTotal: data.creditsTotal || data.creditsRemaining,
        });
        setLastUpdated(new Date());
        // Reset init retry counter on success
        initRetryCountRef.current = 0;
        if (initRetryTimerRef.current) {
          clearTimeout(initRetryTimerRef.current);
          initRetryTimerRef.current = null;
        }
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("Error fetching credits:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      fetchControllerRef.current = null;
    }
  }, []);

  /**
   * Public method to refresh credits
   */
  const refreshCredits = useCallback(async () => {
    await fetchCredits(false);
  }, [fetchCredits]);

  /**
   * Optimistically deduct credits (updates UI immediately)
   */
  const deductCredits = useCallback(
    (amount: number) => {
      if (!enableOptimisticUpdates || !subscription) return;

      setSubscription((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          creditsRemaining: Math.max(0, prev.creditsRemaining - amount),
        };
      });

      // Fetch actual value after a short delay
      setTimeout(() => {
        fetchCredits(false);
      }, 1000);
    },
    [subscription, enableOptimisticUpdates, fetchCredits]
  );

  /**
   * Manually update credits (useful for direct updates)
   */
  const updateCredits = useCallback((credits: number) => {
    setSubscription((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        creditsRemaining: credits,
      };
    });
    setLastUpdated(new Date());
  }, []);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchCredits(true);
  }, [fetchCredits]);

  /**
   * Setup auto-refresh if enabled
   */
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchCredits(false);
      }, autoRefreshInterval);

      return () => {
        if (autoRefreshTimerRef.current) {
          clearInterval(autoRefreshTimerRef.current);
        }
      };
    }
  }, [autoRefreshInterval, fetchCredits]);

  /**
   * Listen for custom credit update events
   */
  useEffect(() => {
    const handleCreditUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ amount?: number }>;
      if (customEvent.detail?.amount) {
        deductCredits(customEvent.detail.amount);
      } else {
        refreshCredits();
      }
    };

    window.addEventListener("creditUpdate", handleCreditUpdate);
    window.addEventListener("creditDeducted", handleCreditUpdate);

    return () => {
      window.removeEventListener("creditUpdate", handleCreditUpdate);
      window.removeEventListener("creditDeducted", handleCreditUpdate);
    };
  }, [deductCredits, refreshCredits]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
      if (initRetryTimerRef.current) {
        clearTimeout(initRetryTimerRef.current);
      }
    };
  }, []);

  const value: CreditContextType = {
    subscription,
    loading,
    error,
    refreshCredits,
    deductCredits,
    updateCredits,
    lastUpdated,
  };

  return (
    <CreditContext.Provider value={value}>{children}</CreditContext.Provider>
  );
}

/**
 * Hook to access credit context
 */
export function useCreditInfo() {
  const context = useContext(CreditContext);

  if (context === undefined) {
    throw new Error("useCreditInfo must be used within a CreditProvider");
  }

  return context;
}

/**
 * Utility function to trigger credit updates from anywhere in the app
 * Can be used even outside of React components
 */
export function triggerCreditUpdate(deductedAmount?: number) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("creditUpdate", {
      detail: { amount: deductedAmount },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Utility function specifically for credit deduction events
 */
export function triggerCreditDeduction(amount: number) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("creditDeducted", {
      detail: { amount },
    });
    window.dispatchEvent(event);
  }
}
