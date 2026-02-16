# 🚀 Sprint 9 - Task Breakdown (Week 17-18)

**Sprint Goal:** "Users can track vehicle maintenance and get reminders"

**Planned Story Points:** 26 SP | **Estimated Hours:** 44h

---

## User Stories:
1. **US-5.1:** Vehicle Registration (5 SP)
2. **US-5.2:** Maintenance Log (5 SP)
3. **US-5.3:** Service Reminder System (8 SP)
4. **US-5.4:** AI Mechanic Chatbot (8 SP - basic)

---

## US-5.1: Vehicle Registration (5 SP)

| Task ID | Role | Description | Est. |
|---------|------|-------------|------|
| T-01 | Backend | Create Vehicle model | 1h |
| T-02 | Backend | Create POST /api/v1/vehicles endpoint | 1h |
| T-03 | Backend | Support multiple vehicles per user | 1h |
| T-04 | Frontend | Create vehicle registration page | 2h |
| T-05 | Frontend | Add vehicle form (brand, model, year, mileage) | 2h |
| T-06 | Frontend | Add vehicle photo upload | 1h |
| T-07 | Bot | Create /vehicle command handler | 1h |
| T-08 | Testing | Test vehicle registration | 1h |

**Total:** 10h

---

## US-5.2: Maintenance Log (5 SP)

| Task ID | Role | Description | Est. |
|---------|------|-------------|------|
| T-09 | Backend | Create MaintenanceLog model | 1h |
| T-10 | Backend | Create POST /api/v1/vehicles/:id/maintenance endpoint | 1h |
| T-11 | Backend | Create GET maintenance history endpoint | 1h |
| T-12 | Frontend | Create maintenance log page | 2h |
| T-13 | Frontend | Add maintenance form | 2h |
| T-14 | Frontend | Display maintenance timeline | 2h |
| T-15 | Frontend | Add receipt upload | 1h |
| T-16 | Testing | Test maintenance logging | 1h |

**Total:** 11h

---

## US-5.3: Service Reminder System (8 SP)

| Task ID | Role | Description | Est. |
|---------|------|-------------|------|
| T-17 | Backend | Calculate next service date (mileage + time) | 2h |
| T-18 | Backend | Create reminder logic | 2h |
| T-19 | Backend | Create cron job for reminders | 2h |
| T-20 | Backend | Send reminders (1 week, 3 days, due date) | 2h |
| T-21 | Frontend | Display upcoming maintenance | 2h |
| T-22 | Frontend | Add calendar view | 2h |
| T-23 | Bot | Send reminder via Telegram | 1h |
| T-24 | Testing | Test reminder triggers | 1h |

**Total:** 14h

---

## US-5.4: AI Mechanic Chatbot (8 SP - basic)

| Task ID | Role | Description | Est. |
|---------|------|-------------|------|
| T-25 | AI | Design mechanic prompt | 1h |
| T-26 | AI | Integrate GPT-4 for diagnostics | 2h |
| T-27 | AI | Add common vehicle problems knowledge | 2h |
| T-28 | Bot | Create /mechanic command handler | 2h |
| T-29 | Bot | Handle diagnostic conversations | 2h |
| T-30 | Testing | Test with common problems | 2h |

**Total:** 11h

---

**Total Tasks:** 30 | **Sprint Status:** 🔄 Not Started
