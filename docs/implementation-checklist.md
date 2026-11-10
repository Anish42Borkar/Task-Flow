# TaskFlow Implementation & Verification Checklist

## 1. Hand-Coded Restricted Modules (For Your Implementation)
The assignment specification explicitly mandates that the following modules must be coded by hand:

- [ ] **Database Schema (Projects & Tasks):**
  - Implement Drizzle schema files in `backend/src/database/schema/projects.schema.ts` and `tasks.schema.ts`.
  - Include foreign keys, indexes, cascades, and status enums.
- [ ] **Task CRUD APIs:**
  - `TasksController` endpoints for create, read, update, delete.
  - `TasksService` handling persistence via Drizzle.
- [ ] **Task Assignment Logic:**
  - Validating assignees belong to the project.
  - Inserting/deleting in `task_assignees` join table.
- [ ] **Task Status Handling:**
  - Validating status transitions (`Pending` -> `In Progress` -> `Completed`).
- [ ] **Task Ordering / Reordering Persistence:**
  - `reorderTasks` logic updating `order_index` in PostgreSQL.
- [ ] **Main Task List UI:**
  - React component rendering task table/cards with status tabs.
- [ ] **Drag-and-Drop Task Ordering:**
  - Frontend drag event handling and optimistic state updates.
- [ ] **Socket.IO Real-Time Pipelines:**
  - Backend `EventsGateway` handling socket rooms and emitting events.
  - Frontend `useSocket` hook subscribing to real-time events.
- [ ] **Authentication & Security:**
  - Hashing passwords with `bcrypt`, generating and verifying JWT tokens.
- [ ] **User & Role Management:**
  - Admin CRUD for users and roles.
- [ ] **RBAC / Permission Middleware:**
  - `JwtAuthGuard`, `RolesGuard`, and `ProjectMemberGuard`.

---

## 2. Supporting Architecture (Provided / Scaffolding)
- [x] Project architecture documentation.
- [x] Database relationship and constraint specification.
- [x] REST API and Socket.IO contracts.
- [ ] Vite + React + TypeScript frontend initialization.
- [ ] NestJS backend initialization.
- [ ] Drizzle ORM provider and database module scaffolding.
- [ ] Complete UI design system matching the approved ZIP screenshots:
  - Dark navy sidebar (`#0f172a` / `#1e1b4b`) with active purple highlights.
  - Top header with search bar, notifications bell, and profile pill.
  - Login screen layout with dual-panel branding and illustration.
  - Admin & User Dashboard layouts with stat cards and widgets.
  - Project management table with progress bars and member avatars.
  - User management table with status pills and role badges.
  - Role permissions matrix interface.
  - Settings (General, Security, About) tabs.
  - User profile and Change Password interface.
  - Reusable modals, toast notifications, confirmation dialogs, and loaders.
