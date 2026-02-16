# 🚀 Sprint 1 - Task Breakdown (Week 1-2)

**Sprint Goal:** "Developers can clone, setup, and deploy the project"

**Duration:** 2 weeks (14 days)  
**Capacity:** 42-56 hours (3-4h/day)  
**Planned Story Points:** 26 SP  
**Status:** 🔄 Not Started

---

## 📊 Sprint Overview

### User Stories:
1. **US-1.4:** Monorepo Project Setup (8 SP)
2. **US-1.3:** Unified Data Storage Architecture (13 SP)
3. **US-1.5:** CI/CD Pipeline (5 SP)

### Total Estimated Hours: 48 hours

---

## 📋 US-1.4: Monorepo Project Setup

**Story Points:** 8 SP  
**Status:** ☐ Not Started

### User Story:
As a developer
I want organized monorepo structure
So that frontend and backend code is maintainable

### Acceptance Criteria:
- [ ] Turborepo or Nx configured
- [ ] Structure: `/apps` (web, api, bot) and `/packages` (ui, database, types, ai)
- [ ] Shared TypeScript configs
- [ ] ESLint + Prettier working
- [ ] Git hooks for pre-commit checks
- [ ] README with setup instructions

---

### Technical Tasks:

| Task ID | Role | Description | Est. | Status | Notes |
|---------|------|-------------|------|--------|-------|
| T-01 | DevOps | Initialize Git repository and connect to GitHub | 0.5h | ☐ | |
| T-02 | DevOps | Create monorepo structure (apps/, packages/) | 0.5h | ☐ | |
| T-03 | DevOps | Initialize pnpm workspace | 1h | ☐ | |
| T-04 | DevOps | Install and configure Turborepo | 2h | ☐ | |
| T-05 | Frontend | Setup Next.js app in apps/web | 2h | ☐ | |
| T-06 | Backend | Setup FastAPI project in apps/api | 2h | ☐ | |
| T-07 | Bot | Setup Python project in apps/bot | 1h | ☐ | |
| T-08 | DevOps | Create shared packages structure | 1h | ☐ | |
| T-09 | DevOps | Configure ESLint (TypeScript) | 1h | ☐ | |
| T-10 | DevOps | Configure Prettier | 0.5h | ☐ | |
| T-11 | DevOps | Configure Ruff/Black (Python) | 1h | ☐ | |
| T-12 | DevOps | Setup Husky for Git hooks | 1h | ☐ | |
| T-13 | DevOps | Create .gitignore | 0.5h | ☐ | |
| T-14 | Docs | Write README with setup instructions | 1h | ☐ | |
| T-15 | Testing | Test monorepo setup (install, build, lint) | 1h | ☐ | |

**Total Estimate:** 16.5 hours

---

### Task Details:

#### T-01: Initialize Git Repository
**Description:** Create Git repo and connect to GitHub

**Subtasks:**
- [ ] Run `git init`
- [ ] Create GitHub repository
- [ ] Add remote origin
- [ ] Configure Git user name and email

**Commands:**
```bash
git init
git remote add origin https://github.com/Fauza27/My-Own-Jarvis-aowkaowk.git
git config user.name "Fauza27"
git config user.email "your.email@example.com"
```

---

#### T-02: Create Monorepo Structure
**Description:** Create folder structure for monorepo

**Subtasks:**
- [ ] Create `apps/` folder
- [ ] Create `packages/` folder
- [ ] Create `docs/` folder
- [ ] Create `scripts/` folder

**Structure:**
```
lifeos/
├── apps/
│   ├── web/
│   ├── api/
│   └── bot/
├── packages/
│   ├── ui/
│   ├── database/
│   ├── types/
│   ├── ai/
│   └── utils/
├── docs/
└── scripts/
```

---

#### T-03: Initialize pnpm Workspace
**Description:** Setup pnpm workspace for monorepo

**Subtasks:**
- [ ] Install pnpm globally
- [ ] Run `pnpm init`
- [ ] Create `pnpm-workspace.yaml`
- [ ] Configure workspace packages

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

#### T-04: Install and Configure Turborepo
**Description:** Setup Turborepo for build orchestration

