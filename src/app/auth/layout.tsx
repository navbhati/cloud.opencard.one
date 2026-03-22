"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ThemeSwitch from "@/components/core/ThemeSwitch";
import { SITE_CONFIG } from "@/config/platform/site_config";
import Image from "next/image";

const ROTATING_TEXTS = [
  "Authorize. Govern. Bridge.",
  "The open-source authorization layer for AI agent payments.",
  "One integration. Every protocol. Full compliance.",
  "From mandate to settlement — in minutes.",
  "Enterprise-ready agent payment infrastructure.",
  "Protocol-agnostic. Compliance-first. Open source.",
];

function RotatingHeading() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ROTATING_TEXTS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="text-background text-4xl mb-4 mt-10 font-normal min-h-[60px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="block"
        >
          {ROTATING_TEXTS[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </h1>
  );
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // SSO callback should only show its loading content, no two-column layout
  if (pathname?.includes("sso-callback")) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-full lg:w-1/2 flex items-center justify-center flex-column p-16 lg:p-24 bg-background relative pt-[200px]">
        <div className="w-full">{children}</div>
      </div>

      <div
        className={`
          hidden lg:flex lg:w-1/2 relative z-10
          bg-foreground
        `}
      >
        <div className="absolute top-10 right-24">
          <ThemeSwitch />
        </div>
        <div className="flex flex-col text-background align-middle justify-center text-center w-full p-24 lg:p-32">
          <div className="flex justify-center items-center w-full">
            <Image
              width={250}
              height={125}
              src={SITE_CONFIG.siteLogoDark}
              alt={SITE_CONFIG.siteLogoDarkAlt}
              className="block dark:hidden"
            />
            <Image
              width={250}
              height={125}
              src={SITE_CONFIG.siteLogo}
              alt={SITE_CONFIG.siteLogoAlt}
              className="hidden dark:block"
            />
          </div>
          <div className="text-center">
            <RotatingHeading />
            <p className="text-background/60 font-light">
              Making AI agent payments legal, auditable, and enterprise-ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
