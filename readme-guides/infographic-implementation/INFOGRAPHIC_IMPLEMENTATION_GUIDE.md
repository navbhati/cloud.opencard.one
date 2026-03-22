# Infographic Implementation Guide

## Overview

The infographic system is a schema-driven architecture that allows users to create visually appealing infographics from their content. The system uses JSON schemas to define the structure of each template component (header, body, footer), combines these schemas when templates are created, and uses AI to transform source content into the required schema format before rendering.

## Architecture

### Data Flow

```
1. Template Creation:
   Header Schema + Body Schema + Footer Schema → Combined Schema → Database

2. Infographic Generation:
   Source Content + Template Schema → AI Transformation → Structured JSON → Render Template
```

### Key Concepts

- **Schema-Driven**: Each layout component defines its own JSON schema
- **AI Transformation**: Content is transformed by AI to match the template's schema before rendering
- **Type Safety**: Full TypeScript support for all content types
- **Modular Design**: Headers, bodies, and footers are independent components that can be mixed and matched

---

## File Structure

### Core Files

| File Path | Purpose |
|-----------|---------|
| `src/components/infographics/index.ts` | Main exports for infographic components |
| `src/components/infographics/InfographicPreview.tsx` | Preview component that renders infographics |
| `src/components/infographics/InfographicTemplateBuilder.tsx` | UI for creating/editing templates |
| `src/components/infographics/CreateInfographicSection.tsx` | Component for generating infographics from content |
| `src/components/infographics/SectionSelector.tsx` | UI for selecting header/body/footer layouts |
| `src/components/infographics/LayoutThumbnail.tsx` | Thumbnail preview for layout options |
| `src/components/infographics/theme-config.ts` | Color palette and theme configuration |

### Schema Files

| File Path | Purpose |
|-----------|---------|
| `src/components/infographics/schemas/index.ts` | Schema registry, combination logic, and validation |
| `src/components/infographics/schemas/header.schemas.ts` | JSON schemas for header layouts |
| `src/components/infographics/schemas/body.schemas.ts` | JSON schemas for body layouts |
| `src/components/infographics/schemas/footer.schemas.ts` | JSON schemas for footer layouts |

### Layout Components

#### Headers
| File Path | Purpose |
|-----------|---------|
| `src/components/infographics/layouts/headers/index.ts` | Header component exports |
| `src/components/infographics/layouts/headers/SimpleHeader.tsx` | Simple header with title and optional subtitle |
| `src/components/infographics/layouts/headers/HeroHeader.tsx` | Hero header with prominent title and accent bar |

#### Bodies
| File Path | Purpose |
|-----------|---------|
| `src/components/infographics/layouts/bodies/index.ts` | Body component exports |
| `src/components/infographics/layouts/bodies/ComparisonBody.tsx` | Side-by-side comparison table (Type, Pro, Con) |
| `src/components/infographics/layouts/bodies/ListBody.tsx` | Bullet list with checkmarks |
| `src/components/infographics/layouts/bodies/TimelineBody.tsx` | Vertical timeline with sequential steps |
| `src/components/infographics/layouts/bodies/IconGridBody.tsx` | Grid layout with icons for features |
| `src/components/infographics/layouts/bodies/StepsBody.tsx` | Horizontal steps layout for processes |

#### Footers
| File Path | Purpose |
|-----------|---------|
| `src/components/infographics/layouts/footers/index.ts` | Footer component exports |
| `src/components/infographics/layouts/footers/CtaFooter.tsx` | Call-to-action footer with button |
| `src/components/infographics/layouts/footers/AttributionFooter.tsx` | Simple attribution footer |

### Layout Registry

| File Path | Purpose |
|-----------|---------|
| `src/components/infographics/layouts/index.ts` | Layout registry, template config, schema utilities |

### API Routes

