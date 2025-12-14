# Life Ops Dashboard

An ADHD-optimized life management system built with Next.js, TypeScript, and Postgres. Supports the workflow: **Capture → Clarify → Prioritize → Schedule → Execute → Finish**.

## Architecture

This project follows strict modular boundaries:

- **`/src/domain`** - Pure domain logic, validators, and business rules (no React, no DB)
- **`/src/data`** - Prisma client, repositories, and database access layer
- **`/src/app`** - Next.js pages, routes, and server actions
- **`/src/components`** - Reusable UI components
- **`/src/services`** - External service abstractions (AI, timers, notifications)
- **`/src/lib`** - Shared utilities
- **`/tests`** - Domain and integration tests

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** (strict mode)
- **Prisma ORM** with Postgres
- **TailwindCSS** + custom UI components
- **Zod** for runtime validation
- **Jest** for testing

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted)

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/7-central/life-ops-dashboard.git
cd life-ops-dashboard
npm install
```

### 2. Set Up Database

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your database connection string:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/life_ops_dashboard?schema=public"
```

#### Option A: Local Postgres

If you have Postgres installed locally:

```bash
createdb life_ops_dashboard
```

#### Option B: Vercel Postgres (Recommended for Production)

1. Install Vercel CLI: `npm i -g vercel`
2. Create a Vercel project: `vercel link`
3. Add Postgres from Vercel Dashboard → Storage → Create Database
4. Pull environment variables: `vercel env pull .env`

### 3. Initialize Database

Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:push
```

Or, if using migrations:

```bash
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |
| `npm run type-check` | Run TypeScript type checking |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database (dev) |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |

## Deploying to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Link Your Project

```bash
vercel link
```

Follow the prompts to connect to your existing GitHub repository.

### 3. Add Postgres Database

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **Create Database** → **Postgres**
4. Choose **Vercel Postgres** (recommended) or connect to Neon/Supabase
5. Vercel will automatically add environment variables to your project

### 4. Deploy

```bash
vercel --prod
```

Or simply push to your main branch if you have GitHub integration enabled.

### 5. Run Migrations on Production

After first deployment:

```bash
# Pull production env vars
vercel env pull .env.production

# Run migrations against production DB
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma migrate deploy
```

## Database Schema

The project uses these core entities:

- **CaptureItem** - Raw input from Upload Ideas
- **Task** - Clarified actionable items
- **TimeBlock** - Scheduled execution slots
- **ShippedOutput** - Evidence of completion
- **AuditEvent** - Change tracking

View the complete schema: `prisma/schema.prisma`

## Core Business Rules

### Capture Rules
- One line of input = one capture item
- Items start as `UNPROCESSED`
- Can be parked or deleted before processing

### Task Readiness Rules
A task must have all of these to be marked `READY`:
- **Domain Area** (WORK, PERSONAL, HEALTH, etc.)
- **DoD Items** (1-3 bullets defining completion)
- **Next Action** (one-sitting task)
- **Duration** (time estimate in minutes)

### Prioritization Rules
- **NOW**: Maximum 1 task
- **NEXT**: Maximum 3 tasks
- Tasks must be `READY` before prioritization

### Timebox Rules
Valid durations: 25, 45, 60, or 90 minutes

## Project Structure

```
life-ops-dashboard/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js pages and routes
│   │   ├── upload/            # Upload Ideas feature
│   │   ├── clarify/           # Clarify Queue feature
│   │   └── page.tsx           # Dashboard home
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── features/          # Feature-specific components
│   ├── domain/                # Domain models and rules
│   │   ├── capture/           # Capture domain
│   │   └── task/              # Task domain
│   ├── data/
│   │   ├── prisma.ts          # Prisma client
│   │   └── repositories/      # Data access layer
│   ├── services/              # External services (AI, timers)
│   └── lib/                   # Shared utilities
├── tests/
│   └── domain/                # Domain rule tests
├── .env.example               # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Current Features (MVP)

### ✅ Upload Ideas
- Multi-line text input
- Parse rule: one line = one capture item
- Saves as `UNPROCESSED` captures

### ✅ Clarify Queue
- Shows all unprocessed captures
- Convert to tasks with required fields
- Enforces readiness criteria
- Park or delete captures

## Upcoming Features

- **Now/Next/Later Board** - WIP limit enforcement
- **Scheduling** - Timeboxed day planning
- **Focus Mode** - Distraction-free execution
- **Ship Tracking** - DoD enforcement and output logging
- **AI Integration** - Clarify suggestions, similar task detection

## Contributing

This is a private project. For questions or issues, contact the development team.

## Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Tests are organized by domain:
- `tests/domain/capture.test.ts` - Capture rules
- `tests/domain/task.test.ts` - Task rules

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `POSTGRES_URL` | Vercel Postgres URL (production) | Production only |
| `POSTGRES_PRISMA_URL` | Vercel Postgres Prisma URL | Production only |

## License

Private and proprietary.

---

**Built with [Claude Code](https://claude.com/claude-code)**
