# Life Ops Dashboard - Project Overview

**Status**: Milestones 1-2 Complete | Working on Milestone 3+

## Table of Contents
1. [Project Vision](#project-vision)
2. [Core Workflow](#core-workflow)
3. [Completed Milestones](#completed-milestones)
4. [Remaining Milestones](#remaining-milestones)
5. [Technical Architecture](#technical-architecture)
6. [Database Schema](#database-schema)
7. [Key Design Principles](#key-design-principles)
8. [How to Continue Development](#how-to-continue-development)

---

## Project Vision

A personal task management system designed around cognitive load management and execution focus. The system helps users capture ideas, clarify them into actionable tasks, prioritize work, schedule execution blocks, and track completion.

**Key Principles:**
- No ADHD references in UI/code (system is universally applicable)
- Domain-driven architecture with strict separation of concerns
- WIP limits enforced (NOW: max 1, NEXT: max 3)
- Focus on execution, not endless planning
- AI integration is opt-in and provider-abstracted

**Technology Stack:**
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Prisma ORM + PostgreSQL (Vercel Neon)
- TailwindCSS
- Deployed on Vercel

---

## Core Workflow

```
CAPTURE → CLARIFY → PRIORITIZE → SCHEDULE → EXECUTE → FINISH
```

### 1. CAPTURE (Upload Ideas)
- Quick text input for raw thoughts
- No structure required
- Creates `CaptureItem` with status `UNPROCESSED`

### 2. CLARIFY (Clarify Queue)
- Process unstructured captures into tasks
- Required fields for READY status:
  - Title
  - Domain Area
  - Definition of Done (1-3 bullets)
  - Next Action (one-sitting task)
  - Duration estimate
- Tasks can be saved as DRAFT if incomplete
- Creates `Task` with all metadata

### 3. PRIORITIZE (Dashboard Priority Board)
- Move READY tasks into priority buckets:
  - **NOW**: Max 1 task (what you're doing right now)
  - **NEXT**: Max 3 tasks (what's coming up)
  - **LATER**: Unlimited (backlog)
- WIP limits enforced with override capability
- Visual kanban-style board

### 4. SCHEDULE (Schedule Page)
- Allocate timeboxes for prioritized tasks
- Standard durations: 25/45/60/90 minutes
- Drag-and-drop timeline for today
- Creates `TimeBlock` records
- Tasks move to SCHEDULED status

### 5. EXECUTE (Focus Mode)
- Fullscreen task execution view
- Timer/countdown for timebox
- DoD checklist to mark items complete
- Options:
  - Complete successfully
  - Abandon with reason
  - Capture follow-on tasks
- Tasks move to IN_PROGRESS, then DONE/ABANDONED

### 6. FINISH (Completion)
- Record shipped outputs (links, files, deliverables)
- Optional reflection notes
- Handle follow-on tasks
- Creates `ShippedOutput` records
- Tasks archived as DONE

---

## Completed Milestones

### ✅ Milestone 0: Foundation
**What was built:**
- Next.js project scaffold
- Prisma schema with all models
- Database migrations
- Domain-driven folder structure
- Repository pattern for data access
- Unit tests for domain rules (34 passing tests)

**Key files:**
- `prisma/schema.prisma` - Full database schema
- `src/domain/task/rules.ts` - Business rules (WIP limits, READY validation)
- `src/data/repositories/*` - Data access layer
- `src/data/prisma.ts` - Prisma client

### ✅ Milestone 1: Settings, Upload & Clarify
**What was built:**
- Settings page with domain area & project management
- Upload Ideas page (capture interface)
- Clarify Queue page (process captures into tasks)
- Persistent navigation component
- User-managed domain areas and projects (replaced hardcoded enums)

**Key files:**
- `src/app/settings/page.tsx` + `actions.ts`
- `src/components/features/domain-area-manager.tsx`
- `src/components/features/project-manager.tsx`
- `src/app/upload/page.tsx` + `actions.ts`
- `src/app/clarify/page.tsx` + `actions.ts`
- `src/components/features/clarify-item.tsx`
- `src/components/ui/nav.tsx`

**Migration performed:**
- Removed `DomainArea` enum from schema
- Added `DomainArea` and `Project` tables
- Seeded default domain areas via `scripts/migrate-domain-areas.ts`

### ✅ Milestone 2: Task Management & Prioritization
**What was built:**
- Interactive priority board on Dashboard
- Full Tasks page with filtering (status, domain, project)
- Task detail view page
- Task edit form
- Server actions for task movement with WIP enforcement
- Delete/abandon task functionality

**Key files:**
- `src/app/actions/task-actions.ts` - All task mutations
- `src/components/features/priority-board.tsx` - Interactive kanban board
- `src/components/features/task-list.tsx` - Filterable task list
- `src/app/tasks/page.tsx` - All tasks page
- `src/app/tasks/[id]/page.tsx` - Task detail view
- `src/app/tasks/[id]/edit/page.tsx` - Edit page
- `src/components/features/task-edit-form.tsx` - Edit form component
- `src/app/page.tsx` - Dashboard with priority board

**Features:**
- Move tasks between READY/NOW/NEXT/LATER
- WIP limit enforcement with override dialogs
- Filter tasks by status, domain, project
- View full task details
- Edit task fields, DoD items, tags
- Soft delete (ABANDONED status)

---

## Remaining Milestones

### 🔄 Milestone 3: Schedule & Timeboxing
**Goal:** Build the daily timeline for allocating tasks to specific time slots.

**What needs to be built:**

1. **TimeBlock Management**
   - Create server actions in `src/app/actions/timebox-actions.ts`:
     - `createTimeBlock(taskId, startTime, duration)` - Create a timebox
     - `updateTimeBlock(id, startTime, duration)` - Reschedule
     - `deleteTimeBlock(id)` - Remove timebox
     - `completeTimeBlock(id, actualMinutes, notes)` - Mark completed
   - Validation rules in `src/domain/timebox/rules.ts`:
     - No overlapping timeboxes
     - Standard durations (25/45/60/90 minutes)
     - Can only schedule NOW/NEXT tasks

2. **Schedule Page UI** (`src/app/schedule/page.tsx`)
   - Timeline view for today (visual calendar)
   - Show current time indicator
   - Display existing timeboxes with task info
   - Drag-and-drop to reorder (use `@dnd-kit/core` or similar)
   - Click to create new timebox
   - Edit timebox modal/form

3. **TimeBlock Component** (`src/components/features/timebox-card.tsx`)
   - Display task title, duration, DoD count
   - Start button → launches focus mode
   - Edit/delete buttons
   - Color-coded by priority bucket
   - Show completion status

4. **Task Selection Modal** (`src/components/features/task-selector.tsx`)
   - When creating timebox, select from NOW/NEXT tasks
   - Filter by duration fit
   - Show task details inline

**Database:**
- `TimeBlock` model already exists in schema
- Fields: `id`, `taskId`, `scheduledFor`, `durationMinutes`, `completed`, `actualMinutes`, `abandonReason`

**Status Updates:**
- When timebox created: Task → SCHEDULED
- When timebox started: Task → IN_PROGRESS
- When timebox completed: Task → DONE (or stays IN_PROGRESS if not finished)

---

### 🔄 Milestone 4: Execute & Focus Mode
**Goal:** Build the execution interface for focused work sessions.

**What needs to be built:**

1. **Focus Mode Page** (`src/app/focus/[timeblockId]/page.tsx`)
   - Fullscreen layout (minimal chrome)
   - Large task title and next action
   - Countdown timer (visual + numeric)
   - DoD checklist (check off items as you go)
   - Exit options:
     - ✅ Complete successfully
     - ⏸️ Pause/Resume
     - 🚫 Abandon with reason
   - Quick capture widget for follow-on tasks

2. **Timer Component** (`src/components/features/focus-timer.tsx`)
   - Countdown from timebox duration
   - Visual progress ring/bar
   - Notifications at 5min, 1min remaining
   - Audio alert on completion (optional)
   - Pause/resume functionality

3. **DoD Checklist** (`src/components/features/dod-checklist.tsx`)
   - Display all DoD items
   - Check off as completed
   - Show progress (2/3 complete)
   - Auto-save checked state

4. **Focus Actions** (`src/app/actions/focus-actions.ts`)
   - `startTimeBlock(id)` - Mark started, set IN_PROGRESS
   - `pauseTimeBlock(id, remainingMinutes)` - Pause timer
   - `completeTimeBlock(id, completedDodItems, notes)` - Finish successfully
   - `abandonTimeBlock(id, reason, remainingMinutes)` - Exit early
   - `captureFollowOn(parentTaskId, rawText)` - Quick capture during focus

5. **Focus Entry Point**
   - From Schedule page: "Start" button on timebox
   - From Dashboard: "Start Now" on NOW task (creates ad-hoc timebox)
   - Navigation: Hide nav in focus mode, ESC to exit

**Optional Enhancements:**
- Background ambient sound picker (rain, coffee shop, etc.)
- Pomodoro mode (auto-break after 25min)
- Daily focus streak tracking
- Distraction counter (tap when distracted)

---

### 🔄 Milestone 5: Finish & Ship
**Goal:** Complete the task lifecycle with shipped outputs and reflection.

**What needs to be built:**

1. **Completion Flow** (after focus mode completes)
   - Modal or page: "Task Complete - What did you ship?"
   - Add shipped outputs (links, files, notes)
   - Optional reflection prompt
   - Create follow-on task if needed
   - Move task to DONE status

2. **Shipped Outputs** (`src/components/features/shipped-output-form.tsx`)
   - Type selector (LINK, FILE, CODE, DOCUMENT, etc.)
   - URL input for links
   - File upload for attachments
   - Notes field
   - Multiple outputs per task

3. **Completion Actions** (`src/app/actions/completion-actions.ts`)
   - `completeTask(taskId, shippedOutputs[], reflection)` - Mark DONE
   - `createFollowOnTask(parentTaskId, taskData)` - Spawn next task
   - `archiveTask(taskId)` - Soft archive (keep in DONE)

4. **Done Tasks View** (`src/app/tasks/done/page.tsx`)
   - List of completed tasks
   - Show shipped outputs
   - Show completion date
   - Filter by date range, domain
   - Export functionality

5. **Weekly Review Page** (`src/app/review/page.tsx`)
   - Summary of week's completed tasks
   - Total time spent (sum of timeblocks)
   - Shipped outputs gallery
   - Reflection prompts
   - Set goals for next week

**Database:**
- `ShippedOutput` model already exists
- Fields: `id`, `taskId`, `type`, `url`, `filePath`, `description`

**Follow-On Logic:**
- Task can have `followOnOfTaskId` (parent task reference)
- When creating follow-on, link to parent
- Show follow-on chain in task detail view

---

### 🔄 Milestone 6: Polish & Production
**What needs to be built:**

1. **Analytics Dashboard** (`src/app/analytics/page.tsx`)
   - Tasks completed over time (chart)
   - Average completion time vs. estimate
   - Domain area distribution
   - WIP limit violations log
   - Focus time heatmap

2. **Mobile Responsiveness**
   - Test all pages on mobile
   - Optimize priority board for touch
   - Mobile-friendly timeline view
   - Quick capture shortcut for mobile

3. **Error Handling & Validation**
   - Improve error messages throughout
   - Add loading states to all mutations
   - Optimistic UI updates where appropriate
   - Toast notifications for actions

4. **Onboarding Flow**
   - First-time user tutorial
   - Sample tasks and domain areas
   - Guided walkthrough of workflow
   - Help tooltips on key features

5. **Search & Filtering**
   - Global search across all tasks
   - Search by title, notes, tags
   - Advanced filters (date range, multiple statuses)
   - Saved filter presets

6. **Performance Optimization**
   - Add database indexes (already have some)
   - Implement pagination on task lists
   - Optimize Prisma queries (select only needed fields)
   - Add caching where appropriate

7. **AI Integration (Optional)**
   - Create `src/services/ai/` directory
   - Provider abstraction (OpenAI, Anthropic, local)
   - Features:
     - Auto-generate DoD from task title
     - Suggest next action from description
     - Estimate duration based on task
     - Summarize completed work
   - All AI features behind feature flag
   - Never required for core functionality

---

## Technical Architecture

### Folder Structure
```
src/
├── app/                      # Next.js App Router pages
│   ├── actions/              # Server actions (mutations)
│   ├── page.tsx              # Dashboard
│   ├── upload/               # Capture page
│   ├── clarify/              # Clarify queue
│   ├── tasks/                # Task management
│   ├── schedule/             # Timeline view
│   ├── focus/                # Focus mode
│   ├── settings/             # Settings
│   └── layout.tsx            # Root layout
├── components/
│   ├── features/             # Feature-specific components
│   │   ├── priority-board.tsx
│   │   ├── task-list.tsx
│   │   ├── clarify-item.tsx
│   │   └── ...
│   └── ui/                   # Generic UI components
│       └── nav.tsx
├── data/
│   ├── prisma.ts             # Prisma client
│   └── repositories/         # Data access layer
│       ├── task-repository.ts
│       ├── capture-repository.ts
│       ├── domain-area-repository.ts
│       └── project-repository.ts
├── domain/                   # Business logic & rules
│   ├── task/
│   │   └── rules.ts          # Task validation, WIP limits
│   └── timebox/
│       └── rules.ts          # TimeBlock validation
├── services/                 # External integrations
│   └── ai/                   # AI provider abstraction (future)
└── generated/
    └── prisma/               # Generated Prisma client
```

### Design Patterns

1. **Repository Pattern**
   - All database access goes through repositories
   - Repositories expose simple, semantic methods
   - Never use Prisma directly in components

2. **Server Actions**
   - All mutations are server actions in `app/actions/`
   - Actions call repositories and domain rules
   - Actions handle revalidation with `revalidatePath()`
   - Return `{success, error?, data?}` shape

3. **Domain Rules**
   - Business logic lives in `src/domain/`
   - Pure functions that validate and enforce rules
   - Example: `canMoveToNow(currentCount)` returns `{valid, error?}`
   - Never throw exceptions, always return validation results

4. **Component Organization**
   - Server Components: Pages, data fetching
   - Client Components: Interactivity, forms, state
   - Mark with `'use client'` only when needed
   - Collocate components with their pages when possible

5. **Type Safety**
   - Use Prisma-generated types
   - Extend with `& { relation: Type | null }` for includes
   - Define input types for actions and forms
   - No `any` types allowed

---

## Database Schema

### Key Models

```prisma
model CaptureItem {
  id         String        @id @default(cuid())
  rawText    String
  capturedAt DateTime      @default(now())
  status     CaptureStatus @default(UNPROCESSED)
  source     String        @default("manual")
  tasks      Task[]
}

model DomainArea {
  id        String   @id @default(cuid())
  name      String   @unique
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  tasks     Task[]
}

model Project {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  tasks       Task[]
}

model Task {
  id                  String      @id @default(cuid())
  title               String
  status              TaskStatus  @default(DRAFT)
  dodItems            String[]    @default([])
  nextAction          String?
  durationMinutes     Int?
  priorityBucket      PriorityBucket?

  // Planning metadata
  energyFit           EnergyLevel?
  urgency             Int?        // 1-5
  impact              Int?        // 1-5
  effort              Int?        // 1-5

  // Optional
  notes               String?
  tags                String[]    @default([])
  contexts            String[]    @default([])
  dueAt               DateTime?

  // Relationships
  domainAreaId        String?
  domainArea          DomainArea?  @relation(fields: [domainAreaId], references: [id])
  projectId           String?
  project             Project?     @relation(fields: [projectId], references: [id])
  originCaptureItemId String?
  originCaptureItem   CaptureItem? @relation(fields: [originCaptureItemId], references: [id])
  followOnOfTaskId    String?
  followOnOf          Task?        @relation("FollowOnTasks", fields: [followOnOfTaskId], references: [id])
  followOnTasks       Task[]       @relation("FollowOnTasks")

  timeBlocks          TimeBlock[]
  shippedOutputs      ShippedOutput[]

  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
}

model TimeBlock {
  id              String    @id @default(cuid())
  taskId          String
  task            Task      @relation(fields: [taskId], references: [id])
  scheduledFor    DateTime
  durationMinutes Int
  completed       Boolean   @default(false)
  actualMinutes   Int?
  abandonReason   String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model ShippedOutput {
  id          String     @id @default(cuid())
  taskId      String
  task        Task       @relation(fields: [taskId], references: [id])
  type        OutputType
  url         String?
  filePath    String?
  description String?
  createdAt   DateTime   @default(now())
}

model AuditEvent {
  id              String      @id @default(cuid())
  eventType       String
  entityType      String
  entityId        String
  oldValue        Json?
  newValue        Json?
  timestamp       DateTime    @default(now())
  taskId          String?
  task            Task?       @relation(fields: [taskId], references: [id])
  captureItemId   String?
  captureItem     CaptureItem? @relation(fields: [captureItemId], references: [id])
}
```

### Enums

```prisma
enum CaptureStatus {
  UNPROCESSED
  PROCESSED
  PARKED
  DELETED
}

enum TaskStatus {
  DRAFT         // Being clarified
  READY         // Ready to prioritize
  NOW           // Current priority (max 1)
  NEXT          // Up next (max 3)
  LATER         // Backlog
  SCHEDULED     // Has timebox
  IN_PROGRESS   // Currently executing
  DONE          // Completed
  ABANDONED     // Explicitly abandoned
}

enum PriorityBucket {
  NOW
  NEXT
  LATER
}

enum EnergyLevel {
  HIGH
  MEDIUM
  LOW
}

enum OutputType {
  LINK
  FILE
  CODE_COMMIT
  DOCUMENT
  DESIGN
  VIDEO
  OTHER
}
```

---

## Key Design Principles

### 1. WIP Limit Enforcement
- **NOW**: Maximum 1 task
- **NEXT**: Maximum 3 tasks
- Limits enforced in `src/domain/task/rules.ts`
- Server actions check limits before mutation
- UI allows override with confirmation dialog
- Override should be rare, logged in audit events

### 2. Task Ready Criteria
A task can only move from DRAFT → READY if:
- Has a domain area assigned
- Has 1-3 DoD items
- Has a next action defined
- Has a duration estimate

Validated in `canMarkTaskReady()` domain rule.

### 3. No Business Logic in UI
- Components only render and capture user input
- All validation in domain rules
- All mutations in server actions
- UI components call actions and display results
- Never perform calculations or enforce rules in components

### 4. Fail Gracefully
- All actions return `{success: boolean, error?: string, data?: any}`
- Never throw exceptions from actions
- Display errors in UI, don't crash
- Log errors to console for debugging

### 5. Optimistic Updates (When Appropriate)
- Use for non-critical updates (reordering, toggling)
- Revalidate after mutation completes
- Roll back on error

### 6. Accessibility
- Semantic HTML (h1-h6, nav, main, etc.)
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Focus indicators visible

### 7. No ADHD Language
- Never use terms like "ADHD", "executive function", "dopamine"
- Use universal language: "focus", "prioritize", "complete"
- System helps everyone, not a specific diagnosis

---

## How to Continue Development

### Starting a New Milestone

1. **Read this document fully** to understand context
2. **Check what's complete** in the "Completed Milestones" section
3. **Review the next milestone** you're building
4. **Examine existing code** to understand patterns:
   - Look at `src/app/actions/task-actions.ts` for action patterns
   - Look at `src/components/features/` for component patterns
   - Look at domain rules for validation patterns

### Development Workflow

1. **Start with domain rules** (if needed)
   - Define validation logic in `src/domain/`
   - Write pure functions that return results
   - Add tests if doing TDD

2. **Create server actions**
   - Add file in `src/app/actions/`
   - Call domain rules for validation
   - Call repository methods for data access
   - Revalidate paths that show the data
   - Return structured results

3. **Build the page** (server component)
   - Fetch data using Prisma/repositories
   - Pass data to client components
   - Keep page component simple

4. **Build client components** (if needed)
   - Mark `'use client'` at top
   - Handle user interactions
   - Call server actions
   - Display loading/error states
   - Revalidation happens automatically

5. **Test manually**
   - Run `npm run dev`
   - Test happy path
   - Test error cases
   - Test edge cases (WIP limits, etc.)

### Common Patterns

**Server Action Pattern:**
```typescript
'use server';

import { repository } from '@/data/repositories/...';
import { validateSomething } from '@/domain/.../rules';
import { revalidatePath } from 'next/cache';

export async function doSomething(id: string, data: SomeData) {
  try {
    // 1. Validate
    const validation = validateSomething(data);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 2. Mutate
    const result = await repository.update(id, data);

    // 3. Revalidate
    revalidatePath('/some-page');
    revalidatePath('/');

    // 4. Return
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in doSomething:', error);
    return { success: false, error: 'Failed to do something' };
  }
}
```

**Client Component Pattern:**
```typescript
'use client';

import { useState } from 'react';
import { doSomething } from '@/app/actions/...';

export function MyComponent({ data }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction() {
    setLoading(true);
    setError(null);

    const result = await doSomething(data.id, formData);

    if (!result.success) {
      setError(result.error || 'Something went wrong');
    }

    setLoading(false);
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={handleAction} disabled={loading}>
        {loading ? 'Loading...' : 'Do Something'}
      </button>
    </div>
  );
}
```

### Database Changes

If you need to modify the schema:
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` (development)
3. Or create a migration: `npx prisma migrate dev --name description`
4. Regenerate client: `npm run db:generate`

### Testing Your Changes

1. **Dev server**: `npm run dev` (runs on port 3001 if 3000 is busy)
2. **Database studio**: `npx prisma studio` to view data
3. **Check logs**: Watch console for errors
4. **Test workflow end-to-end**: Go through full user journey

### When You Get Stuck

1. **Read existing code** - patterns are consistent
2. **Check Prisma docs** - https://www.prisma.io/docs
3. **Check Next.js docs** - https://nextjs.org/docs
4. **Look at completed milestones** for similar features
5. **Start simple, iterate** - get basic version working first

---

## Current State

- **Database**: Seeded with default domain areas
- **Dev Server**: Running on `http://localhost:3001`
- **Git**: All changes committed to `main` branch
- **Deployment**: Vercel project connected to GitHub
- **Database**: Vercel Postgres (Neon) connected

### Quick Commands
```bash
npm run dev              # Start dev server
npm run db:studio        # Open Prisma Studio
npm run db:push          # Push schema changes (dev)
npm run db:generate      # Regenerate Prisma client
npm run test             # Run tests (if any)
npm run build            # Production build
```

---

## Success Criteria for Each Milestone

### Milestone 3 (Schedule)
- ✅ Can create timeboxes for tasks
- ✅ Can see today's timeline
- ✅ Can reschedule/delete timeboxes
- ✅ No overlapping timeboxes allowed
- ✅ Tasks move to SCHEDULED when timeboxed

### Milestone 4 (Execute)
- ✅ Can start focus mode from timebox
- ✅ Timer counts down correctly
- ✅ Can check off DoD items
- ✅ Can complete or abandon with reason
- ✅ Tasks move to IN_PROGRESS, then DONE/ABANDONED

### Milestone 5 (Finish)
- ✅ Can record shipped outputs
- ✅ Can create follow-on tasks
- ✅ Can view completed tasks
- ✅ Weekly review shows summary

### Milestone 6 (Polish)
- ✅ All pages mobile responsive
- ✅ No console errors
- ✅ Loading states everywhere
- ✅ Search works across tasks
- ✅ Analytics show meaningful data

---

## Notes for Future Sessions

- **Code style**: No emojis in code unless user explicitly requests
- **Architecture**: Maintain strict separation - no business logic in UI
- **Testing**: User has tested Milestones 1-2 and confirmed they work
- **Performance**: Everything compiles successfully, no errors in dev server
- **AI stance**: User wants AI integration to be opt-in and provider-abstracted
- **Tone**: Keep documentation and UI professional, avoid unnecessary praise

**Last updated**: After completing Milestone 2
**Next step**: Build Milestone 3 (Schedule & Timeboxing)