**Subtasks:**
- [ ] Install turbo as dev dependency
- [ ] Create `turbo.json` config
- [ ] Configure pipeline (build, dev, lint, test)
- [ ] Test turbo commands

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false
    },
    "lint": {},
    "test": {}
  }
}
```

---

#### T-05: Setup Next.js App
**Description:** Create Next.js app in apps/web

**Subtasks:**
- [ ] Run `pnpm create next-app@latest`
- [ ] Configure TypeScript
- [ ] Configure Tailwind CSS
- [ ] Setup App Router
- [ ] Create basic folder structure
- [ ] Test dev server

**Folder Structure:**
```
apps/web/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
├── public/
├── package.json
└── tsconfig.json
```

---

#### T-06: Setup FastAPI Project
**Description:** Create FastAPI project in apps/api

**Subtasks:**
- [ ] Create Python virtual environment
- [ ] Install FastAPI and dependencies
- [ ] Create `requirements.txt`
- [ ] Create basic folder structure
- [ ] Create `main.py` with hello world
- [ ] Test API server

**Folder Structure:**
```
apps/api/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── tests/
├── requirements.txt
└── .env.example
```

**Dependencies:**
```
fastapi
uvicorn
sqlalchemy
psycopg2-binary
pydantic
python-jose
passlib
bcrypt
python-multipart
```

---

#### T-07: Setup Python Project for Bot
**Description:** Create Telegram bot project structure

**Subtasks:**
- [ ] Create Python virtual environment
- [ ] Install python-telegram-bot
- [ ] Create `requirements.txt`
- [ ] Create basic folder structure
- [ ] Create `bot.py` with hello world

**Dependencies:**
```
python-telegram-bot
python-dotenv
```

---

#### T-12: Setup Husky for Git Hooks
**Description:** Configure pre-commit hooks

**Subtasks:**
- [ ] Install Husky
- [ ] Initialize Husky
- [ ] Create pre-commit hook (lint-staged)
- [ ] Test hook

**pre-commit hook:**
```bash
#!/bin/sh
pnpm lint-staged
```

---

## 📋 US-1.3: Unified Data Storage Architecture

**Story Points:** 13 SP  
**Status:** ☐ Not Started

### User Story:
As a system
I want unified database schema across all modules
So that data can be shared and cross-referenced efficiently

### Acceptance Criteria:
- [ ] PostgreSQL schema designed with proper relationships
- [ ] Core tables: Users, Expenses, HealthLogs, Tasks, Vehicles, Notifications
- [ ] Foreign key constraints enforced
- [ ] Database migrations system working
- [ ] Seed data available for development
- [ ] Backup strategy implemented

---

### Technical Tasks:

| Task ID | Role | Description | Est. | Status | Notes |
|---------|------|-------------|------|--------|-------|
| T-16 | Database | Install PostgreSQL locally | 1h | ☐ | |
| T-17 | Database | Install Prisma in packages/database | 1h | ☐ | |
| T-18 | Database | Design complete database schema | 4h | ☐ | Critical |
| T-19 | Database | Create Prisma schema file | 2h | ☐ | |
| T-20 | Database | Add indexes for performance | 1h | ☐ | |
| T-21 | Database | Create initial migration | 0.5h | ☐ | |
| T-22 | Database | Run migration on local DB | 0.5h | ☐ | |
| T-23 | Database | Create seed data script | 2h | ☐ | |
| T-24 | Database | Run seed data | 0.5h | ☐ | |
| T-25 | Database | Test database queries | 1h | ☐ | |
| T-26 | Database | Setup database backup script | 1h | ☐ | |
| T-27 | DevOps | Configure environment variables | 0.5h | ☐ | |
| T-28 | Docs | Document database schema | 1h | ☐ | |
| T-29 | Testing | Test migrations (up/down) | 1h | ☐ | |

**Total Estimate:** 17 hours

---

### Task Details:

#### T-18: Design Complete Database Schema
**Description:** Design all tables with relationships

**Tables to Design:**
1. **users** - User accounts
2. **user_profiles** - User preferences
3. **expenses** - Finance tracking
4. **budgets** - Budget management
5. **food_logs** - Meal tracking
6. **weight_logs** - Weight tracking
7. **workouts** - Exercise tracking
8. **training_plans** - Running plans
9. **vehicles** - Vehicle registration
10. **maintenance_logs** - Vehicle maintenance
11. **tasks** - Task management
12. **conversations** - Chat history
13. **messages** - Chat messages
14. **embeddings** - Vector embeddings
15. **notifications** - User notifications

**Relationships:**
- users → user_profiles (1:1)
- users → expenses (1:N)
- users → budgets (1:N)
- users → food_logs (1:N)
- users → weight_logs (1:N)
- users → workouts (1:N)
- users → vehicles (1:N)
- vehicles → maintenance_logs (1:N)
- users → tasks (1:N)
- users → conversations (1:N)
- conversations → messages (1:N)

---

#### T-19: Create Prisma Schema File
**Description:** Write Prisma schema with all models

**Example Schema:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String?
  telegramId   String?  @unique @map("telegram_id")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  profile      UserProfile?
  expenses     Expense[]
  foodLogs     FoodLog[]
  weightLogs   WeightLog[]
  workouts     Workout[]
  vehicles     Vehicle[]
  tasks        Task[]
  conversations Conversation[]
  notifications Notification[]

  @@map("users")
}

model Expense {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  amount      Decimal  @db.Decimal(10, 2)
  description String
  category    String
  date        DateTime
  receiptUrl  String?  @map("receipt_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
  @@map("expenses")
}

// ... more models
```

