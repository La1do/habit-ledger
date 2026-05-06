# HabitLedger Backend

REST API backend cho ứng dụng HabitLedger — theo dõi thói quen và tích lũy phần thưởng theo mục tiêu tài chính.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT
- **Scheduler**: node-cron

## Cấu trúc project

```
src/
  controllers/    # Xử lý request/response
  services/       # Business logic
  routes/         # Định nghĩa routes
  middlewares/    # Auth middleware
  jobs/           # Cron jobs (scheduler)
  config/         # Prisma client
  utils/          # JWT, validation helpers
  types/          # TypeScript type extensions
prisma/
  schema.prisma   # Database schema
```

## Cài đặt

### 1. Clone và cài dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/habit_ledger"
JWT_SECRET="your_jwt_secret"
PORT=3000
```

### 3. Khởi động PostgreSQL

```bash
docker-compose up -d
```

### 4. Chạy migration

```bash
npx prisma migrate dev
```

### 5. Khởi động server

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

Server chạy tại `http://localhost:3000`

---

## Testing

### Framework
- **Vitest** — test runner, hỗ trợ ESM + TypeScript native
- **@vitest/coverage-v8** — code coverage

### Chạy tests

```bash
# Chạy tất cả tests (một lần)
npm test

# Chạy ở watch mode (tự reload khi file thay đổi)
npm run test:watch

# Chạy với coverage report
npm run test:coverage
```

### Cấu trúc tests

```
src/
  __mocks__/
    prisma.ts           # Mock Prisma client (dùng chung cho tất cả tests)
  tests/
    task.service.test.ts      # 11 test cases
    goal.service.test.ts      # 10 test cases
    taskGoal.service.test.ts  # 10 test cases
    reward.service.test.ts    # 7 test cases
    ledger.service.test.ts    # 4 test cases
    jobs.test.ts              # 7 test cases
```

### Chiến lược

- **Unit tests** — test từng service function độc lập
- **Mock Prisma** — không cần DB thật, test chạy nhanh và isolated
- **Coverage** — tập trung vào `src/services/` và `src/jobs/`

### Những gì được test

| Service | Cases |
|---------|-------|
| task.service | createTask, getTasks, updateTask, deleteTask — validation, ownership, status transition |
| goal.service | createGoal, getGoals, updateGoal, deleteGoal — soft delete, target validation |
| taskGoal.service | linkTaskGoal, unlinkTaskGoal — duplicate check, ownership |
| reward.service | completeTask — toggle logic, deadline check, status guard |
| ledger.service | createLedgerLog — hash chain, genesis block, hash uniqueness |
| jobs | confirmDailyTasks — COMPLETED, MISSED, recurring reset, goal completion, saving mode, debt |

### Git ignore

`coverage/` được ignore (auto-generated). Test source files được push lên git.

---

## API Overview

Base URL: `/api`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/auth/register` | Đăng ký | ❌ |
| POST | `/auth/login` | Đăng nhập | ❌ |
| GET | `/tasks` | Lấy tất cả tasks | ✅ |
| POST | `/tasks` | Tạo task | ✅ |
| PUT | `/tasks/:id` | Cập nhật task | ✅ |
| DELETE | `/tasks/:id` | Xóa task | ✅ |
| PATCH | `/tasks/:id/complete` | Toggle complete | ✅ |
| POST | `/tasks/:id/goals` | Gắn task với goal | ✅ |
| DELETE | `/tasks/:id/goals/:goal_id` | Bỏ gắn task-goal | ✅ |
| GET | `/goals` | Lấy tất cả goals | ✅ |
| POST | `/goals` | Tạo goal | ✅ |
| PUT | `/goals/:id` | Cập nhật goal | ✅ |
| GET | `/goals/:id/history` | Lịch sử earn của goal | ✅ |
| DELETE | `/goals/:id` | Xóa goal (soft delete) | ✅ |
| GET | `/users/me/summary` | Tổng quan ví & goals | ✅ |
| POST | `/scheduler/run` | Trigger scheduler thủ công | ✅ |

### Authentication

Tất cả protected routes yêu cầu header:

```
Authorization: Bearer <jwt_token>
```

---

## Business Logic

### Money Flow

- `user.total_money` là ví tổng của user — tiền thật, không được âm
- Khi scheduler confirm task `DONE_TODAY`: **trừ** `reward_amount` khỏi `total_money`, **cộng** vào `goal.current_amount`
- Toggle `PENDING ↔ DONE_TODAY` chỉ đổi status, không đụng tiền

### Debt Tracking

Nếu `total_money < reward_amount` khi scheduler chạy:
- Vẫn cộng vào `goal.current_amount`
- Ghi `CompletionLog` với `reward_status = DEBT`
- Không trừ `total_money`
- Xem tổng nợ qua `GET /users/me/summary`

### Complete Task Flow

Khi user bấm `PATCH /tasks/:id/complete`:
- `PENDING → DONE_TODAY`: chỉ đổi status
- `DONE_TODAY → PENDING` (undone): chỉ đổi status

### Daily Scheduler (00:01 mỗi ngày)

- Tasks `DONE_TODAY` → tính reward, ghi `CompletionLog` (immutable), set `COMPLETED`
- Recurring tasks → reset về `PENDING` với deadline mới thay vì set `COMPLETED`
- Tasks `PENDING` đã qua deadline → set `MISSED`
- Goal tự động set `COMPLETED` khi `current_amount >= target_amount` (trừ khi `is_saving = true`)
- Catch-up: khi server khởi động, tự chạy bù nếu scheduler bị miss > 23h

### Saving Mode

Khi `goal.is_saving = true`:
- Goal không bao giờ set `COMPLETED` dù đạt `target_amount`
- Tiền tiếp tục cộng vào vô hạn

### Immutable Ledger (Hash Chain)

`CompletionLog` chỉ được ghi bởi scheduler, không bao giờ bị sửa hoặc xóa.

Mỗi log có 2 fields đặc biệt:
- `hash` — SHA-256 của toàn bộ data trong log đó
- `previousHash` — hash của log liền trước

Nếu ai sửa 1 log → hash thay đổi → log sau không khớp → phát hiện gian lận (giống Blockchain).

---

## Database Schema

```
User          — id, email, password, total_money
Goal          — id, user_id, title, target_amount, current_amount, status, is_saving, deleted_at
Task          — id, user_id, title, status, type, isRecurring, repeatFrequency, deadline
TaskGoal      — task_id, goal_id, reward_amount (composite PK)
CompletionLog — id, task_id, user_id, goal_id, type, reward_status, money_earned, hash, previousHash, createdAt
SchedulerRun  — id, ran_at, confirmed, missed
```

### Enums

| Enum | Values |
|------|--------|
| TaskStatus | `PENDING`, `DONE_TODAY`, `COMPLETED`, `MISSED` |
| TaskType | `Habit`, `OneTime` |
| RepeatFrequency | `DAILY`, `WEEKLY`, `MONTHLY` |
| GoalStatus | `ACTIVE`, `COMPLETED` |
| CompletionType | `COMPLETED`, `MISSED` |
| RewardStatus | `SETTLED`, `DEBT` |
