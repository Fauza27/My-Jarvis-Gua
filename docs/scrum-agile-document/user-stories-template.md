# 📝 User Stories - Template & Guidelines

**Purpose:** Panduan untuk menulis user stories yang baik dalam format Scrum/Agile

---

## 📖 User Story Format

### Standard Template:

```
As a [type of user]
I want [goal/desire]
So that [benefit/value]
```

### Example:
```
As a user
I want to log expenses via natural language
So that I can quickly record spending without filling forms
```

---

## ✅ Acceptance Criteria Format

### GIVEN-WHEN-THEN Format (BDD Style):

```
GIVEN [initial context/state]
WHEN [action/event occurs]
THEN [expected outcome]
```

### Example:
```
GIVEN I am logged in to the app
WHEN I send "Beli nasi goreng 15k" to Telegram bot
THEN the bot extracts amount (15000) and description (nasi goreng)
AND asks for category confirmation
AND saves expense to database after confirmation
```

---

## 🎯 INVEST Criteria

Good user stories should be:

**I - Independent**
- Can be developed in any order
- Not dependent on other stories
- Example: ✅ "Log expense" is independent of "View reports"

**N - Negotiable**
- Details can be discussed
- Not a contract
- Example: ✅ "Natural language input" (how exactly? can discuss)

**V - Valuable**
- Delivers value to user
- User can see benefit
- Example: ✅ "Save time logging expenses" (clear value)

**E - Estimable**
- Team can estimate effort
- Clear enough to size
- Example: ✅ "8 story points" (can estimate)

**S - Small**
- Can be completed in 1 sprint
- Not too big
- Example: ✅ "Log expense" (1 sprint), ❌ "Complete finance module" (too big)

**T - Testable**
- Clear acceptance criteria
- Can verify if done
- Example: ✅ "Bot extracts amount correctly 95% of time" (testable)


---

## 📊 Story Point Estimation Guide

### Fibonacci Scale: 1, 2, 3, 5, 8, 13, 21

**1 Point - Trivial (1-2 hours)**
- Simple UI change
- Text update
- Configuration change
- Example: "Change button color"

**2 Points - Easy (2-4 hours)**
- Simple CRUD operation
- Basic form
- Simple API endpoint
- Example: "Add delete button for expense"

**3 Points - Small (4-8 hours)**
- Feature with few components
- Simple integration
- Basic validation
- Example: "User profile edit page"

**5 Points - Medium (1-2 days)**
- Feature with multiple components
- Moderate complexity
- Some edge cases
- Example: "Task management CRUD"

**8 Points - Large (2-3 days)**
- Complex feature
- Multiple integrations
- Many edge cases
- Example: "Telegram bot integration"

**13 Points - Very Large (3-5 days)**
- Very complex feature
- AI/ML component
- Multiple modules involved
- Example: "AI expense categorization"

**21 Points - Epic (5+ days)**
- Too big for one sprint
- Should be broken down
- Example: "Complete finance module" → break into smaller stories

### Estimation Tips:
1. **Compare to past stories:** "This is similar to X, so same points"
2. **Consider unknowns:** Add buffer for learning/research
3. **Include testing time:** Not just coding
4. **Account for complexity:** Technical debt, edge cases
5. **Re-estimate after sprint:** Adjust based on actual effort


---

## 📋 User Story Template (Copy This)

