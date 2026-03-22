import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

export function TemplatesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-md border">
        <div className="space-y-4 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
export function SettingsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="max-w-2xl space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className={cn("flex flex-col gap-6 p-4 min-h-[60vh] animate-pulse")}>
      {/* Title */}
      <div className="h-6 w-1/3 rounded-md bg-muted dark:bg-neutral-800/80" />
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="h-16 bg-muted dark:bg-neutral-800/80 rounded-lg" />
        <div className="h-16 bg-muted dark:bg-neutral-800/80 rounded-lg" />
        <div className="h-16 bg-muted dark:bg-neutral-800/80 rounded-lg" />
      </div>
      {/* Subheader */}
      <div className="h-4 w-1/5 bg-muted dark:bg-neutral-800/80 rounded-md mt-4" />
      {/* Rows */}
      <div className="flex flex-col gap-2">
        <div className="h-10 bg-muted dark:bg-neutral-800/80 rounded-lg" />
        <div className="h-10 bg-muted dark:bg-neutral-800/80 rounded-lg" />
        <div className="h-10 bg-muted dark:bg-neutral-800/80 rounded-lg" />
        <div className="h-10 bg-muted dark:bg-neutral-800/80 rounded-lg" />
        <div className="h-10 bg-muted dark:bg-neutral-800/80 rounded-lg" />
        <div className="h-10 bg-muted dark:bg-neutral-800/80 rounded-lg" />
        <div className="h-10 bg-muted dark:bg-neutral-800/80 rounded-lg" />
      </div>
    </div>
  );
}