| File Path | Purpose |
|-----------|---------|
| `src/app/api/infographics/templates/route.ts` | GET: List templates, POST: Create template |
| `src/app/api/infographics/templates/[id]/route.ts` | GET: Get template, PUT: Update, DELETE: Delete |
| `src/app/api/infographics/transform/route.ts` | POST: Transform content using AI to match schema |
| `src/app/api/infographics/generate/route.ts` | POST: Save infographic, GET: List infographics |
| `src/app/api/infographics/generate/[id]/route.ts` | GET: Get infographic, DELETE: Delete infographic |
| `src/app/api/infographics/export/route.ts` | POST: Export infographic as image |

### Pages

| File Path | Purpose |
|-----------|---------|
| `src/app/(dashboard)/content/infographics/page.tsx` | Template management page |
| `src/app/(dashboard)/content/infographics/saved/page.tsx` | Saved infographics page with preview/export |

### Database

| File Path | Purpose |
|-----------|---------|
| `prisma/schema.prisma` | Database schema (InfographicTemplate, Infographic models) |
| `prisma/seeds/infographic.templates.seed.ts` | Seed script for system templates |

---

## How to Add New Infographic Templates

This guide will walk you through adding a new header, body, or footer template to the infographic system.

### Prerequisites

- Understanding of React/TypeScript
- Familiarity with JSON Schema
- Knowledge of the existing template structure

---

## Step-by-Step: Adding a New Header Template

### Step 1: Create the Header Component

Create a new file: `src/components/infographics/layouts/headers/YourHeader.tsx`

```typescript
"use client";

import { InfographicContent } from "../index";
import { ColorPalette } from "../../theme-config";

interface YourHeaderProps {
  content: InfographicContent;
  isPreview?: boolean;
  palette?: ColorPalette;
}

export function YourHeader({ content, isPreview = false, palette }: YourHeaderProps) {
  const foregroundColor = palette?.foreground || "#0f172a";
  const mutedForeground = palette?.mutedForeground || "#64748b";
  const primaryColor = palette?.primary || "#3b82f6";

  return (
    <div className={`${isPreview ? "px-4 py-4" : "px-8 py-8"}`}>
      {/* Your header implementation */}
      <h1
        className={`font-semibold ${isPreview ? "text-base" : "text-2xl"}`}
        style={{ color: foregroundColor }}
      >
        {content.title || "Untitled Infographic"}
      </h1>
      {content.subtitle && (
        <p
          className={`mt-1 ${isPreview ? "text-[10px]" : "text-sm"}`}
          style={{ color: mutedForeground }}
        >
          {content.subtitle}
        </p>
      )}
    </div>
  );
}
```

**Key Points:**
- Accept `content: InfographicContent` prop
- Accept `isPreview?: boolean` for preview mode (smaller sizes)
- Accept `palette?: ColorPalette` for theming
- Use palette colors for styling
- Support both preview and full-size rendering

### Step 2: Export the Component

Update `src/components/infographics/layouts/headers/index.ts`:

```typescript
export { HeroHeader } from "./HeroHeader";
export { SimpleHeader } from "./SimpleHeader";
export { YourHeader } from "./YourHeader"; // Add this line
```

### Step 3: Define the JSON Schema

Update `src/components/infographics/schemas/header.schemas.ts`:

```typescript
// Add your schema
export const yourHeaderSchema = {
  $id: "your-header",
  type: "object",
  description: "Your header description",
  properties: {
    title: {
      type: "string",
      description: "Main title (max 60 characters recommended)",
      maxLength: 80,
    },
    subtitle: {
      type: "string",
      description: "Optional subtitle (max 100 characters recommended)",
      maxLength: 120,
    },
  },
  required: ["title"],
} as const;

// Add to registry
export const HEADER_SCHEMAS: Record<string, typeof simpleHeaderSchema | typeof heroHeaderSchema | typeof yourHeaderSchema> = {
  simple: simpleHeaderSchema,
  hero: heroHeaderSchema,
  your_header: yourHeaderSchema, // Add this line
};

// Update getHeaderSchema function (already handles this automatically)
```

### Step 4: Register in Layout Registry

Update `src/components/infographics/layouts/index.ts`:

Add to `HEADER_LAYOUTS` array:

