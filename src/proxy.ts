import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AuthRoutes } from "@/config/routes";

const isPublicRoute = createRouteMatcher([
  "/auth",
  "/auth/(.*)",
  "/auth/sso-callback",
  "/api/webhooks",
  "/api/stripe/webhook",
  "/api/blob/upload/client/webhook",
]);

// Block some development only routes in production - redirect to trigger not-found page
const isNonProductionRoutes = createRouteMatcher(["/examples"]);

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default clerkMiddleware(async (auth, req) => {
  // Block /examples route in production - redirect to trigger not-found page
  if (isNonProductionRoutes(req)) {
    if (process.env.NODE_ENV === "production") {
      // Rewrite to a non-existent route to trigger Next.js not-found page
      // This prevents the route from appearing in breadcrumbs
      const url = req.nextUrl.clone();
      url.pathname = "/__not-found-examples__";
      return NextResponse.rewrite(url);
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect(undefined, {
      unauthenticatedUrl: `${baseUrl}${AuthRoutes.REGISTER}`,
      unauthorizedUrl: `${baseUrl}${AuthRoutes.REGISTER}`,
    });
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
