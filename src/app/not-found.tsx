"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center -mt-20">
      <div className="text-center space-y-6">
        <div>
          <Image
            src="/404-image.svg"
            alt="404 Error Illustration"
            width={400}
            height={400}
            priority
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-600">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-500">
            Well, this is awkward… the page you&apos;re looking for took a
            coffee break.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => (window.location.href = "/")}
          className="cursor-pointer"
        >
          Back to Home <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
