"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { SITE_CONFIG } from "@/config/platform/site_config";

// Map path segments to readable labels
const pathLabelMap: Record<string, string> = {
  "": "Home",
  settings: "Settings",
  profile: "Profile",
  billing: "Plan & Billing",
  plans: "Plans",
};

// Segments that precede dynamic IDs, mapped to the API endpoint for resolving names
// Pattern: { parentSegment: { apiPath: (id) => string, extractName: (data) => string } }
const dynamicSegmentResolvers: Record<
  string,
  {
    apiPath: (id: string) => string;
    extractName: (data: Record<string, unknown>) => string;
  }
> = {};

const pathRedirectMap: Record<string, string> = {};

// Check if a segment looks like a dynamic ID (cuid, uuid, or long alphanumeric)
function isDynamicSegment(segment: string): boolean {
  // Already in the label map — it's a known static segment
  if (pathLabelMap[segment] !== undefined) return false;
  // CUIDs, UUIDs, or any string ≥8 chars with mixed alphanumerics
  return /^[a-z0-9_-]{8,}$/i.test(segment);
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const [planName, setPlanName] = useState<string | null>(null);
  // Cache of resolved dynamic segment names: { "branding/abc123": "My Brand" }
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const response = await fetch("/api/stripe/current");
      if (response.ok) {
        const data = await response.json();
        if (data.subscription) {
          setPlanName(data.subscription.plan.name);
        }
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
    }
  };

  // Resolve dynamic segment names from APIs
  const resolveDynamicSegments = useCallback(async () => {
    const segments = pathname.split("/").filter(Boolean);

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const prevSegment = i > 0 ? segments[i - 1] : null;

      if (!isDynamicSegment(segment) || !prevSegment) continue;

      const cacheKey = `${prevSegment}/${segment}`;
      // Skip if already resolved
      if (resolvedNames[cacheKey]) continue;

      const resolver = dynamicSegmentResolvers[prevSegment];
      if (!resolver) continue;

      try {
        const response = await fetch(resolver.apiPath(segment));
        if (response.ok) {
          const data = await response.json();
          const name = resolver.extractName(data);
          setResolvedNames((prev) => ({ ...prev, [cacheKey]: name }));
        }
      } catch {
        // Silently fail — breadcrumb will show truncated ID
      }
    }
  }, [pathname, resolvedNames]);

  useEffect(() => {
    resolveDynamicSegments();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Split pathname into segments and filter out empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const naturalPath = `/${segments.slice(0, index + 1).join("/")}`;
    const path = pathRedirectMap[segment] || naturalPath;
    const prevSegment = index > 0 ? segments[index - 1] : null;
    let label: string | undefined = pathLabelMap[segment];

    if (!label) {
      // Try to resolve from cached dynamic names
      if (prevSegment) {
        const cacheKey = `${prevSegment}/${segment}`;
        label = resolvedNames[cacheKey] || undefined;
      }
      // Fallback: truncate long IDs, or capitalize the segment
      if (!label) {
        label = isDynamicSegment(segment)
          ? `${segment.slice(0, 8)}...`
          : segment
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }

    const isLast = index === segments.length - 1;

    return { path, label, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link href="/">{SITE_CONFIG.siteName}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbItems.length === 0 ? (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          breadcrumbItems.map((item) => (
            <div key={item.path} className="contents">
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage className="max-w-[200px] truncate">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.path} className="max-w-[200px] truncate">
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))
        )}

        {planName && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <Badge variant="secondary" className="text-xs">
                {planName}
              </Badge>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
