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
| DELETE | `/goals/:id` | Xóa goal | ✅ |
| POST | `/scheduler/run` | Trigger scheduler thủ công | ✅ |

### Authentication

Tất cả protected routes yêu cầu header:

```
Authorization: Bearer <jwt_token>
```

---

## Business Logic

### Complete Task Flow

Khi user bấm `PATCH /tasks/:id/complete`:
- `PENDING → DONE_TODAY`: cộng `reward_amount` vào `goal.current_amount` và `user.total_money`
- `DONE_TODAY → PENDING` (undone): trừ lại

### Daily Scheduler (00:01 mỗi ngày)

- Tasks `DONE_TODAY` → set `COMPLETED`, ghi `CompletionLog` (immutable)
- Tasks `PENDING` đã qua deadline → set `MISSED`, ghi log
- Goal tự động set `COMPLETED` khi `current_amount >= target_amount`

### Immutable Ledger

`CompletionLog` chỉ được ghi bởi scheduler, không bao giờ bị sửa hoặc xóa.

---

## Database Schema

```
User         — id, email, password, total_money
Goal         — id, user_id, title, target_amount, current_amount, status
Task         — id, user_id, title, status, type, isRecurring, repeatFrequency, deadline
TaskGoal     — task_id, goal_id, reward_amount (composite PK)
CompletionLog — id, task_id, user_id, goal_id, type, money_earned, createdAt
```

### Enums

| Enum | Values |
|------|--------|
| TaskStatus | `PENDING`, `DONE_TODAY`, `COMPLETED`, `MISSED` |
| TaskType | `Habit`, `OneTime` |
| RepeatFrequency | `DAILY`, `WEEKLY`, `MONTHLY` |
| GoalStatus | `ACTIVE`, `COMPLETED` |
| CompletionType | `COMPLETED`, `MISSED` |