---

#### T-23: Create Seed Data Script
**Description:** Create script to populate database with test data

**Seed Data:**
- 1 test user
- 10 expenses (various categories)
- 5 food logs
- 3 weight logs
- 2 workouts
- 1 vehicle
- 2 maintenance logs
- 5 tasks

**Script Location:** `packages/database/seed.ts`

---

## 📋 US-1.5: CI/CD Pipeline

**Story Points:** 5 SP  
**Status:** ☐ Not Started

### User Story:
As a developer
I want automated testing and deployment
So that I can ship code confidently

### Acceptance Criteria:
- [ ] GitHub Actions workflow runs on every push
- [ ] Automated tests must pass before merge
- [ ] Staging deployment on push to `develop`
- [ ] Production deployment on push to `main`
- [ ] Environment variables managed securely
- [ ] Deployment status visible in README

---

### Technical Tasks:

| Task ID | Role | Description | Est. | Status | Notes |
|---------|------|-------------|------|--------|-------|
| T-30 | DevOps | Create GitHub Actions workflow file | 1h | ☐ | |
| T-31 | DevOps | Configure lint job | 1h | ☐ | |
| T-32 | DevOps | Configure test job | 1h | ☐ | |
| T-33 | DevOps | Configure build job | 1h | ☐ | |
| T-34 | DevOps | Setup Vercel for frontend deployment | 2h | ☐ | |
| T-35 | DevOps | Setup Railway for backend deployment | 2h | ☐ | |
| T-36 | DevOps | Configure environment variables (GitHub Secrets) | 1h | ☐ | |
| T-37 | DevOps | Create staging deployment workflow | 1h | ☐ | |
| T-38 | DevOps | Create production deployment workflow | 1h | ☐ | |
| T-39 | DevOps | Add deployment badges to README | 0.5h | ☐ | |
| T-40 | Testing | Test CI/CD pipeline (trigger workflow) | 1h | ☐ | |
| T-41 | Docs | Document deployment process | 1h | ☐ | |

**Total Estimate:** 14.5 hours

---

### Task Details:

#### T-30: Create GitHub Actions Workflow
**Description:** Create `.github/workflows/ci.yml`

