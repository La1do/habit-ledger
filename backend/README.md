# HabitLedger Backend

REST API backend cho ứng dụng HabitLedger — theo dõi thói quen và tích lũy phần thưởng theo mục tiêu tài chính.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (Access Token 15m + Refresh Token 7d via httpOnly cookie)
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
JWT_SECRET="your_access_token_secret"
JWT_REFRESH_SECRET="your_refresh_token_secret"
ACCESS_TOKEN_EXPIRES="15m"
REFRESH_TOKEN_EXPIRES="7d"
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

## Authentication

Hệ thống dùng **JWT dual-token**:

| Token | Nơi lưu | TTL | Mục đích |
|-------|---------|-----|---------|
| `accessToken` | `localStorage` (FE) | 15 phút | Gọi API |
| `refreshToken` | httpOnly cookie | 7 ngày | Lấy accessToken mới |

**Flow:**
1. `POST /auth/login` → trả `{ accessToken }` + set cookie `refreshToken`
2. Khi accessToken hết hạn → FE tự gọi `POST /auth/refresh-token` (cookie tự gửi)
3. `POST /auth/logout` → clear cookie

---

## Testing

### Framework
- **Vitest** — test runner, hỗ trợ ESM + TypeScript native
- **@vitest/coverage-v8** — code coverage

### Chạy tests

```bash
npm test              # Chạy một lần
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## API Overview

Base URL: `/api`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/auth/register` | Đăng ký | ❌ |
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/refresh-token` | Lấy access token mới | ❌ (cookie) |
| POST | `/auth/logout` | Đăng xuất | ❌ |
| GET | `/tasks` | Lấy tất cả tasks (kèm taskGoals) | ✅ |
| POST | `/tasks` | Tạo task | ✅ |
| PUT | `/tasks/:id` | Cập nhật task | ✅ |
| DELETE | `/tasks/:id` | Xóa task | ✅ |
| PATCH | `/tasks/:id/complete` | Toggle complete | ✅ |
| POST | `/tasks/:id/goals` | Gắn task với goal | ✅ |
| DELETE | `/tasks/:id/goals/:goal_id` | Bỏ gắn task-goal | ✅ |
| GET | `/goals` | Lấy tất cả goals (kèm pending reward) | ✅ |
| POST | `/goals` | Tạo goal | ✅ |
| PUT | `/goals/:id` | Cập nhật goal | ✅ |
| GET | `/goals/:id/history` | Lịch sử earn của goal | ✅ |
| DELETE | `/goals/:id` | Xóa goal (soft delete) | ✅ |
| GET | `/users/me/summary` | Tổng quan ví & goals | ✅ |
| POST | `/scheduler/run` | Trigger scheduler thủ công | ✅ |

---

## Business Logic

### Pending Reward (Display Only)

Khi user tick task → `DONE_TODAY`:
- Status task thay đổi, **DB tiền không thay đổi**
- `GET /goals` tự động tính và cộng pending reward vào `current_amount` của từng goal (computed, không lưu DB)
- `GET /users/me/summary` tự động trừ pending reward khỏi `total_money` (computed, không lưu DB)
- Mục đích: hiển thị preview số tiền sẽ được chuyển khi scheduler chạy

### Money Flow (Thật — do Scheduler)

- Scheduler chạy lúc **00:01 mỗi ngày**
- Tasks `DONE_TODAY` → trừ `reward_amount` khỏi `total_money`, cộng vào `goal.current_amount`, ghi `CompletionLog`
- Tasks `PENDING` quá deadline → set `MISSED`
- Goal đạt `target_amount` → set `COMPLETED` (trừ khi `is_saving = true`)

### Debt Tracking

Nếu `total_money < reward_amount` khi scheduler chạy:
- Vẫn cộng vào `goal.current_amount`
- Ghi `CompletionLog` với `reward_status = DEBT`
- Không trừ `total_money`

### Saving Mode

Khi `goal.is_saving = true`: goal không bao giờ set `COMPLETED` dù đạt `target_amount`.

### Immutable Ledger (Hash Chain)

`CompletionLog` chỉ được ghi bởi scheduler. Mỗi log có `hash` (SHA-256) và `previousHash` — phát hiện gian lận nếu ai sửa log.

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
