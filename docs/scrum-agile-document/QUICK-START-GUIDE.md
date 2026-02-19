# ⚡ Quick Start Guide - LifeOS Development

**Tujuan:** Panduan cepat untuk memulai development LifeOS besok!

---

## 📅 Hari Pertama (Besok!)

### Morning (09:00 - 12:00):

#### 1. Setup Development Environment (2 jam)

**Install Tools:**
```bash
# Install Node.js 18+ (jika belum)
# Download dari: https://nodejs.org/

# Install pnpm
npm install -g pnpm

# Install Python 3.11+ (jika belum)
# Download dari: https://www.python.org/

# Install PostgreSQL (jika belum)
# Download dari: https://www.postgresql.org/

# Install Redis (jika belum)
# Windows: https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis
```

**Create Project:**
```bash
# Create project directory
mkdir lifeos
cd lifeos

# Initialize Git
git init
git branch -M main

# Create GitHub repository (via GitHub website)
# Then connect:
git remote add origin https://github.com/yourusername/lifeos.git
```

**Setup Monorepo:**
```bash
# Initialize pnpm workspace
pnpm init

# Install Turborepo
pnpm add -D turbo

# Create workspace structure
mkdir -p apps/web apps/api apps/bot
mkdir -p packages/ui packages/database packages/types packages/ai packages/utils
mkdir -p docs scripts
```

#### 2. Review Documentation (1 jam)

**Read These Files:**
1. `product-vision.md` - Understand the vision
2. `sprint-planning.md` - Review Sprint 1 goals
3. `technical-architecture.md` - Understand tech stack

**Sprint 1 Goal:**
"Developers can clone, setup, and deploy the project"

**Sprint 1 User Stories:**
- US-1.4: Monorepo Project Setup (8 SP)
- US-1.3: Unified Data Storage Architecture (13 SP)
- US-1.5: CI/CD Pipeline (5 SP)

---

### Afternoon (13:00 - 17:00):

#### 3. Setup Next.js App (2 jam)

```bash
cd apps/web

# Create Next.js app
pnpm create next-app@latest . --typescript --tailwind --app --src-dir

# Install shadcn/ui
pnpm dlx shadcn-ui@latest init

# Install dependencies
pnpm add zustand zod react-hook-form @hookform/resolvers
pnpm add -D @types/node

# Create basic structure
mkdir -p src/app/(auth) src/app/(dashboard)
mkdir -p src/components/ui src/components/features
mkdir -p src/lib src/hooks src/types
```

#### 4. Setup FastAPI Backend (2 jam)

```bash
cd apps/api

# Create Python virtual environment
python -m venv venv

# Activate venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install FastAPI and dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-jose passlib bcrypt python-multipart

# Create requirements.txt
pip freeze > requirements.txt

# Create basic structure
mkdir -p app/api app/core app/models app/schemas app/services
touch app/__init__.py app/main.py
```

**Create `app/main.py`:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="LifeOS API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "LifeOS API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

**Test API:**
```bash
uvicorn app.main:app --reload
# Visit: http://localhost:8000/docs
```

---

## 📅 Hari Kedua

### Morning (09:00 - 12:00):

#### 5. Setup Database (2 jam)

**Install Prisma:**
```bash
cd packages/database

pnpm init
pnpm add prisma @prisma/client
pnpm add -D typescript @types/node

# Initialize Prisma
pnpm prisma init
```

