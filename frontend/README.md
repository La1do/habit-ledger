# HabitLedger Frontend

Web UI cho ứng dụng HabitLedger — theo dõi thói quen và tích lũy phần thưởng theo mục tiêu tài chính.

## Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (server state) + Zustand (client state)
- **Routing**: React Router v7
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios (với auto refresh token)
- **Testing**: Vitest + fast-check (property-based testing)

## Cài đặt

```bash
npm install
```

Tạo file `.env`:
```env
VITE_BACKEND_URL=http://localhost:3000/api
```

Chạy dev server:
```bash
npm run dev   # http://localhost:5173
```

Chạy tests:
```bash
npm test              # Chạy một lần
npm run test:watch    # Watch mode
```

---

## Cấu trúc thư mục

```
src/
  api/              # Axios client + API modules (auth, tasks, goals, users...)
  pages/            # Page components
    auth/           # Login, Register
    dashboard/      # Dashboard (ví, summary, tasks hôm nay)
    tasks/          # Quản lý tasks + gắn goal
    goals/          # Quản lý goals + progress
    ledger/         # Lịch sử giao dịch
  components/
    ui/             # shadcn primitives (Button, Card, Badge, Dialog...)
    layout/         # Sidebar, Header, AppLayout
  hooks/
    useApi.ts       # Generic TanStack Query wrapper
  store/
    auth.store.ts   # Zustand: accessToken, user
    ui.store.ts     # Zustand: sidebar state
  types/            # TypeScript types khớp Prisma schema
  utils/
    cn.ts           # clsx + tailwind-merge
    format.ts       # formatMoney, formatDate
  lib/
    queryKeys.ts    # TanStack Query key constants
    schemas.ts      # Zod validation schemas (exported để test)
  router/
    index.tsx       # Routes + ProtectedRoute + PublicRoute
```

---

## Authentication

- `accessToken` lưu trong `localStorage`, tự động gắn vào mọi request
- `refreshToken` là httpOnly cookie, tự động gửi khi cần refresh
- Khi accessToken hết hạn (401) → axios interceptor tự gọi `/auth/refresh-token`
- Nếu refresh thất bại → logout + redirect `/login`
- Các request đang chờ được queue lại và retry sau khi refresh thành công

---

## Các màn hình

| Route | Màn hình | Mô tả |
|-------|---------|-------|
| `/login` | Login | Đăng nhập |
| `/register` | Register | Đăng ký |
| `/dashboard` | Dashboard | Ví tiền, summary stats, tasks hôm nay |
| `/tasks` | Tasks | Danh sách tasks, tick complete, gắn goal |
| `/goals` | Goals | Progress bar từng goal, lịch sử earn |
| `/ledger` | Ledger | Lịch sử giao dịch theo goal |

---

## Business Logic (FE)

### Pending Reward Display

Khi task được tick `DONE_TODAY`:
- FE gọi `PATCH /tasks/:id/complete`
- Sau đó invalidate cả `tasks`, `goals`, `userSummary`
- `GET /goals` trả về `current_amount` đã cộng pending (BE tính)
- `GET /users/me/summary` trả về `total_money` đã trừ pending (BE tính)
- GoalCard hiển thị progress bar cập nhật ngay lập tức

### Task-Goal Manager

- Bấm vào title của task → mở popup `TaskGoalManager`
- Popup hiển thị: danh sách goals đã gắn + form gắn goal mới
- Badge `🎯 N` trên task card cho biết số goals đã gắn

---

## Rules

- Mọi API call đi qua `src/api/` — không import axios trực tiếp trong components
- Server state → TanStack Query, Client state → Zustand
- Không dùng `useState` để lưu API data
- Không dùng `any` — tất cả types tường minh trong `src/types/`
- Tailwind utility classes only — không CSS modules, không inline styles
- Dùng `cn()` cho conditional class merging
