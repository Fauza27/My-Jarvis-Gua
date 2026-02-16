# 🚀 Sprint 6 - Task Breakdown (Week 11-12)

**Sprint Goal:** "Users can scan receipts and track exercise"

**Duration:** 2 weeks  
**Planned Story Points:** 26 SP  
**Status:** 🔄 Not Started

---

## 📊 Sprint Overview

### User Stories:
1. **US-2.2:** Receipt OCR Scanning (13 SP)
2. **US-3.4:** Exercise Logging & Calorie Burn (5 SP)
3. **US-2.9:** Expense Query via Chat (5 SP)
4. **US-1.8:** Basic Chat UI in Dashboard (3 SP)

### Total Estimated Hours: 48 hours

---

## 📋 US-2.2: Receipt OCR Scanning

**Story Points:** 13 SP

### Technical Tasks:

| Task ID | Role | Description | Est. | Status |
|---------|------|-------------|------|--------|
| T-01 | Backend | Setup file upload endpoint | 2h | ☐ |
| T-02 | Backend | Integrate Supabase Storage/S3 | 2h | ☐ |
| T-03 | AI | Design prompt for receipt OCR | 2h | ☐ |
| T-04 | AI | Integrate GPT-4 Vision API | 3h | ☐ |
| T-05 | AI | Extract: merchant, total, items, date | 2h | ☐ |
| T-06 | AI | Handle Indonesian receipts (Indomaret, Alfamart) | 2h | ☐ |
| T-07 | Backend | Create POST /api/v1/expenses/ocr endpoint | 2h | ☐ |
| T-08 | Backend | Store receipt image URL | 1h | ☐ |
| T-09 | Bot | Handle photo upload in Telegram | 2h | ☐ |
| T-10 | Bot | Show extracted data for confirmation | 1h | ☐ |
| T-11 | Bot | Allow editing extracted data | 2h | ☐ |
| T-12 | Frontend | Add receipt upload UI | 2h | ☐ |
| T-13 | Frontend | Display extracted data | 1h | ☐ |
| T-14 | Testing | Test with 20+ receipt images | 2h | ☐ |
| T-15 | Testing | Measure accuracy (target 70%+) | 1h | ☐ |

**Total:** 29 hours

---

## 📋 US-3.4: Exercise Logging & Calorie Burn

**Story Points:** 5 SP

### Technical Tasks:

| Task ID | Role | Description | Est. | Status |
|---------|------|-------------|------|--------|
| T-16 | Backend | Create Workout model in Prisma | 1h | ☐ |
| T-17 | Backend | Create POST /api/v1/workouts endpoint | 1h | ☐ |
| T-18 | Backend | Implement METs formula for calorie burn | 2h | ☐ |
| T-19 | Backend | Support multiple exercise types | 1h | ☐ |
| T-20 | Bot | Create /exercise command handler | 2h | ☐ |
| T-21 | Bot | Parse exercise input (type, duration, distance) | 2h | ☐ |
| T-22 | Frontend | Create workout page (/workouts) | 2h | ☐ |
| T-23 | Frontend | Add workout form | 2h | ☐ |
| T-24 | Frontend | Display workout history | 1h | ☐ |
| T-25 | Testing | Test calorie burn calculation | 1h | ☐ |

**Total:** 15 hours

---

## 📋 US-2.9: Expense Query via Chat

**Story Points:** 5 SP

### Technical Tasks:

| Task ID | Role | Description | Est. | Status |
|---------|------|-------------|------|--------|
| T-26 | AI | Design NLU prompt for queries | 1h | ☐ |
| T-27 | AI | Implement intent classification | 2h | ☐ |
| T-28 | AI | Extract time range and category | 1h | ☐ |
| T-29 | Backend | Create query processing logic | 2h | ☐ |
| T-30 | Bot | Handle query commands | 2h | ☐ |
| T-31 | Bot | Format response with breakdown | 1h | ☐ |
| T-32 | Testing | Test with 15+ query variations | 1h | ☐ |

**Total:** 10 hours

---

## 📋 US-1.8: Basic Chat UI in Dashboard

**Story Points:** 3 SP

### Technical Tasks:

| Task ID | Role | Description | Est. | Status |
|---------|------|-------------|------|--------|
| T-33 | Frontend | Create chat widget component | 2h | ☐ |
| T-34 | Frontend | Add floating button (bottom-right) | 1h | ☐ |
| T-35 | Frontend | Implement message history | 1h | ☐ |
| T-36 | Frontend | Add text input | 1h | ☐ |
| T-37 | Backend | Create WebSocket/SSE endpoint | 2h | ☐ |
| T-38 | Testing | Test chat functionality | 1h | ☐ |

**Total:** 8 hours

---

## 📈 Sprint Metrics

| Metric | Planned | Actual |
|--------|---------|--------|
| Story Points | 26 SP | ___ SP |
| Total Hours | 48h | ___ h |
| Tasks | 38 | ___ |

---

**Sprint Status:** 🔄 Not Started