```typescript
export const HEADER_LAYOUTS: LayoutOption[] = [
  // ... existing headers
  {
    id: "your_header",
    name: "Your Header",
    description: "Description of your header",
    section: "header",
    thumbnail: "your_header",
    schemaId: "your-header",
  },
];
```

### Step 5: Add to Preview Renderer

Update `src/components/infographics/InfographicPreview.tsx`:

In the `renderHeader` function, add your case:

```typescript
function renderHeader(
  layoutId: string,
  content: InfographicContent | InfographicTemplateContent,
  isPreview: boolean,
  palette: ColorPalette
) {
  const legacyContent = toLegacyContent(content);

  switch (layoutId) {
    case "hero":
      return <HeroHeader content={legacyContent} isPreview={isPreview} palette={palette} />;
    case "simple":
      return <SimpleHeader content={legacyContent} isPreview={isPreview} palette={palette} />;
    case "your_header": // Add this case
      return <YourHeader content={legacyContent} isPreview={isPreview} palette={palette} />;
    default:
      return <HeroHeader content={legacyContent} isPreview={isPreview} palette={palette} />;
  }
}
```

**Don't forget to import:**
```typescript
import { HeroHeader, SimpleHeader, YourHeader } from "./layouts/headers";
```

### Step 6: Add Thumbnail (Optional)

If you want a custom thumbnail, update `src/components/infographics/LayoutThumbnail.tsx`:

```typescript
case "your_header":
  return (
    <div className="w-full h-full p-2">
      {/* Your thumbnail SVG or component */}
    </div>
  );
```

---

## Step-by-Step: Adding a New Body Template

### Step 1: Create the Body Component

Create a new file: `src/components/infographics/layouts/bodies/YourBody.tsx`

```typescript
"use client";

import { InfographicContent } from "../index";
import { ColorPalette } from "../../theme-config";

interface YourBodyProps {
  content: InfographicContent;
  isPreview?: boolean;
  palette?: ColorPalette;
}

export function YourBody({ content, isPreview = false, palette }: YourBodyProps) {
  const items = content.items;
  const primaryColor = palette?.primary || "#3b82f6";
  const foregroundColor = palette?.foreground || "#0f172a";
  const mutedForeground = palette?.mutedForeground || "#64748b";
  const borderColor = palette?.border || "#e2e8f0";

  return (
    <div className={`${isPreview ? "px-4 py-4" : "px-8 py-8"}`}>
      {/* Your body implementation */}
      {items.map((item, index) => (
        <div key={index}>
          {/* Render each item */}
        </div>
      ))}
    </div>
  );
}
```

### Step 2: Export the Component

Update `src/components/infographics/layouts/bodies/index.ts`:

```typescript
export { ComparisonBody } from "./ComparisonBody";
export { ListBody } from "./ListBody";
export { TimelineBody } from "./TimelineBody";
export { IconGridBody } from "./IconGridBody";
export { StepsBody } from "./StepsBody";
export { YourBody } from "./YourBody"; // Add this line
```

### Step 3: Define the JSON Schema

Update `src/components/infographics/schemas/body.schemas.ts`:

**First, add the TypeScript interface:**

```typescript
export interface YourBodyItem {
  title: string;
  description?: string;
  // Add other fields as needed
}

export interface YourBodyContent {
  items: YourBodyItem[];
}
```

**Then add the schema:**

```typescript
export const yourBodySchema = {
  $id: "your-body",
  type: "object",
  description: "Your body layout description",
  properties: {
    items: {
      type: "array",
      description: "List of items for your body layout",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Item title",
            maxLength: 60,
          },
          description: {
            type: "string",
            description: "Item description",
            maxLength: 150,
          },
        },
        required: ["title"],
      },
      minItems: 2,
      maxItems: 10,
    },
  },
  required: ["items"],
} as const;
```

**Add to registry:**

```typescript
export const BODY_SCHEMAS = {
  timeline: timelineBodySchema,
  comparison: comparisonBodySchema,
  icon_grid: iconGridBodySchema,
  list: listBodySchema,
  steps: stepsBodySchema,
  your_body: yourBodySchema, // Add this line
} as const;
```

