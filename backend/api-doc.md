# HabitLedger API Documentation

Base URL: `http://localhost:3000/api`

Protected routes yêu cầu header:
```
Authorization: Bearer <accessToken>
```

---

## Auth

### POST /auth/register
Đăng ký tài khoản mới.

**Request Body**
```json
{ "email": "user@example.com", "password": "abc123" }
```

**Response 201**
```json
{ "id": "uuid", "email": "user@example.com", "total_money": "0" }
```

---

### POST /auth/login
Đăng nhập. Trả về `accessToken` + set httpOnly cookie `refreshToken`.

**Request Body**
```json
{ "email": "user@example.com", "password": "abc123" }
```

**Response 200**
```json
{ "accessToken": "<jwt_access_token>" }
```

Cookie được set tự động:
```
Set-Cookie: refreshToken=<jwt_refresh_token>; HttpOnly; SameSite=Strict; Max-Age=604800
```

---

### POST /auth/refresh-token
Lấy accessToken mới. Dùng refreshToken từ cookie (tự động gửi kèm).

**Response 200**
```json
{ "accessToken": "<new_jwt_access_token>" }
```

**Response 401**
```json
{ "error": "No refresh token" }
{ "error": "Invalid or expired refresh token" }
```

---

### POST /auth/logout
Đăng xuất — clear cookie refreshToken.

**Response 200**
```json
{ "message": "Logged out" }
```

---

## Tasks

### GET /tasks 🔒
Lấy tất cả tasks của user, kèm `taskGoals` (goals đã gắn với task).

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
    "date": "2026-05-04T00:00:00.000Z",
    "taskGoals": [
      {
        "task_id": "uuid",
        "goal_id": "uuid",
        "reward_amount": "50000",
        "goal": { "id": "uuid", "title": "Mua laptop", "status": "ACTIVE" }
      }
    ]
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

> **Lưu ý**: `deadline` phải là ISO-8601 DateTime đầy đủ (có time). Frontend tự động convert `YYYY-MM-DD` → `YYYY-MM-DDT00:00:00.000Z`.

**Response 201** — task object

---

### PUT /tasks/:task_id 🔒
Cập nhật task (partial update).

**Response 200** — updated task object

---

### DELETE /tasks/:task_id 🔒
Xóa task và tất cả TaskGoal liên quan.

**Response 200**
```json
{ "message": "Task deleted successfully" }
```

---

### PATCH /tasks/:task_id/complete 🔒
Toggle trạng thái hoàn thành task.

- `PENDING → DONE_TODAY`
- `DONE_TODAY → PENDING`

**Lưu ý**: Chỉ đổi status. Tiền được xử lý bởi scheduler khi deadline đến. Tuy nhiên `GET /goals` và `GET /users/me/summary` sẽ phản ánh pending reward ngay lập tức (computed, không lưu DB).

**Response 200** — updated task object

---

## Goals

### GET /goals 🔒
Lấy tất cả goals của user. `current_amount` đã bao gồm **pending reward** từ tasks `DONE_TODAY` (computed, không lưu DB).

**Response 200**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Mua laptop",
    "target_amount": "10000000",
    "current_amount": "550000",
    "status": "ACTIVE",
    "is_saving": false,
    "deleted_at": null
  }
]
```

> `current_amount` = DB value + pending từ tasks DONE_TODAY. Giá trị DB thật chỉ thay đổi khi scheduler chạy.

---

### POST /goals 🔒
Tạo goal mới.

**Request Body**
```json
{ "title": "Mua laptop", "target_amount": 10000000 }
```

**Response 201** — goal object

---

### PUT /goals/:goal_id 🔒
Cập nhật goal.

**Request Body**
```json
{ "title": "Mua laptop gaming", "target_amount": 15000000, "is_saving": true }
```

**Validation**: `target_amount` phải >= `current_amount` DB (không tính pending).

---

### GET /goals/:goal_id/history 🔒
Lịch sử earn tiền của goal (chỉ SETTLED logs từ CompletionLog).

**Response 200**
```json
[
  {
    "id": "uuid",
    "money_earned": "50000",
    "createdAt": "2026-05-04T00:01:00.000Z",
    "task": { "id": "uuid", "title": "Đọc sách" }
  }
]
```

---

### DELETE /goals/:goal_id 🔒
Soft delete goal.

**Response 200**
```json
{ "message": "Goal deleted successfully" }
```

---

## Users

### GET /users/me/summary 🔒
Tổng quan ví và goals. `total_money` đã trừ **pending reward** từ tasks `DONE_TODAY` (computed, không lưu DB).

**Response 200**
```json
{
  "total_money": 4450000,
  "total_earned": 500000,
  "total_debt": 50000,
  "goals_completed": 2,
  "goals_active": 3
}
```

> `total_money` = DB value - pending từ tasks DONE_TODAY.

---

## Task-Goal

### POST /tasks/:task_id/goals 🔒
Gắn task với goal.

**Request Body**
```json
{ "goal_id": "uuid", "reward_amount": 50000 }
```

**Response 201**
```json
{ "task_id": "uuid", "goal_id": "uuid", "reward_amount": "50000" }
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
Trigger scheduler thủ công.

**Response 200**
```json
{ "message": "Scheduler ran successfully", "confirmed": 3, "missed": 1 }
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
