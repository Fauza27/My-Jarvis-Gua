# 📋 Task Breakdown Template

**Purpose:** Template untuk memecah User Story menjadi Technical Tasks yang spesifik dan actionable

---

## 🎯 What is Task Breakdown?

**Task Breakdown** adalah proses memecah User Story (level tinggi, user-facing) menjadi Technical Tasks (level detail, implementation-specific).

### Why Task Breakdown?

1. **Clarity:** Tahu persis apa yang harus dikerjakan
2. **Tracking:** Monitor progress per task (bukan per story)
3. **Estimation:** Estimasi jam lebih akurat dari story points
4. **Collaboration:** Jelas siapa mengerjakan apa (jika team)
5. **Definition of Done:** Checklist konkret untuk complete story

---

## 📝 Task Breakdown Format

### User Story Header:
```markdown
## US-[Epic].[Number]: [Story Title]

**Story Points:** [X] SP  
**Sprint:** Sprint [N]  
**Status:** Not Started | In Progress | Done

**User Story:**
As a [user type]
I want [goal]
So that [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

### Technical Tasks Table:
```markdown
| Task ID | Role | Description | Estimate | Status | Notes |
|---------|------|-------------|----------|--------|-------|
| T-01 | Backend | [Task description] | 2h | ☐ | [Optional notes] |
| T-02 | Frontend | [Task description] | 3h | ☐ | |
| T-03 | Testing | [Task description] | 1h | ☐ | |
```

**Status Icons:**
- ☐ Not Started
- 🔄 In Progress
- ✅ Done
- ⏸️ Blocked

---

## 🏗️ Task Categories (Roles)

### 1. Backend Tasks
**Focus:** Server-side logic, database, APIs

**Common Tasks:**
- Database schema design
- API endpoint creation
- Business logic implementation
- Data validation
- Authentication/authorization
- Third-party API integration
- Background jobs (Celery)

**Example:**
```
T-01 | Backend | Create `expenses` table in Prisma schema | 1h
T-02 | Backend | Create POST /api/v1/expenses endpoint | 2h
T-03 | Backend | Add input validation with Pydantic | 1h
```

### 2. Frontend Tasks
**Focus:** User interface, client-side logic

**Common Tasks:**
- UI component creation
- Page/route creation
- API integration (fetch data)
- State management
- Form handling
- Error handling
- Loading states
- Responsive design

**Example:**
```
T-04 | Frontend | Create ExpenseForm component | 2h
T-05 | Frontend | Integrate with POST /api/expenses | 1h
T-06 | Frontend | Add form validation with Zod | 1h
```

### 3. Bot Tasks (Telegram)
**Focus:** Telegram bot functionality

**Common Tasks:**
- Command handler creation
- Message parsing
- Inline keyboard creation
- Conversation state management
- Error handling
- User feedback messages

**Example:**
```
T-07 | Bot | Create /expense command handler | 2h
T-08 | Bot | Add inline keyboard for categories | 1h
T-09 | Bot | Implement conversation state | 2h
```

### 4. AI/ML Tasks
**Focus:** AI features (GPT-4, embeddings, RAG)

**Common Tasks:**
- Prompt engineering
- API integration (OpenAI)
- Response parsing
- Embedding generation
- Vector search implementation
- Caching strategy

**Example:**
```
T-10 | AI | Design prompt for expense parsing | 1h
T-11 | AI | Integrate GPT-4 API | 2h
T-12 | AI | Implement response caching | 1h
```

### 5. Database Tasks
**Focus:** Database operations

**Common Tasks:**
- Schema design
- Migration creation
- Seed data creation
- Index optimization
- Query optimization

**Example:**
```
T-13 | Database | Design expenses table schema | 1h
T-14 | Database | Create migration | 0.5h
T-15 | Database | Add seed data (10 expenses) | 0.5h
```

### 6. Testing Tasks
**Focus:** Quality assurance

**Common Tasks:**
- Unit test creation
- Integration test creation
- E2E test creation
- Manual testing
- Test case documentation

**Example:**
```
T-16 | Testing | Write unit tests for parsing logic | 2h
T-17 | Testing | Manual testing (10 test cases) | 1h
T-18 | Testing | E2E test for expense flow | 2h
```

### 7. DevOps Tasks
**Focus:** Deployment, infrastructure

**Common Tasks:**
- CI/CD setup
- Environment configuration
- Deployment
- Monitoring setup
- Performance optimization

**Example:**
```
T-19 | DevOps | Setup GitHub Actions workflow | 2h
T-20 | DevOps | Deploy to staging (Vercel) | 1h
T-21 | DevOps | Configure environment variables | 0.5h
```

### 8. Documentation Tasks
**Focus:** Documentation

**Common Tasks:**
- API documentation
- Code comments
- README updates
- User guide creation

**Example:**
```
T-22 | Docs | Document API endpoint in Swagger | 1h
T-23 | Docs | Update README with setup steps | 0.5h
```

---

## ⏱️ Estimation Guidelines

### Time Estimates (Hours):
- **0.5h** - Very simple (config change, text update)
- **1h** - Simple (basic CRUD, simple component)
- **2h** - Small (component with logic, simple API)
- **3h** - Medium (complex component, API with validation)
- **4h** - Large (complex feature, multiple integrations)
- **6h+** - Too big! Break down further

### Rules:
1. **Max 4 hours per task** - If >4h, break down further
2. **Include testing time** - Don't estimate coding only
3. **Add buffer** - Add 20% for unknowns
4. **Round up** - Better to overestimate than underestimate

---

## 📋 Complete Task Breakdown Template

Copy this template for each User Story:

```markdown
## US-[X.X]: [Story Title]