**Update the union type:**

```typescript
export type BodyContent =
  | TimelineBodyContent
  | ComparisonBodyContent
  | IconGridBodyContent
  | ListBodyContent
  | StepsBodyContent
  | YourBodyContent; // Add this line
```

**Export the types:**

```typescript
export type {
  TimelineBodyContent,
  ComparisonBodyContent,
  IconGridBodyContent,
  ListBodyContent,
  StepsBodyContent,
  YourBodyContent, // Add this line
  // ... other types
};
```

### Step 4: Register in Layout Registry

Update `src/components/infographics/layouts/index.ts`:

Add to `BODY_LAYOUTS` array:

```typescript
export const BODY_LAYOUTS: LayoutOption[] = [
  // ... existing bodies
  {
    id: "your_body",
    name: "Your Body",
    description: "Description of your body layout",
    section: "body",
    thumbnail: "your_body",
    schemaId: "your-body",
  },
];
```

**Export the new types:**

```typescript
export type {
  // ... existing types
  YourBodyContent,
  YourBodyItem,
};
```

### Step 5: Add to Preview Renderer

Update `src/components/infographics/InfographicPreview.tsx`:

In the `renderBody` function:

```typescript
function renderBody(
  layoutId: string,
  content: InfographicContent | InfographicTemplateContent,
  isPreview: boolean,
  palette: ColorPalette
) {
  const legacyContent = toLegacyContent(content);

  switch (layoutId) {
    case "comparison":
      return <ComparisonBody content={legacyContent} isPreview={isPreview} palette={palette} />;
    case "list":
      return <ListBody content={legacyContent} isPreview={isPreview} palette={palette} />;
    case "timeline":
      return <TimelineBody content={legacyContent} isPreview={isPreview} palette={palette} />;
    case "icon_grid":
      return <IconGridBody content={legacyContent} isPreview={isPreview} palette={palette} />;
    case "steps":
      return <StepsBody content={legacyContent} isPreview={isPreview} palette={palette} />;
    case "your_body": // Add this case
      return <YourBody content={legacyContent} isPreview={isPreview} palette={palette} />;
    default:
      return <IconGridBody content={legacyContent} isPreview={isPreview} palette={palette} />;
  }
}
```

**Import the component:**

```typescript
import {
  ComparisonBody,
  ListBody,
  TimelineBody,
  IconGridBody,
  StepsBody,
  YourBody, // Add this
} from "./layouts/bodies";
```

### Step 6: Update Legacy Content Conversion (if needed)

If your body has a unique structure, update `toLegacyContent` in `InfographicPreview.tsx`:

```typescript
const bodyItems =
  "items" in content.body
    ? content.body.items.map((item) => {
        // Handle your body format
        if ("yourField" in item) {
          return {
            title: item.title,
            description: item.description,
            // Map your specific fields
          };
        }
        // ... other formats
      })
    : [];
```

---

## Step-by-Step: Adding a New Footer Template

### Step 1: Create the Footer Component

Create a new file: `src/components/infographics/layouts/footers/YourFooter.tsx`

```typescript
"use client";

import { InfographicContent } from "../index";
import { ColorPalette } from "../../theme-config";

interface YourFooterProps {
  content: InfographicContent;
  isPreview?: boolean;
  palette?: ColorPalette;
}

export function YourFooter({ content, isPreview = false, palette }: YourFooterProps) {
  const primaryColor = palette?.primary || "#3b82f6";
  const mutedForeground = palette?.mutedForeground || "#64748b";
  const borderColor = palette?.border || "#e2e8f0";

  return (
    <div
      className={`${isPreview ? "px-4 py-3" : "px-8 py-4"}`}
      style={{
        borderTop: `1px solid ${borderColor}`,
      }}
    >
      {/* Your footer implementation */}
    </div>
  );
}
```

### Step 2: Export the Component

Update `src/components/infographics/layouts/footers/index.ts`:

```typescript
export { CtaFooter } from "./CtaFooter";
export { AttributionFooter } from "./AttributionFooter";
export { YourFooter } from "./YourFooter"; // Add this line
```

### Step 3: Define the JSON Schema

Update `src/components/infographics/schemas/footer.schemas.ts`:

**Add the TypeScript interface:**

```typescript
export interface YourFooterContent {
  // Define your footer structure
  text: string;
  link?: string;
}
```

**Add the schema:**

```typescript
export const yourFooterSchema = {
  $id: "your-footer",
  type: "object",
  description: "Your footer description",
  properties: {
    text: {
      type: "string",
      description: "Footer text",
      maxLength: 100,
    },
    link: {
      type: "string",
      description: "Optional link URL",
      maxLength: 200,
    },
  },
  required: ["text"],
} as const;
```

**Add to registry:**

```typescript
export const FOOTER_SCHEMAS = {
  cta: ctaFooterSchema,
  attribution: attributionFooterSchema,
  your_footer: yourFooterSchema, // Add this line
} as const;
```

**Update the union type:**

```typescript
export type FooterContent = CtaFooterContent | AttributionFooterContent | YourFooterContent;
```

### Step 4: Register in Layout Registry

Update `src/components/infographics/layouts/index.ts`:

Add to `FOOTER_LAYOUTS` array:

```typescript
export const FOOTER_LAYOUTS: LayoutOption[] = [
  // ... existing footers
  {
    id: "your_footer",
    name: "Your Footer",
    description: "Description of your footer",
    section: "footer",
    thumbnail: "your_footer",
    schemaId: "your-footer",
  },
];
```

### Step 5: Add to Preview Renderer

Update `src/components/infographics/InfographicPreview.tsx`:

In the `renderFooter` function:

```typescript
function renderFooter(
  layoutId: string,
  content: InfographicContent | InfographicTemplateContent,
  isPreview: boolean,
  palette: ColorPalette
) {
  const legacyContent = toLegacyContent(content);

  switch (layoutId) {
    case "cta":
      return <CtaFooter content={legacyContent} isPreview={isPreview} palette={palette} />;
    case "attribution":
      return <AttributionFooter content={legacyContent} isPreview={isPreview} palette={palette} />;
    case "your_footer": // Add this case
      return <YourFooter content={legacyContent} isPreview={isPreview} palette={palette} />;
    default:
      return <AttributionFooter content={legacyContent} isPreview={isPreview} palette={palette} />;
  }
}
```

**Import the component:**

```typescript
import { CtaFooter, AttributionFooter, YourFooter } from "./layouts/footers";
```

---

## Testing Your New Template

### 1. Verify Schema Registration

Check that your schema is properly registered:

```typescript
// In schemas/index.ts, verify your schema is exported
import { yourHeaderSchema } from "./header.schemas"; // or body/footer
```

### 2. Test Template Creation

1. Navigate to `/content/infographics`
2. Click "New Template"
3. Your new layout should appear in the section selector
4. Select it and verify the preview renders correctly

### 3. Test Content Transformation

1. Go to any generated content
2. Click "Create Infographic"
3. Select a template using your new layout
4. Verify the AI transforms content correctly
5. Check that the preview displays properly

### 4. Test Export

1. Create an infographic with your new template
2. Export as PNG/JPEG
3. Verify the export includes your layout correctly

---

## Schema Design Best Practices

### 1. Field Constraints

- Use `maxLength` to limit text fields
- Use `minItems`/`maxItems` for arrays
- Mark required fields explicitly

### 2. Descriptions

- Provide clear descriptions for AI transformation
- Include examples in descriptions when helpful
- Specify format requirements (e.g., "Date in YYYY-MM-DD format")

### 3. Naming Conventions

- Use snake_case for schema IDs: `your_header`, `your_body`
- Use camelCase for TypeScript interfaces: `YourHeaderContent`
- Keep IDs consistent across files

### 4. Type Safety