```markdown
## US-[Epic].[Number]: [Story Title]

**Priority:** P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)
**Story Points:** [1, 2, 3, 5, 8, 13, 21]
**Sprint:** [Sprint number or "Backlog"]
**Status:** Not Started | In Progress | In Review | Done

### User Story:
As a [user type]
I want [goal]
So that [benefit]

### Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Technical Notes:
[Implementation details, API endpoints, libraries needed, etc]

### Dependencies:
- Depends on: US-X.X
- Blocks: US-Y.Y

### Tasks Breakdown:
- [ ] Task 1: [Description] (Est: 2h)
- [ ] Task 2: [Description] (Est: 3h)
- [ ] Task 3: [Description] (Est: 1h)

### Definition of Done:
- [ ] Code written and committed
- [ ] Unit tests written
- [ ] Manual testing completed
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] Acceptance criteria met
- [ ] Documentation updated

### Testing Scenarios:
**Happy Path:**
1. User does X
2. System responds Y
3. Result is Z

**Edge Cases:**
1. What if input is empty?
2. What if API fails?
3. What if user is offline?

### Design/Mockups:
[Link to Figma, screenshots, or wireframes]

### Notes:
[Any additional context, discussions, decisions made]
```

---

## 🎯 Example: Complete User Story

```markdown
## US-2.1: Manual Expense Input via Chat

**Priority:** P0 (Critical)
**Story Points:** 8
**Sprint:** Sprint 3
**Status:** Done

### User Story:
As a user
I want to log expenses via natural language in Telegram
So that I can quickly record spending without opening the app or filling forms

### Acceptance Criteria:
- [x] Bot extracts amount and description from message
- [x] Bot asks for category confirmation (inline buttons)
- [x] Expense saved to database with timestamp
- [x] Confirmation message sent with transaction details
- [x] Handles Indonesian number formats (15k, 15rb, 15ribu)
- [x] 95%+ accuracy on common patterns

### Technical Notes:
- Use regex for initial parsing (15k, 15rb patterns)
- Fallback to GPT-4 for complex inputs
- Store in `expenses` table with user_id, amount, description, category, timestamp
- Use python-telegram-bot library for inline buttons

### Dependencies:
- Depends on: US-1.7 (Telegram Bot Integration)
- Depends on: US-1.3 (Database Schema)

### Tasks Breakdown:
- [x] Task 1: Create regex patterns for Indonesian number formats (2h)
- [x] Task 2: Implement GPT-4 fallback for complex inputs (3h)
- [x] Task 3: Create inline keyboard for category selection (2h)
- [x] Task 4: Implement database save logic (2h)
- [x] Task 5: Add confirmation message with transaction details (1h)
- [x] Task 6: Write unit tests for parsing logic (2h)
- [x] Task 7: Manual testing with various input formats (2h)

### Definition of Done:
- [x] Code written and committed
- [x] Unit tests written (90% coverage)
- [x] Manual testing completed (20+ test cases)
- [x] Code reviewed (self-review)
- [x] Deployed to staging
- [x] All acceptance criteria met
- [x] README updated with example usage

### Testing Scenarios:

**Happy Path:**
1. User sends: "Beli nasi goreng 15k"
2. Bot extracts: amount=15000, description="nasi goreng"
3. Bot shows category buttons: [Makanan] [Transport] [Lainnya]
4. User clicks [Makanan]
5. Bot saves to database
6. Bot replies: "✅ Expense logged: Rp 15,000 - Nasi goreng (Makanan)"

**Edge Cases:**
1. Input: "15k" (no description) → Bot asks for description
2. Input: "Nasi goreng" (no amount) → Bot asks for amount
3. Input: "Beli nasi goreng lima belas ribu" → GPT-4 parses correctly
4. User doesn't click category button → Timeout after 60s, default to "Lainnya"
5. Database save fails → Bot shows error, asks to retry

**Test Cases:**
- "Beli nasi goreng 15k" → ✅ Parsed correctly
- "Bayar parkir 5rb" → ✅ Parsed correctly
- "Isi bensin 50ribu" → ✅ Parsed correctly
- "Makan siang di warteg 12000" → ✅ Parsed correctly
- "Beli kopi" → ❌ No amount, bot asks

### Design/Mockups:
[Screenshot of Telegram conversation flow]

### Notes:
- Initially tried regex only, but accuracy was 70%. Added GPT-4 fallback, now 95%+
- Category buttons improve UX vs typing category name
- Consider adding "Recent categories" for faster selection (future enhancement)
```

