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
  "deadline": null
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

**Status transition rule**: chỉ cho phép `PENDING → DONE_TODAY`

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

**Response 400**
```json
{ "error": "Not found or unauthorized" }
```

---

## Goals

### GET /goals 🔒
Lấy tất cả goals của user hiện tại.

**Response 200**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Mua laptop",
    "target_amount": "10000000",
    "current_amount": "0",
    "status": "ACTIVE"
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

**Response 400**
```json
{ "error": "target_amount must be greater than 0" }
```

---

### DELETE /goals/:goal_id 🔒
Xóa goal. Task liên quan **không bị xóa**, chỉ xóa quan hệ TaskGoal và CompletionLog.

**Response 200**
```json
{ "message": "Goal deleted successfully" }
```

**Response 400**
```json
{ "error": "Not found or unauthorized" }
```

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
- Không được gắn trùng (task-goal đã tồn tại)

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

**Response 400**
```json
{ "error": "Not found or unauthorized" }
```

---

## Enums

| Enum | Values |
|------|--------|
| TaskStatus | `PENDING`, `DONE_TODAY`, `COMPLETED`, `MISSED` |
| TaskType | `Habit`, `OneTime` |
| RepeatFrequency | `DAILY`, `WEEKLY`, `MONTHLY` |
| GoalStatus | `ACTIVE`, `COMPLETED` |
