"use client";
import { useState, Suspense } from "react";
import Image from "next/image";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import Loading from "@/components/LoadingScreen";
import { AuthRoutes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { OtpVerification } from "@/components/auth/OtpVerification";
import { SITE_CONFIG } from "@/config/platform/site_config";
import { FieldDescription } from "@/components/ui/field";

type AuthMode = "initial" | "signin-verify" | "signup-verify";

function UnifiedAuthContent() {
  const {
    isLoaded: isSignInLoaded,
    signIn,
    setActive: setSignInActive,
  } = useSignIn();
  const {
    isLoaded: isSignUpLoaded,
    signUp,
    setActive: setSignUpActive,
  } = useSignUp();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<AuthMode>("initial");
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  if (!isSignInLoaded || !isSignUpLoaded) {
    return <Loading />;
  }

  const ssoCallbackUrl = referralCode
    ? `${window.location.origin}${AuthRoutes.SSO_CALLBACK}?ref=${referralCode}`
    : `${window.location.origin}${AuthRoutes.SSO_CALLBACK}`;

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: ssoCallbackUrl,
        redirectUrlComplete: ssoCallbackUrl,
      });
    } catch (err: Error | unknown) {
      console.error(
        "Error:",
        err instanceof Error ? err.message : "Unknown error occurred",
      );
      toast.error("Failed to continue with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsEmailLoading(true);
    try {
      // Try sign-in first
      await signIn.create({
        identifier: email,
        strategy: "email_code",
      });
      setMode("signin-verify");
      toast.success("Verification code sent to your email!");
    } catch (err: unknown) {
      // Check if user doesn't exist — fall back to sign-up
      const clerkErr = err as { errors?: { code: string }[] };
      const isNotFound = clerkErr?.errors?.some(
        (e) => e.code === "form_identifier_not_found",
      );

      if (isNotFound) {
        try {
          await signUp.create({ emailAddress: email });
          await signUp.prepareEmailAddressVerification({
            strategy: "email_code",
          });
          setMode("signup-verify");
          toast.success("Verification code sent to your email!");
        } catch (signUpErr: unknown) {
          // Check if user already exists on sign-up path — transfer to sign-in
          const signUpClerkErr = signUpErr as { errors?: { code: string }[] };
          const alreadyExists = signUpClerkErr?.errors?.some(
            (e) => e.code === "form_identifier_exists",
          );

          if (alreadyExists) {
            try {
              await signIn.create({
                identifier: email,
                strategy: "email_code",
              });
              setMode("signin-verify");
              toast.success("Verification code sent to your email!");
            } catch (retryErr: Error | unknown) {
              console.error("Error:", retryErr);
              toast.error(
                retryErr instanceof Error
                  ? retryErr.message
                  : "Failed to send verification code",
              );
            }
          } else {
            console.error("Error:", signUpErr);
            toast.error(
              signUpErr instanceof Error
                ? signUpErr.message
                : "Failed to send verification code",
            );
          }
        }
      } else {
        console.error("Error:", err);
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to send verification code",
        );
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setIsEmailLoading(true);
    try {
      if (mode === "signin-verify") {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code,
        });

        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          const redirectUrl = referralCode
            ? `${AuthRoutes.SSO_CALLBACK}?ref=${referralCode}`
            : AuthRoutes.SSO_CALLBACK;
          router.push(redirectUrl);
        } else {
          console.error("Verification incomplete:", result);
          toast.error("Verification failed. Please try again.");
          throw new Error("Verification incomplete");
        }
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code });

        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          const redirectUrl = referralCode
            ? `${AuthRoutes.SSO_CALLBACK}?ref=${referralCode}`
            : AuthRoutes.SSO_CALLBACK;
          router.push(redirectUrl);
        } else {
          console.error("Verification incomplete:", result);
          toast.error("Verification failed. Please try again.");
          throw new Error("Verification incomplete");
        }
      }
    } catch (err: Error | unknown) {
      console.error("Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Invalid verification code",
      );
      throw err;
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsEmailLoading(true);
    try {
      if (mode === "signin-verify") {
        await signIn.create({
          identifier: email,
          strategy: "email_code",
        });
      } else {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
      }
      toast.success("Verification code resent!");
    } catch (err: Error | unknown) {
      console.error("Error:", err);
      toast.error("Failed to resend code. Please try again.");
      throw err;
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEditEmail = () => {
    setMode("initial");
  };

  const handleUseAnotherMethod = () => {
    setMode("initial");
    setEmail("");
  };

  const isVerifying = mode === "signin-verify" || mode === "signup-verify";

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Image
              src={SITE_CONFIG.siteLogo}
              alt={SITE_CONFIG.siteLogoAlt}
              width={100}
              height={70}
              className="block dark:hidden w-[100px] h-[70px] sm:w-[120px] sm:h-[72px]"
            />
            <Image
              src={SITE_CONFIG.siteLogoDark}
              alt={SITE_CONFIG.siteLogoDarkAlt}
              width={100}
              height={70}
              className="hidden dark:block w-[100px] h-[70px] sm:w-[120px] sm:h-[72px]"
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold mb-2">
            Welcome to <span className="font-serif-italic">{SITE_CONFIG.siteName}</span>
          </h2>

          {!isVerifying ? (
            <>
              <p className="text-muted-foreground mb-6">
                Sign in or create an account to continue
              </p>

              <Button
                variant="outline"
                onClick={handleGoogleAuth}
                disabled={isGoogleLoading || isEmailLoading}
                className="cursor-pointer w-full mb-6"
              >
                <Image
                  src="/google-icon.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
                <span>
                  {isGoogleLoading ? "Continuing..." : "Continue with Google"}
                </span>
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-gray-500">Or</span>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="mail@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isGoogleLoading || isEmailLoading}
                    required
                  />
                </div>

                <Button
                  variant="default"
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isGoogleLoading || isEmailLoading}
                >
                  {isEmailLoading ? "Sending code..." : "Continue"}
                </Button>
              </form>
            </>
          ) : (
            <OtpVerification
              email={email}
              isLoading={isEmailLoading}
              onVerify={handleVerifyCode}
              onResend={handleResendCode}
              onEditEmail={handleEditEmail}
              onUseAnotherMethod={handleUseAnotherMethod}
            />
          )}

          <FieldDescription className="px-6 text-center pt-6 text-xs text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a href={SITE_CONFIG.termsOfServiceUrl} className="hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href={SITE_CONFIG.privacyPolicyUrl} className="hover:underline">
              Privacy Policy
            </a>
            .
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<Loading />}>
      <UnifiedAuthContent />
    </Suspense>
  );
}
