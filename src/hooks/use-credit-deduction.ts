"use client";

import { useState, useCallback } from "react";
import { useCreditInfo } from "@/contexts/credit-context";
import { toast } from "sonner";

interface CreditDeductionOptions {
  /**
   * Show success toast after deduction
   * @default false
   */
  showSuccessToast?: boolean;
  /**
   * Show error toast on failure
   * @default true
   */
  showErrorToast?: boolean;
  /**
   * Custom success message
   */
  successMessage?: string;
  /**
   * Custom error message
   */
  errorMessage?: string;
  /**
   * Callback on success
   */
  onSuccess?: (remainingCredits: number) => void;
  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

interface DeductCreditsParams {
  amount: number;
  reason?: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Hook for handling credit deduction with proper error handling and UI feedback
 */
export function useCreditDeduction(options: CreditDeductionOptions = {}) {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
  } = options;

  const { deductCredits: optimisticDeduct, refreshCredits } = useCreditInfo();
  const [isDeducting, setIsDeducting] = useState(false);

  /**
   * Deduct credits with proper error handling
   */
  const deductCredits = useCallback(
    async ({ amount, reason, metadata }: DeductCreditsParams) => {
      if (amount <= 0) {
        throw new Error("Deduction amount must be positive");
      }

      setIsDeducting(true);

      try {
        // Optimistically update UI
        optimisticDeduct(amount);

        // Call the API to deduct credits
        const response = await fetch("/api/credits/deduct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            reason,
            metadata,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to deduct credits: ${response.status}`
          );
        }

        const data = await response.json();

        // Show success toast if enabled
        if (showSuccessToast) {
          toast.success(
            successMessage ||
              `${amount} credit${amount !== 1 ? "s" : ""} used successfully`
          );
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(data.remainingCredits);
        }

        // Refresh to get accurate server state
        await refreshCredits();

        return data;
      } catch (error) {
        console.error("Error deducting credits:", error);

        // Show error toast if enabled
        if (showErrorToast) {
          toast.error(
            errorMessage ||
              (error instanceof Error
                ? error.message
                : "Failed to deduct credits")
          );
        }

        // Call error callback
        if (onError && error instanceof Error) {
          onError(error);
        }

        // Refresh to restore accurate state after failed optimistic update
        await refreshCredits();

        throw error;
      } finally {
        setIsDeducting(false);
      }
    },
    [
      optimisticDeduct,
      refreshCredits,
      showSuccessToast,
      showErrorToast,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
    ]
  );

  return {
    deductCredits,
    isDeducting,
  };
}

/**
 * Simple hook to check if user has enough credits
 */
export function useHasCredits(requiredAmount: number = 1) {
  const { subscription } = useCreditInfo();

  const hasEnoughCredits =
    subscription?.creditsRemaining !== undefined &&
    subscription.creditsRemaining >= requiredAmount;

  const creditsRemaining = subscription?.creditsRemaining || 0;
  const creditsNeeded = Math.max(0, requiredAmount - creditsRemaining);

  return {
    hasEnoughCredits,
    creditsRemaining,
    creditsNeeded,
  };
}
