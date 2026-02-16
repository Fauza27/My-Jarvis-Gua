# 🚀 Sprint 3 - Task Breakdown (Week 5-6)

**Sprint Goal:** "Users can log expenses via Telegram and view them on web"

**Duration:** 2 weeks (14 days)  
**Capacity:** 42-56 hours (3-4h/day)  
**Planned Story Points:** 24 SP  
**Status:** 🔄 Not Started

---

## 📊 Sprint Overview

### User Stories:
1. **US-1.7:** Telegram Bot Integration (8 SP)
2. **US-2.1:** Manual Expense Input via Chat (8 SP)
3. **US-2.4:** Transaction History Dashboard (5 SP)
4. **US-1.9:** Notification System - Basic (3 SP)

### Total Estimated Hours: 50 hours

---

## 📋 US-1.7: Telegram Bot Integration

**Story Points:** 8 SP  
**Status:** ☐ Not Started

### User Story:
As a user
I want chat interface via Telegram
So that I can input data quickly without opening the app

### Acceptance Criteria:
- [ ] Bot responds to `/start` command with welcome message
- [ ] User can link Telegram account to web account
- [ ] Bot persists conversation state (multi-turn conversations)
- [ ] Basic command structure working (`/help`, `/expense`, `/food`, etc)
- [ ] Bot deployed and accessible 24/7
- [ ] Error handling for invalid inputs

---

### Technical Tasks:

| Task ID | Role | Description | Est. | Status | Notes |
|---------|------|-------------|------|--------|-------|
| T-01 | Bot | Setup python-telegram-bot library | 1h | ☐ | |
| T-02 | Bot | Create bot.py with basic structure | 1h | ☐ | |
| T-03 | Bot | Register bot with BotFather, get token | 0.5h | ☐ | |
| T-04 | Bot | Implement /start command handler | 1h | ☐ | |
| T-05 | Bot | Implement /help command handler | 1h | ☐ | |
| T-06 | Bot | Create conversation state manager | 2h | ☐ | |
| T-07 | Bot | Implement error handling middleware | 1h | ☐ | |
| T-08 | Backend | Create POST /api/v1/telegram/link endpoint | 2h | ☐ | |
| T-09 | Backend | Generate linking token (6-digit code) | 1h | ☐ | |
| T-10 | Bot | Implement account linking flow | 2h | ☐ | |
| T-11 | Frontend | Create Telegram linking page | 2h | ☐ | |
| T-12 | Frontend | Add "Link Telegram" button in profile | 1h | ☐ | |
| T-13 | DevOps | Deploy bot to Railway/Render | 2h | ☐ | |
| T-14 | DevOps | Setup environment variables | 0.5h | ☐ | |
| T-15 | DevOps | Configure webhook (if using) | 1h | ☐ | |
| T-16 | Testing | Test bot commands | 1h | ☐ | |
| T-17 | Testing | Test account linking flow | 1h | ☐ | |
| T-18 | Docs | Document bot commands | 0.5h | ☐ | |

**Total Estimate:** 21.5 hours

---

## 📋 US-2.1: Manual Expense Input via Chat

**Story Points:** 8 SP  
**Status:** ☐ Not Started

### User Story:
As a user
I want to log expenses via natural language
So that I can quickly record spending without forms

### Acceptance Criteria:
- [ ] Bot extracts amount and description from message
- [ ] Bot asks for category confirmation (inline buttons)
- [ ] Expense saved to database with timestamp
- [ ] Confirmation message sent with transaction details
- [ ] Handles Indonesian number formats (15k, 15rb, 15ribu)
- [ ] 95%+ accuracy on common patterns

---

### Technical Tasks:

| Task ID | Role | Description | Est. | Status | Notes |
|---------|------|-------------|------|--------|-------|
| T-19 | Backend | Create Expense Pydantic model | 1h | ☐ | |
| T-20 | Backend | Create POST /api/v1/expenses endpoint | 2h | ☐ | |
| T-21 | Backend | Add input validation (amount, description) | 1h | ☐ | |
| T-22 | AI | Design prompt for expense parsing | 1h | ☐ | |
| T-23 | AI | Integrate GPT-4 API for parsing | 2h | ☐ | |
| T-24 | AI | Implement regex fallback for simple inputs | 1h | ☐ | |
| T-25 | AI | Handle Indonesian number formats (15k, 15rb) | 1h | ☐ | |
| T-26 | AI | Implement response caching (Redis) | 1h | ☐ | |
| T-27 | Bot | Create /expense command handler | 2h | ☐ | |
| T-28 | Bot | Implement natural language expense input | 2h | ☐ | |
| T-29 | Bot | Create inline keyboard for categories | 1h | ☐ | |
| T-30 | Bot | Handle category selection callback | 1h | ☐ | |
| T-31 | Bot | Send confirmation message with details | 1h | ☐ | |
| T-32 | Bot | Handle parsing errors gracefully | 1h | ☐ | |
| T-33 | Testing | Write unit tests for parsing logic | 2h | ☐ | |
| T-34 | Testing | Test with 20+ input variations | 2h | ☐ | |
| T-35 | Testing | Measure parsing accuracy | 1h | ☐ | |

