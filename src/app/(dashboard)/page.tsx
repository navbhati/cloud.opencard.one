"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function DashboardPage() {
  const { isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  /*   const newDashboard = useEdgeConfig<boolean>(
    `newDashboard_${process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development"}`,
    false,
  ); */

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  if (!isLoaded || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden p-6">
      <Dashboard />
    </div>
  );
}
