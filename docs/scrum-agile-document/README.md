# 🚀 LifeOS - AI-Powered Life Orchestration Platform

**Empowering individuals to live intentionally through AI-powered life orchestration**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## 📖 About

LifeOS adalah platform all-in-one yang mengintegrasikan berbagai aspek kehidupan Anda:

- 💰 **Finance Intelligence** - Track expenses, budgeting, AI insights
- 🥗 **Health Tracking** - Calorie counting, weight monitoring, meal recommendations
- 🏃 **Running Coach** - Training plans, performance analytics, AI coaching
- 🚗 **Vehicle Intelligence** - Maintenance tracking, service reminders, AI mechanic
- ✅ **Productivity** - Task management, AI prioritization, calendar integration
- 🎓 **Study Planning** - Course management, AI study schedules
- 🤖 **AI Assistant** - Conversational interface, cross-module insights

**Tech Stack:** Next.js, FastAPI, PostgreSQL, GPT-4, Telegram Bot

---

## 🎯 Project Status

**Current Phase:** Foundation (Sprint 1-6)  
**Timeline:** 12 months (24 sprints)  
**Progress:** [0/24] sprints completed

### Milestones:
- [ ] Phase 1: Foundation (Month 1-3)
- [ ] Phase 2: Expansion (Month 4-6)
- [ ] Phase 3: Integration (Month 7-9)
- [ ] Phase 4: Launch (Month 10-12)

---

## 📚 Documentation

### Planning Documents:
- [Product Vision](./product-vision.md) - Vision, mission, target audience
- [Product Backlog](./product-backlog.md) - All user stories (110+)
- [Sprint Planning](./sprint-planning.md) - 24 sprints breakdown
- [Technical Architecture](./technical-architecture.md) - System design

### Process Documents:
- [Definition of Done](./definition-of-done.md) - Quality checklist
- [User Stories Template](./user-stories-template.md) - How to write stories
- [Sprint Retrospective Template](./sprint-retrospective-template.md) - Reflection guide
- [Risk Register](./risk-register.md) - Risk management

---

## 🏗️ Project Structure

```
lifeos/
├── apps/
│   ├── web/                 # Next.js web app
│   ├── api/                 # FastAPI backend
│   └── bot/                 # Telegram bot
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── database/            # Prisma schema + client
│   ├── types/               # Shared TypeScript types
│   ├── ai/                  # AI utilities
│   └── utils/               # Shared utilities
├── docs/                    # Documentation
├── scripts/                 # Build/deploy scripts
└── README.md               # This file
```

---

## 🚀 Getting Started

### Prerequisites:
- Node.js 18+ (for Next.js)
- Python 3.11+ (for FastAPI)
- PostgreSQL 15+ (database)
- Redis 7+ (cache)
- pnpm (package manager)

### Installation:

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/lifeos.git
cd lifeos
```

2. **Install dependencies:**
```bash
# Install pnpm if not installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

3. **Setup environment variables:**
```bash
# Copy example env files
cp .env.example .env

# Edit .env with your values:
# - DATABASE_URL
# - OPENAI_API_KEY
# - TELEGRAM_BOT_TOKEN
# - JWT_SECRET
```

4. **Setup database:**
```bash
# Run migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed
```

5. **Start development servers:**
```bash
# Start all apps (web, api, bot)
pnpm dev

# Or start individually:
pnpm dev:web    # Next.js (localhost:3000)
pnpm dev:api    # FastAPI (localhost:8000)
pnpm dev:bot    # Telegram bot
```

6. **Open browser:**
```
http://localhost:3000
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run linter
pnpm lint

# Format code
pnpm format
```

---

## 📦 Deployment

### Staging:
```bash
# Deploy to staging (automatic on push to develop)
git push origin develop
```

### Production:
```bash
# Deploy to production (automatic on push to main)
git push origin main
```

### Manual Deployment:
```bash
# Deploy frontend (Vercel)
pnpm deploy:web

# Deploy backend (Railway)
pnpm deploy:api
```

---

## 🛠️ Development Workflow

### Sprint Workflow:
1. **Sprint Planning** (Day 1)
   - Review product backlog
   - Select user stories for sprint
   - Break down into tasks
   - Commit to sprint goal

2. **Daily Development** (Day 2-13)
   - Code features
   - Write tests
   - Commit regularly
   - Update task status

3. **Sprint Review** (Day 14)
   - Demo completed features
   - Record video
   - Check sprint goal

4. **Sprint Retrospective** (Day 14)
   - What went well?
   - What didn't go well?
   - Action items for next sprint

### Git Workflow:
```bash
# Create feature branch
git checkout -b feature/US-1.1-authentication

# Make changes and commit
git add .
git commit -m "feat: implement JWT authentication"

# Push to remote
git push origin feature/US-1.1-authentication

# Merge to develop (after testing)
git checkout develop
git merge feature/US-1.1-authentication

# Deploy to production (after staging testing)
git checkout main
git merge develop
```

### Commit Message Convention:
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

---

## 📊 Project Metrics

### Development Metrics:
- **Velocity:** Target 21-28 SP/sprint
- **Test Coverage:** Target 70%+
- **Code Quality:** ESLint + Prettier
- **Performance:** <2s page load

### Product Metrics (Post-Launch):
- **Users:** Target 100+ (Month 12)
- **Retention:** Target 60%+ D30
- **NPS:** Target 50+
- **Uptime:** Target 99.5%+

---

## 🤝 Contributing

This is a solo project for learning purposes, but feedback and suggestions are welcome!

### How to Contribute:
1. Open an issue for bugs or feature requests
2. Fork the repository
3. Create a feature branch
4. Make your changes
5. Submit a pull request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** - GPT-4 API
- **Vercel** - Hosting platform
- **shadcn/ui** - UI components
- **FastAPI** - Backend framework
- **Prisma** - Database ORM

---

## 📧 Contact

**Developer:** [Your Name]  
**Email:** [your.email@example.com]  
**Twitter:** [@yourhandle](https://twitter.com/yourhandle)  
**LinkedIn:** [Your Profile](https://linkedin.com/in/yourprofile)

---

## 🗺️ Roadmap

### Q1 2025 (Month 1-3): Foundation
- [x] Project setup
- [ ] Authentication system
- [ ] Finance module (core)
- [ ] Health module (core)
- [ ] Telegram bot integration

### Q2 2025 (Month 4-6): Expansion
- [ ] Running coach module
- [ ] Vehicle intelligence module
- [ ] AI assistant with RAG
- [ ] Cross-module insights

### Q3 2025 (Month 7-9): Integration
- [ ] Productivity module
- [ ] Study planning module
- [ ] Unified dashboard
- [ ] Mobile PWA

### Q4 2025 (Month 10-12): Launch
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Beta launch (50 users)
- [ ] Public launch (Product Hunt)

---

## 📈 Progress Tracking

Track progress in:
- [Sprint Planning](./sprint-planning.md) - Sprint-by-sprint breakdown
- [GitHub Projects](https://github.com/yourusername/lifeos/projects) - Kanban board
- [Retrospectives](./retrospectives/) - Sprint reflections

---

**Built with ❤️ by [Your Name]**

**Last Updated:** February 2025
