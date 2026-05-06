# HabitLedger API Documentation

Base URL: `http://localhost:3000/api`

All protected routes require the header:
```
Authorization: Bearer <token>
```

---

## Auth

### POST /auth/register
Đăng ký tài khoản mới.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "abc123"
}
```

**Validation**
- `email`: đúng định dạng email
- `password`: tối thiểu 6 ký tự, phải có cả chữ và số

**Response 201**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "total_money": "0"
}
```

**Response 400**
```json
{ "error": "User already exists" }
```

---

### POST /auth/login
Đăng nhập, nhận JWT token.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "abc123"
}
```

**Response 200**
```json
{ "token": "<jwt_token>" }
```

**Response 400**
```json
{ "error": "Invalid email or password" }
```

---

## Tasks

### GET /tasks 🔒
Lấy tất cả tasks của user hiện tại.

**Response 200**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Đọc sách",
    "status": "PENDING",
    "type": "Habit",
    "isRecurring": true,
    "repeatFrequency": "DAILY",
    "deadline": null,
    "date": "2026-05-04T00:00:00.000Z"
  }
]
```

---

### POST /tasks 🔒
Tạo task mới.

**Request Body**
```json
{
  "title": "Đọc sách",
  "type": "Habit",
  "isRecurring": true,
  "repeatFrequency": "DAILY",
  "deadline": "2026-05-10T00:00:00.000Z"
}
```

**Fields**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | ✅ | |
| type | `Habit` \| `OneTime` | ✅ | |
| isRecurring | boolean | ✅ | Habit phải là `true` |
| repeatFrequency | `DAILY` \| `WEEKLY` \| `MONTHLY` | nếu isRecurring = true | |
| deadline | ISO datetime | ❌ | |

**Response 201** — task object

**Response 400**
```json
{ "error": "Habits must be recurring" }
```

---

### PUT /tasks/:task_id 🔒
Cập nhật task (partial update).

**Request Body** — tất cả fields đều optional
```json
{
  "title": "Tên mới",
  "status": "DONE_TODAY"
}
```

**Status transition rule**: chỉ cho phép `PENDING → DONE_TODAY` qua endpoint này

**Response 200** — updated task object

**Response 400**
```json
{ "error": "Status can only be updated from PENDING to DONE_TODAY" }
```

---

### DELETE /tasks/:task_id 🔒
Xóa task.

**Response 200**
```json
{ "message": "Task deleted successfully" }
```

---

### PATCH /tasks/:task_id/complete 🔒
Toggle trạng thái hoàn thành task.

- `PENDING → DONE_TODAY`
- `DONE_TODAY → PENDING` (undone)

Chỉ đổi status, không cập nhật tiền (tiền được xử lý bởi scheduler).

**Response 200** — updated task object

**Response 400**
```json
{ "error": "Task is already completed" }
{ "error": "Cannot complete a missed task" }
{ "error": "Cannot complete task past its deadline" }
```

---

## Goals

### GET /goals 🔒
Lấy tất cả goals của user (không bao gồm đã soft delete).

**Response 200**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Mua laptop",
    "target_amount": "10000000",
    "current_amount": "500000",
    "status": "ACTIVE",
    "is_saving": false,
    "deleted_at": null
  }
]
```

---

### POST /goals 🔒
Tạo goal mới.

**Request Body**
```json
{
  "title": "Mua laptop",
  "target_amount": 10000000
}
```

**Validation**
- `title`: bắt buộc
- `target_amount`: số thập phân, phải > 0

**Response 201** — goal object

---

### PUT /goals/:goal_id 🔒
Cập nhật goal (partial update).

**Request Body** — tất cả fields đều optional
```json
{
  "title": "Mua laptop gaming",
  "target_amount": 15000000,
  "is_saving": true
}
```

**Validation**
- `target_amount`: phải > 0 và >= `current_amount` (không được giảm xuống dưới số đã tích lũy)
- `is_saving = true`: goal sẽ không bao giờ set `COMPLETED` dù đạt target

**Response 200** — updated goal object

**Response 400**
```json
{ "error": "target_amount cannot be less than current_amount" }
```

---

### GET /goals/:goal_id/history 🔒
Lịch sử earn tiền của goal (chỉ SETTLED logs).

**Response 200**
```json
[
  {
    "id": "uuid",
    "money_earned": "50000",
    "createdAt": "2026-05-04T00:01:00.000Z",
    "task": {
      "id": "uuid",
      "title": "Đọc sách"
    }
  }
]
```

---

### DELETE /goals/:goal_id 🔒
Soft delete goal — ẩn khỏi danh sách, không xóa khỏi DB.

**Response 200**
```json
{ "message": "Goal deleted successfully" }
```

---

## Users

### GET /users/me/summary 🔒
Tổng quan ví và goals của user.

**Response 200**
```json
{
  "total_money": 4500000,
  "total_earned": 500000,
  "total_debt": 50000,
  "goals_completed": 2,
  "goals_active": 3
}
```

| Field | Mô tả |
|-------|-------|
| total_money | Số tiền hiện có trong ví |
| total_earned | Tổng tiền đã earn thành công (SETTLED) |
| total_debt | Tổng tiền nợ (earn nhưng không đủ tiền trừ) |
| goals_completed | Số goals đã đạt target |
| goals_active | Số goals đang active |

---

## Task-Goal

### POST /tasks/:task_id/goals 🔒
Gắn task với goal.

**Request Body**
```json
{
  "goal_id": "uuid",
  "reward_amount": 50000
}
```

**Validation**
- `goal_id`: bắt buộc, goal phải thuộc user
- `reward_amount`: phải > 0
- Không được gắn trùng

**Response 201**
```json
{
  "task_id": "uuid",
  "goal_id": "uuid",
  "reward_amount": "50000"
}
```

**Response 400**
```json
{ "error": "Task is already linked to this goal" }
```

---

### DELETE /tasks/:task_id/goals/:goal_id 🔒
Bỏ gắn task khỏi goal.

**Response 200**
```json
{ "message": "Task-goal link removed successfully" }
```

---

## Scheduler

### POST /scheduler/run 🔒
Trigger scheduler thủ công (dùng để test).

Thực hiện:
- Tasks `DONE_TODAY` → tính reward, ghi log, set `COMPLETED` (hoặc reset nếu recurring)
- Tasks `PENDING` quá deadline → set `MISSED`
- Goals đạt target → set `COMPLETED` (trừ khi `is_saving = true`)

**Response 200**
```json
{
  "message": "Scheduler ran successfully",
  "confirmed": 3,
  "missed": 1
}
```

---

## Ledger — Immutable Hash Chain

### Cơ chế

Mỗi `CompletionLog` có 2 fields đặc biệt:

| Field | Mô tả |
|-------|-------|
| `hash` | SHA-256 của `task_id + goal_id + user_id + money_earned + previousHash` |
| `previousHash` | Hash của log liền trước (genesis = `"0000000000000000"`) |

Nếu ai sửa 1 log → hash thay đổi → log sau không khớp → phát hiện gian lận.

### Verify chain (future API)

```
GET /api/ledger/verify  — kiểm tra toàn bộ chain có hợp lệ không
```

---

## Enums

| Enum | Values |
|------|--------|
| TaskStatus | `PENDING`, `DONE_TODAY`, `COMPLETED`, `MISSED` |
| TaskType | `Habit`, `OneTime` |
| RepeatFrequency | `DAILY`, `WEEKLY`, `MONTHLY` |
| GoalStatus | `ACTIVE`, `COMPLETED` |
| CompletionType | `COMPLETED`, `MISSED` |
| RewardStatus | `SETTLED`, `DEBT` |