**Create Schema (`prisma/schema.prisma`):**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  name          String?
  telegramId    String?  @unique @map("telegram_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

**Setup Database:**
```bash
# Create .env file
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/lifeos" > .env

# Run migration
pnpm prisma migrate dev --name init

# Generate Prisma Client
pnpm prisma generate
```

#### 6. Setup CI/CD (1 jam)

**Create `.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run tests
        run: pnpm test
      
      - name: Build
        run: pnpm build
```

---

### Afternoon (13:00 - 17:00):

#### 7. Create README and Documentation (2 jam)

**Already done!** ✅
- product-vision.md
- product-backlog.md
- sprint-planning.md
- technical-architecture.md
- definition-of-done.md
- README.md

#### 8. First Commit and Push (1 jam)

```bash
# Create .gitignore
cat > .gitignore << EOF
node_modules/
.env
.env.local
dist/
build/
.next/
venv/
__pycache__/
*.pyc
.DS_Store
EOF

# Add all files
git add .

# First commit
git commit -m "chore: initial project setup with monorepo structure"

# Push to GitHub
git push -u origin main

# Create develop branch
git checkout -b develop
git push -u origin develop
```

#### 9. Sprint 1 Planning (1 jam)

**Create Sprint 1 Tracking File:**
```bash
mkdir -p sprints
touch sprints/sprint-01.md
```

**Fill in Sprint 1 Details:**
```markdown
# Sprint 1 - Week 1-2

## Sprint Goal
"Developers can clone, setup, and deploy the project"

## User Stories
- [ ] US-1.4: Monorepo Project Setup (8 SP)
- [ ] US-1.3: Unified Data Storage Architecture (13 SP)
- [ ] US-1.5: CI/CD Pipeline (5 SP)

## Daily Progress
### Day 1 (Date):
- [x] Setup development environment
- [x] Create monorepo structure
- [x] Setup Next.js app
- [x] Setup FastAPI backend

### Day 2 (Date):
- [x] Setup Prisma database
- [x] Setup CI/CD pipeline
- [x] Create documentation
- [x] First commit

### Day 3 (Date):
- [ ] ...
```

---

## 🎯 Week 1 Checklist

### Day 1-2 (Setup):
- [x] Install development tools
- [x] Create monorepo structure
- [x] Setup Next.js app
- [x] Setup FastAPI backend
- [x] Setup Prisma database
- [x] Setup CI/CD
- [x] First commit

### Day 3-4 (Database):
- [ ] Complete database schema (all tables)
- [ ] Create migrations
- [ ] Add indexes
- [ ] Seed data
- [ ] Test database queries

### Day 5-7 (Infrastructure):
- [ ] Setup ESLint + Prettier
- [ ] Setup Git hooks (Husky)
- [ ] Setup testing framework (Jest, Pytest)
- [ ] Deploy to staging (Vercel + Railway)
- [ ] Verify deployment works

---

## 📋 Daily Routine

### Morning Routine (09:00):
1. **Review yesterday's progress** (5 min)
2. **Check sprint goal** (2 min)
3. **Plan today's tasks** (3 min)
4. **Start coding!** (10 min setup)

### Coding Session (09:10 - 12:00):
- **Pomodoro:** 50 min work, 10 min break
- **Focus:** One task at a time
- **Commit:** Every feature/fix

### Lunch Break (12:00 - 13:00)

### Afternoon Session (13:00 - 17:00):
- **Pomodoro:** 50 min work, 10 min break
- **Testing:** Write tests as you go
- **Documentation:** Update docs

### End of Day (17:00):
1. **Commit all changes** (5 min)
2. **Update sprint tracking** (5 min)
3. **Write daily standup notes** (5 min)
4. **Plan tomorrow** (5 min)

---

## 🛠️ Essential Commands

### Development:
```bash
# Start all apps
pnpm dev

# Start specific app
pnpm dev:web
pnpm dev:api
pnpm dev:bot

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

### Database:
```bash
# Create migration
pnpm db:migrate

# Generate Prisma Client
pnpm db:generate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

### Git:
```bash
# Create feature branch
git checkout -b feature/US-1.1-description

# Commit changes
git add .
git commit -m "feat: description"

# Push to remote
git push origin feature/US-1.1-description

# Merge to develop
git checkout develop
git merge feature/US-1.1-description
```

---

## 💡 Pro Tips

### 1. Time Management:
- **3-4 hours/day** is realistic for solo dev
- **Morning:** Most productive (complex tasks)
- **Afternoon:** Less complex tasks (UI, docs)
- **Breaks:** Essential (every 50 min)

### 2. Avoid Distractions:
- Turn off notifications
- Use website blockers (Freedom, Cold Turkey)
- Dedicated workspace
- Music (if helps focus)

### 3. Stay Motivated:
- **Track progress:** Update sprint board daily
- **Celebrate wins:** Every completed story
- **Build in public:** Tweet progress
- **Community:** Join dev communities

### 4. When Stuck:
- **Google first:** 90% of problems solved
- **ChatGPT:** For code examples
- **Documentation:** Read official docs
- **Community:** Ask in Discord/Reddit
- **Take break:** Sometimes best solution

### 5. Code Quality:
- **Write tests:** Don't skip
- **Commit often:** Small, atomic commits
- **Refactor:** Don't let debt accumulate
- **Review:** Self-review before commit

---

## 🚨 Common Pitfalls to Avoid

### 1. Perfectionism:
- ❌ "This code isn't perfect yet"
- ✅ "This code works, ship it, iterate later"

### 2. Scope Creep:
- ❌ "Just one more feature..."
- ✅ "Defer to post-MVP"

### 3. Skipping Tests:
- ❌ "I'll add tests later"
- ✅ "Write tests now"

### 4. No Breaks:
- ❌ "I'll code for 6 hours straight"
- ✅ "50 min work, 10 min break"

### 5. Isolation:
- ❌ "I'll work alone in silence"
- ✅ "Share progress, get feedback"

---

## 📞 Need Help?

### Resources:
- **Documentation:** Read docs in this repo
- **ChatGPT:** For code help
- **Stack Overflow:** For specific errors
- **Discord:** Join dev communities
- **Twitter:** Follow #buildinpublic

### Emergency Contacts:
- **Burnout:** Take a break, it's okay
- **Stuck:** Ask for help, don't waste time
- **Demotivated:** Review your "why"

---

## 🎉 You Got This!

Remember:
- **Progress > Perfection**
- **Consistency > Intensity**
- **Learning > Shipping fast**
- **Enjoy the journey!**

**Start tomorrow, build amazing things! 🚀**

---

**Last Updated:** February 2025
