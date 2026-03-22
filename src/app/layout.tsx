import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import "./globals.css";
import { SITE_CONFIG } from "@/config/platform/site_config";
import { getAll } from "@vercel/edge-config";

export const metadata: Metadata = {
  title: SITE_CONFIG.siteTitle,
  metadataBase: new URL(SITE_CONFIG.siteUrl),
  description: SITE_CONFIG.siteDescription,
  keywords: SITE_CONFIG.siteKeywords,
  openGraph: {
    title: SITE_CONFIG.siteName,
    description: SITE_CONFIG.siteDescription,
    type: "website",
    siteName: SITE_CONFIG.siteName,
    url: SITE_CONFIG.siteUrl,
    images: [
      {
        url: SITE_CONFIG.siteLogo,
        width: SITE_CONFIG.siteLogoWidth,
        height: SITE_CONFIG.siteLogoHeight,
        alt: SITE_CONFIG.siteLogoAlt,
      },
      {
        url: SITE_CONFIG.siteLogoDark,
        width: SITE_CONFIG.siteLogoDarkWidth,
        height: SITE_CONFIG.siteLogoDarkHeight,
        alt: SITE_CONFIG.siteLogoDarkAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.siteName,
    description: SITE_CONFIG.siteDescription,
    images: [SITE_CONFIG.siteLogo, SITE_CONFIG.siteLogoDark],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const edgeConfigs = await getAll();
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_ID}`}
          />
          <Script
            id="gtag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_TRACKING_ID}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "qmhnzpdqn6");
            `,
            }}
          />
        </head>
        <body className="font-sans antialiased" suppressHydrationWarning>
          <Providers
            edgeConfigs={
              edgeConfigs as Record<string, boolean | string | number>
            }
          >
            {children}
          </Providers>
          <Toaster />

          {/* what's the user of this google analytics suspense - is this the right place for it? */}
          <Suspense fallback={null}>{/* <GoogleAnalytics /> */}</Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}
