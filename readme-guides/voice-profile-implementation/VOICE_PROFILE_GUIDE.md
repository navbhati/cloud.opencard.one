# Voice Profile Feature - Implementation Guide

A concise guide to how voice profiles are implemented and work in the application.

## 🎯 Overview

Voice profiles allow users to create AI-generated writing style guides from content examples. These profiles are then automatically applied during content generation to maintain consistent tone and voice across all generated content.

## 📁 Key Files

```
src/app/api/content/voice-profile/
├── route.ts              # GET/POST - List profiles, add examples
└── process/route.ts      # POST - Generate voice profile from examples

src/components/content/settings/voice-profile/
├── index.tsx             # Main component - orchestrates all steps
├── examples-step.tsx     # Step 1: Collect content examples
├── analyzing-screen.tsx  # Step 2: Loading state during AI generation
├── review-step.tsx       # Step 3: Review and edit generated profile
├── voice-profile-list.tsx # Profile management table/list
├── create-first-card.tsx # Empty state for new users
├── delete-dialog.tsx     # Confirmation dialog for deletion
├── voice-profile-test-panel.tsx # Test preview functionality
└── types.ts              # TypeScript type definitions

src/app/(dashboard)/content/voice-profiles/page.tsx # Main page route
src/lib/prompts.ts        # Applies voice profile to content generation
prisma/schema.prisma      # VoiceProfile model definition
```

## 🗄️ Database Schema

```prisma
model VoiceProfile {
  id          String    @id @default(cuid())
  userId      String
  name        String    // User-defined name (max 40 chars)
  description String?   @db.Text
  whenToUse   String?   @db.Text // Usage context (max 90 chars)
  profile     String    @db.Text // AI-generated voice profile text
  examples    Json?     // Array of content examples
  isDefault   Boolean   @default(false)
  usageCount  Int       @default(0)
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([userId, name])
  @@index([userId])
  @@index([userId, isDefault])
}
```

## 🔄 How It Works

### 1. Creating a Voice Profile

**Step 1: Add Examples** (`POST /api/content/voice-profile`)
- User provides content examples (minimum 100 characters each)
- Examples are stored in the `examples` JSON array
- New profile created or existing profile updated
- Plan limits enforced:
  - Free/Plus: 1 profile
  - Pro: 3 profiles
  - Enterprise: Unlimited

**Step 2: Generate Profile** (`POST /api/content/voice-profile/process`)
- Credits checked and deducted (default: 10 credits)
- Examples combined and sent to AI model
- AI analyzes examples and generates 4-5 voice pillars
- Each pillar includes:
  - Name (2-4 words)
  - Instruction (directive for AI)
  - Violations (what to avoid)
- Generated profile saved to `profile` field

### 2. Using Voice Profiles

**During Content Generation** (`POST /api/content/generate`)
- Default voice profile (where `isDefault: true`) is automatically loaded
- Profile text is injected into the system prompt via `buildBaseSystemPrompt()`
- Usage tracking: `usageCount` incremented, `lastUsedAt` updated
- Profile text instructs AI to match the writing style exactly

**Profile Selection**
- Default profile used automatically
- Can be assigned per content type/channel via `voiceProfileAssignments` in Preferences
- Structure: `{ contentTypes: { "blog_post": "profile-id" }, defaultProfileId: "profile-id" }`

## 🔌 API Endpoints

### GET `/api/content/voice-profile`
Returns all voice profiles for the authenticated user.

**Response:**
```json
{
  "profiles": [...],
  "assignments": {
    "contentTypes": {},
    "channels": {},
    "defaultProfileId": null
  },
  "voiceLimit": 1,
  "currentCount": 1
}
```

### POST `/api/content/voice-profile`
Adds content examples to a profile (or creates new profile).

**Request:**
```json
{
  "content": "Your content example here...",
  "profileId": "optional-profile-id"
}
```

**Response:**
```json
{
  "profile": { ... },
  "examplesCount": 3
}
```

### POST `/api/content/voice-profile/process`
Generates voice profile from examples using AI.

**Request:**
```json
{
  "profileId": "profile-id",
  "examples": ["optional", "direct", "examples"],
  "skipSave": false,
  "deductCreditsOnly": false
}
```

**Modes:**
- **Normal**: Uses examples from database, saves generated profile
- **skipSave**: Uses provided examples, doesn't save to DB (for preview)
- **deductCreditsOnly**: Only deducts credits, returns existing profile

**Response:**
```json
{
  "success": true,
  "profile": "Generated voice profile text...",
  "creditsDeducted": 10
}
```

## 💰 Credit Costs

- **Profile Creation**: 10 credits (configurable via `NEXT_PUBLIC_VOICE_PROFILE_CREATION_COST`)
- Credits deducted **before** AI generation (atomic operation)
- If generation fails, credits are not refunded (logged for review)

## 🎨 AI Prompt Structure