**Total Estimate:** 23 hours

---

## 📋 US-2.4: Transaction History Dashboard

**Story Points:** 5 SP  
**Status:** ☐ Not Started

### User Story:
As a user
I want to view my transaction history
So that I can review my spending patterns

### Acceptance Criteria:
- [ ] Dashboard shows last 50 transactions
- [ ] Filter by date range, category, amount range
- [ ] Search by description
- [ ] Sort by date, amount, category
- [ ] Edit/delete transactions
- [ ] Pagination or infinite scroll
- [ ] Mobile responsive table/list

---

### Technical Tasks:

| Task ID | Role | Description | Est. | Status | Notes |
|---------|------|-------------|------|--------|-------|
| T-36 | Backend | Create GET /api/v1/expenses endpoint with filters | 2h | ☐ | |
| T-37 | Backend | Add pagination (limit, offset) | 1h | ☐ | |
| T-38 | Backend | Add sorting (date, amount, category) | 1h | ☐ | |
| T-39 | Backend | Add search by description | 1h | ☐ | |
| T-40 | Backend | Create PUT /api/v1/expenses/:id endpoint | 1h | ☐ | |
| T-41 | Backend | Create DELETE /api/v1/expenses/:id endpoint | 1h | ☐ | |
| T-42 | Frontend | Create expenses page (/expenses) | 2h | ☐ | |
| T-43 | Frontend | Create expense table component | 3h | ☐ | |
| T-44 | Frontend | Add filter UI (date, category, amount) | 2h | ☐ | |
| T-45 | Frontend | Add search input | 1h | ☐ | |
| T-46 | Frontend | Add sort functionality | 1h | ☐ | |
| T-47 | Frontend | Implement pagination | 1h | ☐ | |
| T-48 | Frontend | Add edit expense modal | 2h | ☐ | |
| T-49 | Frontend | Add delete confirmation dialog | 1h | ☐ | |
| T-50 | Frontend | Make table responsive (mobile view) | 2h | ☐ | |
| T-51 | Testing | Test filtering and sorting | 1h | ☐ | |
| T-52 | Testing | Test edit/delete operations | 1h | ☐ | |

**Total Estimate:** 24 hours

---

## 📋 US-1.9: Notification System (Basic)

**Story Points:** 3 SP  
**Status:** ☐ Not Started

### User Story:
As a user
I want to receive notifications
So that I don't miss important insights or reminders

### Acceptance Criteria (Basic):
- [ ] In-app notifications (toast messages)
- [ ] Telegram notifications for urgent items
- [ ] Notification preferences in profile

---

### Technical Tasks:

| Task ID | Role | Description | Est. | Status | Notes |
|---------|------|-------------|------|--------|-------|
| T-53 | Backend | Create Notification model in Prisma | 1h | ☐ | |
| T-54 | Backend | Create POST /api/v1/notifications endpoint | 1h | ☐ | |
| T-55 | Backend | Create GET /api/v1/notifications endpoint | 1h | ☐ | |
| T-56 | Backend | Create notification service (send to Telegram) | 2h | ☐ | |
| T-57 | Frontend | Install toast library (sonner or react-hot-toast) | 0.5h | ☐ | |
| T-58 | Frontend | Create toast notification component | 1h | ☐ | |
| T-59 | Frontend | Create notification center UI | 2h | ☐ | |
| T-60 | Frontend | Add notification preferences in profile | 1h | ☐ | |
| T-61 | Testing | Test in-app notifications | 1h | ☐ | |
| T-62 | Testing | Test Telegram notifications | 1h | ☐ | |

**Total Estimate:** 11.5 hours

---

## 📊 Sprint Progress Tracking

### Daily Updates:

#### Day 1 (Date: ___):
**Planned:** T-01 to T-05  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

#### Day 2 (Date: ___):
**Planned:** T-06 to T-10  
**Completed:** ☐  
**In Progress:** ☐  
**Blockers:** None  
**Hours Worked:** ___ hours

[Continue for 14 days...]

---

## 📈 Sprint Metrics

| Metric | Planned | Actual | Variance |
|--------|---------|--------|----------|
| Story Points | 24 SP | ___ SP | ___ |
| Total Hours | 50h | ___ h | ___ |
| Tasks Completed | 62 | ___ | ___ |

---

## ✅ Sprint Definition of Done

- [ ] All 62 tasks completed
- [ ] Telegram bot deployed and working
- [ ] Users can log expenses via Telegram
- [ ] Transaction history visible on web
- [ ] Basic notifications working
- [ ] All tests passing
- [ ] Deployed to staging

---

**Created:** [Date]  
**Last Updated:** [Date]  
**Sprint Status:** 🔄 Not Started