**Workflow:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm build
```

---

#### T-34: Setup Vercel for Frontend
**Description:** Deploy Next.js app to Vercel

**Steps:**
- [ ] Create Vercel account
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Test deployment

---

#### T-35: Setup Railway for Backend
**Description:** Deploy FastAPI to Railway

**Steps:**
- [ ] Create Railway account
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Configure Python buildpack
- [ ] Add PostgreSQL database
- [ ] Add environment variables
- [ ] Test deployment

---

## 📊 Sprint Progress Tracking

### Daily Updates:

#### Day 1 (Date: ___):
**Planned:** T-01, T-02, T-03, T-04  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 2 (Date: ___):
**Planned:** T-05, T-06, T-07  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 3 (Date: ___):
**Planned:** T-08, T-09, T-10, T-11  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 4 (Date: ___):
**Planned:** T-12, T-13, T-14, T-15  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 5 (Date: ___):
**Planned:** T-16, T-17, T-18  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 6-7 (Weekend):
**Rest or catch-up**

#### Day 8 (Date: ___):
**Planned:** T-19, T-20, T-21, T-22  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 9 (Date: ___):
**Planned:** T-23, T-24, T-25  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 10 (Date: ___):
**Planned:** T-26, T-27, T-28, T-29  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 11 (Date: ___):
**Planned:** T-30, T-31, T-32, T-33  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 12 (Date: ___):
**Planned:** T-34, T-35  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 13 (Date: ___):
**Planned:** T-36, T-37, T-38  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 14 (Date: ___):
**Planned:** T-39, T-40, T-41, Sprint Review, Retrospective  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

---

## 📈 Sprint Metrics

### Planned vs Actual:

| Metric | Planned | Actual | Variance |
|--------|---------|--------|----------|
| Story Points | 26 SP | ___ SP | ___ |
| Total Hours | 48h | ___ h | ___ |
| Tasks Completed | 41 | ___ | ___ |
| Days Worked | 12 | ___ | ___ |
| Avg Hours/Day | 4h | ___ h | ___ |

### Velocity:
- **Planned Velocity:** 26 SP
- **Actual Velocity:** ___ SP
- **Completion Rate:** ___% (Actual / Planned × 100)

---

## ✅ Sprint Definition of Done

Sprint 1 is DONE when:

### Code:
- [ ] All 41 tasks completed
- [ ] All code committed to Git
- [ ] No linting errors
- [ ] Code follows style guide

### Functionality:
- [ ] Monorepo structure working
- [ ] Can run `pnpm dev` successfully
- [ ] Database schema created and migrated
- [ ] Seed data populated
- [ ] CI/CD pipeline running

### Testing:
- [ ] All automated tests passing
- [ ] Manual testing completed
- [ ] No critical bugs

### Deployment:
- [ ] Deployed to staging (Vercel + Railway)
- [ ] Smoke test passed on staging
- [ ] Environment variables configured

### Documentation:
- [ ] README updated with setup instructions
- [ ] Database schema documented
- [ ] Deployment process documented

### Sprint Ceremonies:
- [ ] Sprint review completed (demo recorded)
- [ ] Sprint retrospective completed
- [ ] Sprint 2 planned

---

## 🎯 Sprint Goal Check

**Sprint Goal:** "Developers can clone, setup, and deploy the project"

**Success Criteria:**
1. ✅ Can clone repository
2. ✅ Can run `pnpm install` successfully
3. ✅ Can run `pnpm dev` and see apps running
4. ✅ Database is setup and seeded
5. ✅ CI/CD pipeline is working
6. ✅ Deployed to staging environment

**Sprint Goal Achieved:** ☐ Yes ☐ No ☐ Partially

---

## 📝 Notes & Learnings

### Blockers Encountered:
1. [Blocker description] - Resolved by: [Solution]
2. [Blocker description] - Resolved by: [Solution]

### Unexpected Tasks Added:
1. [Task description] - Reason: [Why added]
2. [Task description] - Reason: [Why added]

### Estimation Accuracy:
- **Overestimated:** [Tasks that took less time]
- **Underestimated:** [Tasks that took more time]
- **Accurate:** [Tasks that matched estimate]

### Key Learnings:
1. [Learning 1]
2. [Learning 2]
3. [Learning 3]

### Improvements for Next Sprint:
1. [Improvement 1]
2. [Improvement 2]
3. [Improvement 3]

---

**Created:** [Date]  
**Last Updated:** [Date]  
**Sprint Status:** 🔄 In Progress | ✅ Completed  
**Completion Date:** [Date]
