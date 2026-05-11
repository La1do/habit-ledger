# Frontend — Cấu trúc thư mục

## Tổng quan

```
frontend/src/
├── api/              # Axios client + API modules
├── components/       # Shared UI components
│   ├── ui/           # shadcn primitives
│   └── layout/       # App layout (Sidebar, Header, AppLayout)
├── hooks/            # Custom React hooks
├── lib/              # Constants, schemas, query keys
├── pages/            # Page components (theo feature)
├── router/           # React Router v7 config
├── store/            # Zustand stores
├── types/            # TypeScript types
├── utils/            # Pure utility functions
└── __tests__/        # Unit + property-based tests
```

---

## `src/api/` — HTTP Layer

| File | Mô tả |
|------|-------|
| `client.ts` | Axios instance: base URL, Bearer token interceptor, auto refresh khi 401, queue retry |
| `auth.ts` | `register`, `login`, `refreshToken`, `logout` |
| `tasks.ts` | `getTasks`, `createTask`, `updateTask`, `deleteTask`, `completeTask` |
| `goals.ts` | `getGoals`, `createGoal`, `updateGoal`, `deleteGoal`, `getGoalHistory` |
| `taskGoals.ts` | `linkTaskGoal`, `unlinkTaskGoal` |
| `users.ts` | `getSummary` |
| `scheduler.ts` | `runScheduler` |
| `notion.ts` | `getAuthUrl`, `getStatus`, `getPages`, `selectPage`, `extractPage`, `confirmTasks` |
| `index.ts` | Barrel export |

---

## `src/components/`

### `ui/` — shadcn primitives (dumb, không biết về API/store)

`badge`, `button`, `card`, `dialog`, `input`, `label`, `progress`, `skeleton`, `table`

### `layout/` — App shell

| File | Mô tả |
|------|-------|
| `AppLayout.tsx` | Sidebar + Header + `<Outlet />` |
| `Sidebar.tsx` | Nav links với active highlight |
| `Header.tsx` | App name + logout button |

---

## `src/pages/` — Feature Pages

### `auth/`
| File | Mô tả |
|------|-------|
| `LoginPage.tsx` | Form đăng nhập → lưu accessToken → redirect dashboard |
| `RegisterPage.tsx` | Form đăng ký → auto login → redirect dashboard |
| `components/AuthForm.tsx` | Shared form (RHF + Zod), 2 schemas: login/register |

### `dashboard/`
| File | Mô tả |
|------|-------|
| `DashboardPage.tsx` | Tổng hợp: ví, stats, tasks hôm nay |
| `components/WalletCard.tsx` | Số dư ví + cảnh báo nợ |
| `components/SummaryStats.tsx` | 4 stats cards (earned, debt, goals) |
| `components/TodayTasks.tsx` | Tasks PENDING/DONE_TODAY + toggle |

### `tasks/`
| File | Mô tả |
|------|-------|
| `TasksPage.tsx` | List tasks + mutations (create/edit/delete/complete/link) |
| `components/TaskCard.tsx` | Card task: click title → mở goal manager |
| `components/TaskForm.tsx` | Form tạo/sửa task (Zod: Habit→isRecurring, isRecurring→repeatFrequency) |
| `components/TaskGoalManager.tsx` | Popup: goals đã gắn + form gắn goal mới |
| `components/TaskGoalLink.tsx` | Form gắn goal (goalId + rewardAmount) |

### `goals/`
| File | Mô tả |
|------|-------|
| `GoalsPage.tsx` | Grid goals + mutations |
| `components/GoalCard.tsx` | Progress bar, badges (Hoàn thành/Saving) |
| `components/GoalForm.tsx` | Form tạo/sửa goal (validate target >= current) |
| `components/GoalHistory.tsx` | Dialog lịch sử earn của goal |

### `ledger/`
| File | Mô tả |
|------|-------|
| `LedgerPage.tsx` | Aggregate history từ tất cả goals |
| `components/LogTable.tsx` | Bảng: ngày, task, goal, số tiền |

### `notion/`
| File | Mô tả |
|------|-------|
| `NotionSetupPage.tsx` | 4-step stepper: Connect → Chọn page → Confirm tasks → Widget URL |
| `components/StepConnect.tsx` | Bước 1: Connect Notion OAuth |
| `components/StepSelectPage.tsx` | Bước 2: Chọn Notion page |
| `components/StepConfirm.tsx` | Bước 3: Review AI suggestions + "Gợi ý lại" |
| `components/StepDone.tsx` | Bước 4: Widget URL + copy + hướng dẫn embed |

---

## `src/store/` — Zustand Stores

| File | State |
|------|-------|
| `auth.store.ts` | `accessToken`, `user`, `setAccessToken`, `logout` — persist token vào localStorage |
| `ui.store.ts` | `sidebarOpen`, `toggleSidebar` |

---

## `src/lib/`

| File | Mô tả |
|------|-------|
| `queryKeys.ts` | TanStack Query key constants (`tasks`, `goals`, `userSummary`, `notionStatus`...) |
| `schemas.ts` | Zod schemas export (auth, task, goal, linkTaskGoal) — dùng cho tests |

---

## `src/types/`

| File | Types |
|------|-------|
| `user.ts` | `User`, `UserSummary` |
| `task.ts` | `Task`, `TaskStatus`, `TaskType`, `RepeatFrequency`, `CreateTaskInput`, `UpdateTaskInput` |
| `goal.ts` | `Goal`, `GoalStatus`, `GoalHistoryEntry`, `CreateGoalInput`, `UpdateGoalInput` |
| `taskGoal.ts` | `TaskGoal`, `TaskGoalWithGoal`, `LinkTaskGoalInput` |
| `completionLog.ts` | `CompletionLog`, `CompletionType`, `RewardStatus` |
| `index.ts` | Barrel export |

---

## `src/utils/`

| File | Mô tả |
|------|-------|
| `cn.ts` | `cn(...classes)` — clsx + tailwind-merge |
| `format.ts` | `formatMoney(amount)`, `formatDate(date)` — locale vi-VN |

---

## `src/hooks/`

| File | Mô tả |
|------|-------|
| `useApi.ts` | `useApi(queryKey, queryFn)` — TanStack Query wrapper; `useApiMutation(fn, { invalidateKeys })` |

---

## `src/__tests__/`

| File | Tests |
|------|-------|
| `utils/cn.test.ts` | Unit + Property 1: cn() idempotent, no duplicate classes |
| `utils/format.test.ts` | Unit + Property 2,3: formatMoney có ₫, formatDate DD/MM/YYYY |
| `store/auth.store.test.ts` | Unit + Property 4: token persistence round-trip |
| `validation/authSchema.test.ts` | Unit + Property 5: email/password validation |
| `validation/taskSchema.test.ts` | Unit + Property 6: Habit→isRecurring, isRecurring→repeatFrequency |
| `validation/goalSchema.test.ts` | Unit + Property 7,8: target_amount > 0, reward > 0 |

---

## Routing (`src/router/index.tsx`)

| Route | Component | Auth |
|-------|-----------|------|
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/dashboard` | DashboardPage | Protected |
| `/tasks` | TasksPage | Protected |
| `/goals` | GoalsPage | Protected |
| `/ledger` | LedgerPage | Protected |
| `/notion/setup` | NotionSetupPage | Protected |

`ProtectedRoute` → redirect `/login` nếu không có accessToken  
`PublicRoute` → redirect `/dashboard` nếu đã đăng nhập
