#Artifacts AI SaaS

## 📚 Documentation

Comprehensive implementation guides are available in the [`readme-guides/`](./readme-guides/) directory:

| System | Quick Start | Full Guide |
|--------|-------------|------------|
| **Edge Config** | [Quick Start](./readme-guides/edge-config-implementation/QUICK_START.md) | [Full Guide](./readme-guides/edge-config-implementation/EDGE_CONFIG_IMPLEMENTATION.md) |
| **Stripe Payments** | [Setup Guide](./STRIPE_SETUP.md) | [Implementation](./readme-guides/IMPLEMENTATION_SUMMARY.md#stripe-payment-integration) |
| **Redis Caching** | [Quick Start](./readme-guides/redis-implementation/REDIS_CACHING.md) | [Full Guide](./readme-guides/redis-implementation/IMPLEMENTATION_SUMMARY.md) |
| **Vercel Blob** | [Quick Start](./readme-guides/vercel-blob-implementation/QUICK_START.md) | [Full Guide](./readme-guides/vercel-blob-implementation/VERCEL_BLOB_IMPLEMENTATION.md) |
| **Credit System** | [Quick Start](./readme-guides/credit-system-info-implementation/CREDIT_SYSTEM_QUICK_START.md) | [Full Guide](./readme-guides/credit-system-info-implementation/CREDIT_SYSTEM_IMPLEMENTATION.md) |
| **Referral System** | - | [Plan](./readme-guides/referral-credit-system/referral-credit-system-plan.md) |
| **Langfuse** | - | [Guide](./readme-guides/langfuse-implementation/LANGFUSE_IMPLEMENTATION_GUIDE.md) |
| **Composio Apps** | [Quick Start](./readme-guides/composio-apps-implementation/QUICK_START.md) | [Full Guide](./readme-guides/composio-apps-implementation/COMPOSIO_APPS_IMPLEMENTATION.md) |

### Featured Implementations

- **🎛️ Edge Config**: Feature flags and configuration management without deployments
- **💳 Stripe**: Complete payment processing, subscriptions, and credit system
- **⚡ Redis**: High-performance caching with strategic invalidation
- **📦 Blob Storage**: File uploads with client and server-side support
- **🎯 Credits**: Usage tracking, deduction, and allocation system
- **🔌 Composio Apps**: Connect and manage third-party app connections (Gmail, Slack, etc.) via OAuth

See [Implementation Summary](./readme-guides/IMPLEMENTATION_SUMMARY.md) for a complete overview.

## TODO

- [ ] [P0] Implement Stripe integration for payments and subscriptions
  - [ ] Add billing page
  - [ ] Add manage subscription option
  - [ ] Show plan badge according to the plan
- [ ] [P1]Implement credit usage hooks etc. so that credits updates as soon as they are used
- [ ] Use tRPS or axios for api calls - DECISION PENDING
- [ ] Set up Sentry for logging and error monitoring
- [ ] Enforce OWASP Top 10 security best practices
- [ ] Track custom events in google analytics https://supastarter.dev/docs/nextjs/analytics/overview
- [x] Implement caching mechanisms for performance optimization


## Docker deploy for local dev

``` bash
docker-compose up

# To run it in background
docker-compose up -d
```

## Setting up prisma

https://www.prisma.io/docs/guides/nextjs

npm install prisma tsx --save-dev
npm install @prisma/extension-accelerate @prisma/client

npx prisma init

## Tools used

| Tool          | URL                                 | Details                                      | Price         |
|---------------|-------------------------------------|----------------------------------------------|---------------|
| Prisma        | https://www.prisma.io/  & https://www.prisma.io/docs/guides/nextjs            | ORM & database toolkit for Node.js/TypeScript| Free & Paid   |
| Neon             | https://neon.com/pricing                   | Free & Paid tiers for Postgres cloud database | 
| Clerk         | https://clerk.com/                  | Complete user management/auth for JS apps    | Free & Paid   |
| Next.js       | https://nextjs.org/                 | React app framework, SSR, SSG, Edge          | Free (OSS)    |
| Vercel        | https://vercel.com/                 | Hosting & deployment for Next.js/JS sites    | Free & Paid   |
| Vercel Blob                | https://vercel.com/docs/vercel-blob            | File storage: any file, any format on Vercel  |
| Sentry        | https://sentry.io/                  | Error monitoring & application performance   | Free & Paid   |
| Lucide React  | https://lucide.dev/                 | Icon library (React components)              | Free (OSS)    |
| Stripe         | https://stripe.com/                | Payments & subscription platform             | Paid (with limited free tier) |
| shadcn/ui      | https://ui.shadcn.com/             | UI component/design system for React/Next.js | Free (OSS)    |
| Google Analytics | https://analytics.google.com/ | Web analytics service for tracking and reporting website traffic | Free & Paid |
| Microsoft Clarity | https://clarity.microsoft.com/ | Session recording and heatmaps for user behavior analytics | Free |
| Upstash | https://upstash.com | Redis caching - free tire used - nbg email used to sign iin | Free & Paid |
| Vercel Flags SDK + Edge Config | https://vercel.com/blog/flags-as-code-in-next-js  https://flags-sdk.dev | Edge config to turn on/off feature flags, better than env variable as it doesn't require re-deployment. Other feature flag / experiment providers that to use if I chose to could be https://www.growthbook.io/ and similar. | Free & Paid |
| Late | https://getlate.dev/ | The social media API that replaces 13 integrations. | Free & Paid |
| Composio      | https://composio.dev/               | 1000s of app integrations, Skills that evolve with your Agents           | Free & Paid| 
| Firecrawl | https://www.firecrawl.dev/ | The Web Data API for AI | Free & Paid |
| Supadata      | https://supadata.ai/                      | YouTube, Instagram, TikTok transcript provider | Free & Paid |
| AI SDK by Vercel | https://ai-sdk.dev/docs/introduction | Advanced AI SDK for building AI-powered applications | Free & Paid |
| Workflow DevKit - Make any TypeScript Function Durable | https://useworkflow.dev/ | Make TypeScript functions stateful, retryable, schedulable | Free & Paid |
| AI Gateway | https://vercel.com/ai-gateway | A serverless gateway to secure and scale AI usage | Free & Paid |



## Shadcn Component libraries

| Name                   | URL                                              | Note                    |
|------------------------|--------------------------------------------------|-------------------------|
| Efferd                                 | https://efferd.com/                                         | Beautiful Shadcn blocks for busy & smart devs                |
| Solace UI                              | https://www.solaceui.com/                                   | Aesthetic, fast and modern Next.js Component Library          |
| Shadcn Blocks (blocks.so)              | https://blocks.so/                                          | 60+ Free shadcn/ui Components for React                       |
| Fancy Components (Variable Font Cursor Proximity) | https://www.fancycomponents.dev/docs/components/text/variable-font-cursor-proximity | Fancy components, variable font cursor proximity              |
| Eldora UI                              | https://www.eldoraui.site/                                  |                                                               |
| Square UI by lndev-ui                  | https://square.lndev.me/                                    |                                                               |
| Shadcnui-blocks.com    | https://www.shadcnui-blocks.com/components       | Really good components + templates            |
| Kibo UI                | https://www.kibo-ui.com/components/              | Quite good              |
| Blocks UI              | https://blocks.so/                               | 60+ Free shadcn/ui Components for React |
| Reui.io                | https://reui.io/blocks                           | Free and pretty awesome |
| TweakCN                | https://tweakcn.com/                             |                         |
| shadcn.io              | https://www.shadcn.io/components                 |                         |
| Shadcn Studio          | https://shadcnstudio.com/                        | REALLY Good             |
| Tailark                | https://tailark.com/                             | Quite good and free     |
| Origin UI              | https://coss.com/origin                          |                         |
| Magic UI               | https://magicui.design/docs/components           | 150+ Free components    |
| Smooth UI              | https://smoothui.dev/doc/components              |                         |
| Aceternity UI          | https://ui.aceternity.com/components             |                         |
| 21st.dev Components    | https://21st.dev/community/components            |                         |
| Supabase UI Library    | https://supabase.com/ui                          |                         |
| Shadcn Design          | https://www.shadcndesign.com/docs/components     | Paid but good           |
| Ui Megamenu                       | https://modernize-tailwind-nextjs-horizontal.vercel.app/ui-components/megamenu | Example of horizontal mega menu UI with Tailwind/Next.js |
| Awesome Shadcn UI                 | https://github.com/birobirobiro/awesome-shadcn-ui                 | Curated list of shadcn/ui-related resources     |
| Shadcn UI Templates (Shadcnblocks) | https://www.shadcnblocks.com/templates                            | Templates for shadcn/ui                        |
| Shadcn UI Kit                     | https://shadcnuikit.com/                                          | Admin dashboards, templates, components & more  |
| Modernize - Nextjs      | https://modernize-tailwind-nextjs-horizontal.vercel.app/ | Example of modern Next.js + Tailwind megamenu & dashboard UI (horizontal layout) |
| The Gridcn (Tron-Inspired shadcn/ui Theme) | https://thegridcn.com/components#slider-example | Tron-inspired shadcn/ui component library & theme |
| mapcn - Beautiful maps made simple          | https://www.mapcn.dev/                           | Interactive maps, simple API for React/Next.js     |
| Components | ElevenLabs UI                  | https://ui.elevenlabs.io/docs/components         | Component library inspired by ElevenLabs UI         |
| UI TripleD – UI Components, Blocks & Templates | https://ui.tripled.work/grid-generator         | Modern UI components, blocks, and templates         |
| New tab                                    | chrome://newtab/                                 | Browser new tab shortcut                            |



## Theme Templates

| Theme Name            | URL                                         | Note                                         |
|-----------------------|---------------------------------------------|----------------------------------------------|
| Shadcnblocks.com      | https://www.shadcnblocks.com/templates      | Templates for shadcn/ui components and pages |
| Shadcn UI Kit         | https://shadcnuikit.com/                    | Admin Dashboards, Templates, Components & more |
| Beautiful React UI Templates        | https://www.shadcn.io/template                       | Premium, beautiful templates using shadcn/ui    |
| Premium Tailwind templates          | https://www.tailawesome.com/?price=premium&technology=7&type=template | Premium Tailwind CSS templates                  |
| Cult UI – Shadcn UI Components, Blocks & Templates | https://www.cult-ui.com/       | Shadcn UI components, blocks, and templates     |

## SaaS Boilerplates

| Boilerplate                     | URL                                                                                     | Note                                                                                                       |
|----------------------------------|-----------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| nextjs/saas-starter              | https://github.com/nextjs/saas-starter/tree/main                                       | Get started quickly with Next.js, Postgres, Stripe, and shadcn/ui                                          |
| Next.js SaaS Starter             | https://next-saas-start.vercel.app/                                                    | Hosted SaaS starter for Next.js                                                                            |
| Codehagen/Badget                 | https://github.com/Codehagen/Badget                                                    | Badget: Simplifies financial management with a user-friendly interface and robust backend                  |
| gridaco/grida                    | https://github.com/gridaco/grida                                                       | Grida: Ambitious 2D Graphics Editor for the Web                                                            |
| LaunchMVPFast (shadcn/ui)        | https://www.shadcn.io/template/alifarooq9-launchmvpfast                                | shadcn/ui Template by alifarooq9 for launching MVPs fast                                                   |
| UI Builder                       | https://www.uibuilder.app/                                                             | Visual interface builder for quickly scaffolding UIs                                                       |




## Blog Template

1. https://github.com/magicuidesign/blog-template