**System Prompt:**
```
You are an expert voice strategist. Analyse the following content and extract 4–5 voice pillars — 
the non-negotiable tonal qualities that define this writer's authentic voice.

Each pillar should be written as a direct instruction that an AI can follow when generating new content in this voice.
For each pillar:
1. Name it — a short, descriptive label (2–4 words)
2. Instruction — write this as a clear directive: "Do this. Avoid that."
3. Violations — specific behaviours, words, or patterns that would break this pillar

Focus only on voice and tone. Ignore format, structure, and layout.
Output as a concise, scannable list — roughly 200–400 words total.
Format your response as plain text without markdown formatting.
```

**User Prompt:**
```
Analyse the following writing samples and produce a detailed voice profile description:

[Combined examples separated by "---"]

Voice Profile:
```

## 🔗 Integration with Content Generation

Voice profiles are integrated via `buildBaseSystemPrompt()` in `src/lib/prompts.ts`:

```typescript
if (voiceProfile) {
  prompt += `\n\nVoice Profile:\n${voiceProfile}\n\nWhen creating content, 
  match this writing style and voice exactly. Follow the patterns, tone, and 
  characteristics and all other details described in the voice profile.`;
}
```

The voice profile text is appended to the system prompt, ensuring all generated content matches the defined voice.

## 🔐 Access Control

- Feature ID: `content:voice_profile`
- Access checked via `checkAccess()` service
- Plan-based limits enforced on profile creation

## 📊 Usage Tracking

- `usageCount`: Incremented each time profile is used in content generation
- `lastUsedAt`: Updated to current timestamp on usage
- Helps identify most-used profiles

## 🎨 UI Components & User Flow

### Component Architecture

The voice profile UI is built as a multi-step wizard with the following structure:

**Main Component**: `VoiceProfileSettings` (`index.tsx`)
- Manages overall state and step navigation
- Handles API calls and data persistence
- Coordinates between child components
- Tracks changes for unsaved data warnings

**Step Components**:
1. **ExamplesStep** - Collects 1-5 content examples (minimum 500 words total)
2. **AnalyzingScreen** - Shows loading state during AI profile generation
3. **ReviewStep** - Displays generated profile, allows editing and testing

**Supporting Components**:
- **VoiceProfileList** - Table view of all profiles with edit/delete actions
- **CreateFirstCard** - Empty state encouraging first profile creation
- **DeleteDialog** - Confirmation dialog for profile deletion
- **VoiceProfileTestPanel** - Preview functionality to test profile output

### User Flow

```
1. Landing Page (VoiceProfileList)
   ├─ Shows all existing profiles in a table
   ├─ Displays usage count, last used date, default badge
   ├─ Actions: Edit, Delete, Set as Default
   └─ "Create New" button (disabled if limit reached)

2. Examples Step (ExamplesStep)
   ├─ User adds 1-5 content examples
   ├─ Each example: minimum 100 characters
   ├─ Total word count tracked (minimum 500 words)
   ├─ Examples can be edited/deleted individually
   └─ "Generate Profile" button (enabled when requirements met)

3. Analyzing Step (AnalyzingScreen)
   ├─ Shows animated loading state
   ├─ Displays "Analyzing your writing style..." message
   └─ Credits deducted before processing starts

4. Review Step (ReviewStep)
   ├─ Displays generated profile text
   ├─ Editable fields:
   │  ├─ Profile Name (required, max 40 chars)
   │  ├─ Description (optional)
   │  ├─ When to Use (optional, max 90 chars)
   │  └─ Profile Text (editable, full text area)
   ├─ "Set as Default" toggle
   ├─ Test Preview panel:
   │  ├─ Enter test prompt
   │  └─ Generate preview to see profile in action
   └─ Save button (validates required fields)

5. Back to List
   └─ Updated profile appears in VoiceProfileList
```

### Key UI Features

**Examples Step**:
- Real-time word count tracking
- Example counter (1-5 examples)
- Validation feedback (minimum examples/words)
- Individual example editing/deletion
- Add/remove examples dynamically

**Review Step**:
- Inline editing of generated profile
- Test preview with custom prompts
- Change detection (warns on unsaved changes)
- Quick action buttons for common prompts
- Save validation (name required)

**Profile List**:
- Sortable table with columns: Name, Examples, Usage, Last Used, Actions
- Default profile badge indicator
- Usage statistics display
- Inline editing via sheet/modal
- Plan limit indicators

**State Management**:
- Uses React hooks (`useState`, `useEffect`, `useRef`)
- Tracks unsaved changes for navigation warnings
- Optimistic UI updates with credit context integration
- Loading states for all async operations

**Access Control**:
- Wrapped in `FeatureGuard` component
- Shows upgrade prompts for restricted plans
- Disables actions when limit reached

## 🎯 Key Features

✅ **Multiple Profiles**: Users can create multiple voice profiles for different contexts  
✅ **Default Profile**: One profile can be marked as default for automatic use  
✅ **Plan Limits**: Profile count restricted by subscription tier  
✅ **Credit-Based**: Profile generation costs credits  
✅ **Usage Tracking**: Tracks how often each profile is used  
✅ **Context-Aware**: Can assign profiles to specific content types/channels  
✅ **AI-Generated**: Profiles automatically extracted from content examples  
✅ **Editable**: Users can edit generated profiles after creation  
✅ **Test Preview**: Users can test profiles before saving  
✅ **Change Detection**: Warns users about unsaved changes