**Story Points:** [X] SP  
**Sprint:** Sprint [N]  
**Status:** ☐ Not Started

### User Story:
As a [user type]
I want [goal]
So that [benefit]

### Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

### Technical Tasks:

| Task ID | Role | Description | Est. | Status | Assignee | Notes |
|---------|------|-------------|------|--------|----------|-------|
| T-01 | Backend | [Description] | 2h | ☐ | [Name] | |
| T-02 | Frontend | [Description] | 3h | ☐ | [Name] | |
| T-03 | Testing | [Description] | 1h | ☐ | [Name] | |

**Total Estimate:** [X] hours

---

### Task Details:

#### T-01: [Task Title]
**Description:** [Detailed description]

**Subtasks:**
- [ ] Subtask 1
- [ ] Subtask 2

**Dependencies:** T-XX (must complete first)

**Acceptance Criteria:**
- [ ] Specific criterion for this task

**Notes:**
[Any additional context, links, references]

---

#### T-02: [Task Title]
[Same format as above]

---

### Definition of Done (Story Level):
- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Deployed to staging
- [ ] Manual testing completed
- [ ] Documentation updated

---

### Progress Tracking:

**Day 1:**
- Started: T-01, T-02
- Completed: -
- Blockers: -

**Day 2:**
- Started: T-03
- Completed: T-01, T-02
- Blockers: -

**Day 3:**
- Started: -
- Completed: T-03
- Blockers: -

**Story Status:** ✅ Done (Day 3)
```

---

## 💡 Best Practices

### 1. Break Down During Sprint Planning:
- Don't break down all stories upfront
- Break down Sprint N stories in detail
- Keep Sprint N+1 stories high-level

### 2. Involve the Whole Team (if team):
- Backend engineer breaks backend tasks
- Frontend engineer breaks frontend tasks
- Everyone contributes to estimation

### 3. Update as You Go:
- Task breakdown is a living document
- Add tasks if you discover new work
- Update estimates if wrong

### 4. Track Progress Daily:
- Update task status daily
- Note blockers immediately
- Celebrate completed tasks

### 5. Review After Sprint:
- Compare estimated vs actual time
- Identify patterns (always underestimate UI?)
- Improve estimation next sprint

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't:
1. **Too vague:** "Implement feature" (not specific)
2. **Too big:** Tasks >4 hours (break down further)
3. **Missing testing:** Forget to add testing tasks
4. **No dependencies:** Not noting task dependencies
5. **Set and forget:** Not updating as you work

### ✅ Do:
1. **Be specific:** "Create ExpenseForm component with validation"
2. **Right-sized:** Tasks 1-4 hours
3. **Include testing:** Always add testing tasks
4. **Note dependencies:** "T-02 depends on T-01"
5. **Update daily:** Living document, not static

---

## 📊 Example: Complete Breakdown

### US-2.1: Manual Expense Input via Chat

**Story Points:** 8 SP  
**Sprint:** Sprint 3  
**Status:** ☐ Not Started

**User Story:**
As a user
I want to log expenses via natural language in Telegram
So that I can quickly record spending without forms

**Acceptance Criteria:**
- [ ] Bot extracts amount and description from message
- [ ] Bot asks for category confirmation
- [ ] Expense saved to database
- [ ] Confirmation message sent

---

### Technical Tasks:

| Task ID | Role | Description | Est. | Status |
|---------|------|-------------|------|--------|
| T-01 | Database | Design expenses table schema | 1h | ☐ |
| T-02 | Database | Create Prisma migration | 0.5h | ☐ |
| T-03 | Backend | Create Expense model (Pydantic) | 1h | ☐ |
| T-04 | Backend | Create POST /api/v1/expenses endpoint | 2h | ☐ |
| T-05 | Backend | Add input validation | 1h | ☐ |
| T-06 | AI | Design prompt for expense parsing | 1h | ☐ |
| T-07 | AI | Integrate GPT-4 API for parsing | 2h | ☐ |
| T-08 | AI | Implement fallback (regex) for simple inputs | 1h | ☐ |
| T-09 | Bot | Create /expense command handler | 2h | ☐ |
| T-10 | Bot | Add inline keyboard for categories | 1h | ☐ |
| T-11 | Bot | Implement conversation state | 2h | ☐ |
| T-12 | Bot | Add confirmation message | 0.5h | ☐ |
| T-13 | Testing | Write unit tests for parsing | 2h | ☐ |
| T-14 | Testing | Manual testing (20 test cases) | 1h | ☐ |
| T-15 | Docs | Update API documentation | 0.5h | ☐ |

**Total Estimate:** 19.5 hours (~2.5 days @ 8h/day)

---

**Created:** [Date]  
**Last Updated:** [Date]  
**Version:** 1.0
