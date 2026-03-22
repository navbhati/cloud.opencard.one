"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/LoadingScreen";
import { toast } from "sonner";

function SSOCallbackContent() {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [synced, setSynced] = useState(false);
  const transferAttempted = useRef(false);

  const isLoaded = isUserLoaded && isSignInLoaded && isSignUpLoaded;

  // Handle OAuth transfer: new user via Google sign-in → auto sign-up
  useEffect(() => {
    if (!isLoaded || synced || transferAttempted.current) return;
    if (isSignedIn) return; // already signed in, no transfer needed

    async function handleTransfer() {
      if (!signIn || !signUp) return;

      try {
        // Case 1: Sign-in detected a new user → transfer to sign-up
        if (signIn.firstFactorVerification?.status === "transferable") {
          transferAttempted.current = true;
          const result = await signUp.create({ transfer: true });
          if (result.status === "complete" && result.createdSessionId) {
            await setSignUpActive({ session: result.createdSessionId });
            // Session is now active — the syncUser effect will pick it up
          }
          return;
        }

        // Case 2: Sign-up detected an existing user → transfer to sign-in
        if (signUp.verifications?.externalAccount?.status === "transferable") {
          transferAttempted.current = true;
          const result = await signIn.create({ transfer: true });
          if (result.status === "complete" && result.createdSessionId) {
            await setSignInActive({ session: result.createdSessionId });
          }
          return;
        }
      } catch (err) {
        console.error("OAuth transfer failed:", err);
        toast.error("Authentication failed. Please try again.");
        router.push("/auth/login");
      }
    }

    handleTransfer();
  }, [isLoaded, isSignedIn, synced, signIn, signUp, setSignInActive, setSignUpActive, router]);

  // Sync user to database once signed in
  useEffect(() => {
    async function syncUser() {
      if (synced || !isLoaded) return;

      // Not signed in yet — wait (Clerk may still be propagating session after transfer)
      if (!isSignedIn || !user) return;

      setSynced(true);

      try {
        const email = user.primaryEmailAddress?.emailAddress;
        const name = user.fullName || user.firstName || "";

        if (!email) {
          toast.error("Email address is required");
          router.push("/auth/login");
          return;
        }

        // Wait a moment for session to be fully established
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const referralCode = searchParams.get("ref");

        const response = await fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userId: user.id,
            email,
            name,
            referralCode,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Sync failed:", response.status, errorText);
          toast.error("Failed to sync user data");

          if (response.status === 401) {
            console.log("Unauthorized but user is signed in - continuing to dashboard");
            toast.info("Continuing to dashboard...");
            setTimeout(() => router.push("/"), 1000);
            return;
          }

          router.push("/auth/login");
          return;
        }

        const data = await response.json();
        console.log("Sync successful:", data);
        toast.success("Successfully signed in!");

        setTimeout(() => {
          router.push("/");
        }, 500);
      } catch (error) {
        console.error("Error during sync:", error);
        toast.error("An error occurred. Redirecting...");
        setTimeout(() => router.push("/"), 1500);
      }
    }

    syncUser();
  }, [isLoaded, isSignedIn, user, synced, router, searchParams]);

  // Safety timeout: if nothing happens after 8s, redirect to login
  useEffect(() => {
    if (synced) return;
    const timeout = setTimeout(() => {
      if (!synced) {
        console.error("SSO callback timed out");
        router.push("/auth/login");
      }
    }, 8000);
    return () => clearTimeout(timeout);
  }, [synced, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loading />
      <p className="text-sm text-gray-600">
        {!isLoaded ? "" : synced ? "" : ""}
      </p>
    </div>
  );
}

export default function SSOCallback() {
  return (
    <Suspense fallback={<Loading />}>
      <SSOCallbackContent />
    </Suspense>
  );
}
