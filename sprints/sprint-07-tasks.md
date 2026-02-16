# 🚀 Sprint 7 - Task Breakdown (Week 13-14)

**Sprint Goal:** "Runners can get training plans and track workouts"

**Planned Story Points:** 26 SP | **Estimated Hours:** 46h

---

## User Stories:
1. **US-4.1:** Training Plan Generator (13 SP)
2. **US-4.2:** Workout Logging & Tracking (5 SP)
3. **US-4.3:** Strava Integration (8 SP)

---

## US-4.1: Training Plan Generator (13 SP)

| Task ID | Role | Description | Est. |
|---------|------|-------------|------|
| T-01 | Backend | Create TrainingPlan model | 1h |
| T-02 | Backend | Design plan generation algorithm | 3h |
| T-03 | Backend | Implement progressive overload (10% rule) | 2h |
| T-04 | Backend | Generate weekly schedule (rest, easy, long, speed) | 3h |
| T-05 | Backend | Create POST /api/v1/training-plans endpoint | 2h |
| T-06 | Frontend | Create training plan page | 2h |
| T-07 | Frontend | Add plan input form (fitness level, race date, goal) | 2h |
| T-08 | Frontend | Display generated plan (calendar view) | 3h |
| T-09 | Frontend | Add plan adaptation logic | 2h |
| T-10 | Frontend | Export plan as PDF/iCal | 2h |
| T-11 | Testing | Test plan generation with various inputs | 2h |

**Total:** 24h

---

## US-4.2: Workout Logging & Tracking (5 SP)

| Task ID | Role | Description | Est. |
|---------|------|-------------|------|
| T-12 | Backend | Extend Workout model for running | 1h |
| T-13 | Backend | Calculate pace (min/km) automatically | 1h |
| T-14 | Backend | Create workout stats endpoint | 2h |
| T-15 | Bot | Create /run command handler | 2h |
| T-16 | Frontend | Create workout logging form | 2h |
| T-17 | Frontend | Display run history with stats | 2h |
| T-18 | Testing | Test pace calculation | 1h |

**Total:** 11h

---

## US-4.3: Strava Integration (8 SP)

| Task ID | Role | Description | Est. |
|---------|------|-------------|------|
| T-19 | Backend | Setup Strava OAuth | 2h |
| T-20 | Backend | Create callback endpoint | 2h |
| T-21 | Backend | Fetch activities from Strava API | 2h |
| T-22 | Backend | Store activities in database | 2h |
| T-23 | Backend | Setup webhook for auto-sync | 2h |
| T-24 | Frontend | Add "Connect Strava" button | 1h |
| T-25 | Frontend | Display synced activities | 2h |
| T-26 | Testing | Test OAuth flow | 1h |
| T-27 | Testing | Test webhook | 1h |

**Total:** 15h

---

**Total Tasks:** 27 | **Sprint Status:** 🔄 Not Started
