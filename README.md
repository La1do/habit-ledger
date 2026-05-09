# HabitLedger

Ứng dụng theo dõi thói quen và tích lũy phần thưởng theo mục tiêu tài chính.

> Xây dựng thói quen tốt → tích lũy tiền vào mục tiêu tài chính của bạn.

---

## Tổng quan

HabitLedger cho phép người dùng:
- Tạo **tasks** (thói quen hàng ngày hoặc công việc một lần)
- Tạo **goals** (mục tiêu tài chính: mua laptop, du lịch, v.v.)
- Gắn task với goal và đặt **reward amount** — mỗi lần hoàn thành task, tiền tự động tích lũy vào goal
- Theo dõi tiến độ goal theo thời gian thực
- Xem lịch sử giao dịch minh bạch qua **immutable ledger** (hash chain)

---

## Kiến trúc

```
habit-ledger/
├── backend/    # REST API — Node.js + Express + Prisma + PostgreSQL
└── frontend/   # Web UI — React + Vite + TypeScript + Tailwind
```

---

## Yêu cầu

- Node.js >= 18
- Docker (để chạy PostgreSQL)
- npm

---

## Khởi động nhanh

### 1. Clone repo

```bash
git clone <repo-url>
cd habit-ledger
```

### 2. Khởi động Backend

```bash
cd backend
npm install
cp .env.example .env   # Chỉnh sửa DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
docker-compose up -d   # Khởi động PostgreSQL
npx prisma migrate dev # Chạy migrations
npm run dev            # Server tại http://localhost:3000
```

### 3. Khởi động Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_BACKEND_URL=http://localhost:3000/api
npm run dev            # App tại http://localhost:5173
```

---

## Tech Stack

### Backend
| Công nghệ | Mục đích |
|-----------|---------|
| Node.js + TypeScript | Runtime |
| Express.js | HTTP framework |
| Prisma | ORM |
| PostgreSQL | Database |
| JWT (dual token) | Authentication |
| node-cron | Daily scheduler |
| Vitest | Testing |

### Frontend
| Công nghệ | Mục đích |
|-----------|---------|
| React 18 + Vite | UI framework |
| TypeScript | Type safety |
| Tailwind CSS + shadcn/ui | Styling |
| TanStack Query | Server state |
| Zustand | Client state |
| React Router v7 | Routing |
| React Hook Form + Zod | Forms & validation |
| Axios | HTTP client (auto refresh token) |
| Vitest + fast-check | Testing + PBT |

---

## Tính năng chính

### Tasks
- Tạo task loại **Habit** (lặp lại: daily/weekly/monthly) hoặc **OneTime**
- Tick hoàn thành → status `DONE_TODAY`
- Gắn task với nhiều goals, mỗi goal có `reward_amount` riêng
- Bấm vào task để quản lý goals đã gắn

### Goals
- Tạo mục tiêu tài chính với `target_amount`
- Progress bar hiển thị tiến độ tích lũy
- **Pending reward**: khi tick task, progress bar cập nhật ngay (preview trước khi scheduler xác nhận)
- **Saving Mode**: goal tiếp tục tích lũy sau khi đạt target
- Xem lịch sử earn của từng goal

### Dashboard
- Số dư ví hiện tại (đã trừ pending reward)
- Tổng tiền đã earn, tổng nợ, số goals active/completed
- Danh sách tasks cần làm hôm nay

### Ledger
- Lịch sử giao dịch theo từng goal
- Dữ liệu từ `CompletionLog` — immutable, không thể sửa

### Authentication
- Đăng ký / Đăng nhập
- JWT dual-token: accessToken (15 phút) + refreshToken (7 ngày, httpOnly cookie)
- Auto refresh token khi hết hạn

---

## Business Logic

### Pending Reward (Display Only)
Khi user tick task → `DONE_TODAY`:
- DB **không thay đổi** ngay
- API tự tính và trả về `current_amount` của goal đã cộng pending
- API tự tính và trả về `total_money` đã trừ pending
- Mục đích: preview số tiền sẽ chuyển khi scheduler chạy

### Daily Scheduler (00:01 mỗi ngày)
- Tasks `DONE_TODAY` → trừ tiền thật từ ví, cộng vào goal, ghi `CompletionLog`
- Tasks `PENDING` quá deadline → `MISSED`
- Goals đạt target → `COMPLETED`

### Debt Tracking
Nếu ví không đủ tiền khi scheduler chạy → ghi `CompletionLog` với `reward_status = DEBT`, tiền vẫn cộng vào goal.

### Immutable Ledger
Mỗi `CompletionLog` có `hash` (SHA-256) và `previousHash` — phát hiện gian lận nếu ai sửa log.

---

## Tài liệu chi tiết

- [Backend README](./backend/README.md)
- [API Documentation](./backend/api-doc.md)
- [Frontend README](./frontend/README.md)
