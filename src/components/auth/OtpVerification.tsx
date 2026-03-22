"use client";
import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/config/platform/site_config";

interface OtpVerificationProps {
  email: string;
  isLoading: boolean;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onEditEmail: () => void;
  onUseAnotherMethod: () => void;
}

export function OtpVerification({
  email,
  isLoading,
  onVerify,
  onResend,
  onEditEmail,
  onUseAnotherMethod,
}: OtpVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((digit) => digit !== "")) {
      handleVerifyCode(newCode.join(""));
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) {
        newCode[index] = char;
      }
    });
    setCode(newCode);

    if (newCode.every((digit) => digit !== "")) {
      handleVerifyCode(newCode.join(""));
    }
  };

  const handleVerifyCode = async (codeString: string) => {
    if (codeString.length !== 6) {
      toast.error("Please enter the complete verification code");
      return;
    }

    try {
      await onVerify(codeString);
    } catch (error) {
      // Error handling is done in parent component
      // Reset code on error
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    try {
      await onResend();
      setResendTimer(60);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-0">
        <h2 className="text-lg font-semibold mt-10">Check your email</h2>
        <p className="text-gray-600 text-sm">to continue to {SITE_CONFIG.siteName}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-sm font-medium">{email}</span>
          <button
            type="button"
            onClick={onEditEmail}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
          {code.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              disabled={isLoading}
              className="w-10 h-10 text-center text-lg font-semibold"
            />
          ))}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0 || isLoading}
            className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Didn&apos;t receive a code?{" "}
            <span className="text-blue-600 font-medium cursor-pointer underline">
              Resend {resendTimer > 0 && `(${resendTimer})`}
            </span>
          </button>
        </div>
      </div>

      <Button
        type="button"
        className="w-full cursor-pointer"
        disabled={isLoading || code.some((d) => !d)}
        onClick={() => handleVerifyCode(code.join(""))}
      >
        {isLoading ? "Verifying..." : "Continue"}
      </Button>

      <div className="text-center">
        <Button
          variant="link"
          onClick={onUseAnotherMethod}
          className="text-sm text-blue-600 hover:underline font-medium cursor-pointer"
          disabled={isLoading}
        >
          Use another method
        </Button>
      </div>
    </div>
  );
}