- Export TypeScript interfaces for all content types
- Use discriminated unions for body/footer content
- Maintain backward compatibility when possible

---

## Common Patterns

### Pattern 1: Simple List Layout

```typescript
// Schema
items: {
  type: "array",
  items: {
    type: "object",
    properties: {
      title: { type: "string", maxLength: 60 },
      description: { type: "string", maxLength: 120 },
    },
    required: ["title"],
  },
  minItems: 2,
  maxItems: 10,
}
```

### Pattern 2: Key-Value Pairs

```typescript
// Schema
items: {
  type: "array",
  items: {
    type: "object",
    properties: {
      key: { type: "string", maxLength: 40 },
      value: { type: "string", maxLength: 100 },
    },
    required: ["key", "value"],
  },
}
```

### Pattern 3: Structured Data

```typescript
// Schema
data: {
  type: "object",
  properties: {
    title: { type: "string" },
    items: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["title", "items"],
}
```

---

## Troubleshooting

### Issue: Template doesn't appear in selector

**Solution:**
- Verify the layout is added to `HEADER_LAYOUTS`, `BODY_LAYOUTS`, or `FOOTER_LAYOUTS`
- Check that the `id` matches the schema ID
- Ensure the component is exported from the index file

### Issue: Schema validation fails

**Solution:**
- Check that all required fields are present
- Verify `minItems`/`maxItems` constraints
- Ensure field types match (string, number, array, object)

### Issue: Content doesn't render correctly

**Solution:**
- Check `toLegacyContent` conversion handles your format
- Verify the component receives the correct props
- Check browser console for errors

### Issue: AI doesn't generate correct structure

**Solution:**
- Review schema descriptions - they guide AI transformation
- Test with different source content
- Check the transform API response for validation errors

---

## API Integration

### Transform Endpoint

The transform endpoint (`/api/infographics/transform`) uses AI SDK's structured output:

```typescript
const { output: transformedContent } = await generateText({
  model: aiModel,
  system: systemPrompt,
  prompt: userPrompt,
  output: Output.object({
    schema: jsonSchema(combinedSchema),
  }),
});
```

This ensures the AI output always matches your schema structure.

### Template Creation

When a template is created, schemas are automatically combined:

```typescript
const contentSchema = combineSchemas(headerLayout, bodyLayout, footerLayout);
```

The combined schema is stored in the database and used for all infographics using that template.

---

## Database Schema

### InfographicTemplate Model

```prisma
model InfographicTemplate {
  id            String   @id @default(cuid())
  name          String
  description   String?  @db.Text
  headerLayout  String
  bodyLayout    String
  footerLayout  String
  contentSchema Json     // Combined JSON schema
  isDefault     Boolean  @default(false)
  createdBy     String?
  // ...
}
```

### Infographic Model

```prisma
model Infographic {
  id              String   @id @default(cuid())
  userId          String
  templateId      String?
  sourceContentId String
  title           String?
  content         Json     // Transformed content matching schema
  htmlContent     String   @db.Text
  exportedUrl     String?
  metadata        Json?
  // ...
}
```

---

## Summary Checklist

When adding a new template component:

- [ ] Create the React component file
- [ ] Export component from index file
- [ ] Define TypeScript interface for content
- [ ] Create JSON schema definition
- [ ] Add schema to registry
- [ ] Register layout in `HEADER_LAYOUTS`/`BODY_LAYOUTS`/`FOOTER_LAYOUTS`
- [ ] Add case to render function in `InfographicPreview.tsx`
- [ ] Import component in `InfographicPreview.tsx`
- [ ] Update `toLegacyContent` if needed
- [ ] Add thumbnail (optional)
- [ ] Test template creation
- [ ] Test content transformation
- [ ] Test export functionality

---

## Additional Resources

- [AI SDK Structured Output Documentation](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [JSON Schema Specification](https://json-schema.org/)
- React Component Patterns
- TypeScript Discriminated Unions

---

## Support

For questions or issues:
1. Check this documentation
2. Review existing template implementations
3. Check browser console for errors
4. Verify schema validation in transform API response
