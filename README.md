# TaskFlow — Full-Stack Task & Project Management Application

TaskFlow is an enterprise-quality task management system featuring role-based access control (RBAC), persistent drag-and-drop task reordering, and real-time bidirectional synchronization with WebSockets (Socket.IO).

---

## 1. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, React Router 6, Zustand, Axios, Socket.IO Client, Lucide Icons, Modern CSS tokens.
- **Backend:** Node.js, NestJS 10, TypeScript, RESTful API architecture, Socket.IO Gateway, Passport JWT, bcrypt.
- **Database:** PostgreSQL 18, Drizzle ORM, Drizzle Kit for migrations.
- **Dev Environment:** Local standalone setup (**Strictly Zero Docker / No Docker Compose**).

---

## 2. Monorepo Project Structure

```
TaskFlow/
├── frontend/                   # React + TypeScript + Vite Client
│   ├── src/
│   │   ├── components/         # Reusable atomic UI & modals
│   │   ├── layouts/            # Dark navy sidebar & top header layout
│   │   ├── pages/              # Login, Dashboards, Projects, Tasks, Users, Roles, Settings, Profile
│   │   ├── routes/             # Client-side protected route boundaries
│   │   ├── services/           # Axios HTTP client
│   │   ├── stores/             # Zustand state stores (auth, notifications)
│   │   ├── styles/             # Design tokens & global CSS
│   │   └── types/              # Domain TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                    # NestJS + TypeScript REST & WebSocket Server
│   ├── src/
│   │   ├── common/             # Filters, interceptors, decorators, pipes
│   │   ├── config/             # Environment validation
│   │   ├── database/           # PostgreSQL connection pool & Drizzle schemas
│   │   │   └── schema/         # Roles, Users, Projects, Tasks, Notifications
│   │   ├── auth/               # JWT authentication & session management
│   │   ├── users/              # User management & profile handlers
│   │   ├── roles/              # Role management & permissions matrix
│   │   ├── projects/           # Project CRUD & membership validation
│   │   ├── tasks/              # Task CRUD, status, and reordering APIs
│   │   └── main.ts
│   ├── drizzle.config.ts       # Drizzle Kit configuration
│   ├── package.json
│   └── .env.example
│
├── docs/                       # Architecture, Database, API & Checklist docs
│   ├── architecture.md
│   ├── database-design.md
│   ├── api-documentation.md
│   └── implementation-checklist.md
│
├── .gitignore
├── README.md
└── package.json
```

---

## 3. Local Setup Instructions (No Docker)

### Prerequisites
1. **Node.js:** v18+ (tested on Node v24.19.0)
2. **PostgreSQL:** v14+ (tested on local PostgreSQL 18 service running on port 5432)

### Step 1: Database Setup
1. Open `psql` or pgAdmin:
   ```sql
   CREATE DATABASE taskflow;
   ```
2. Verify that PostgreSQL is running locally on port 5432.

### Step 2: Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure `.env` (a template is provided in `backend/.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_local_postgres_password
   DB_NAME=taskflow
   JWT_SECRET=taskflow_super_secret_jwt_key_2026_dev_mode
   FRONTEND_URL=http://localhost:3000
   ```
3. Install backend dependencies:
   ```bash
   npm install
   ```
4. Generate and push database migrations:
   ```bash
   npm run drizzle:generate
   npm run drizzle:push
   ```
5. Start the backend server:
   ```bash
   npm run start:dev
   ```
   The backend API will be available at: `http://localhost:5000/api`

### Step 3: Frontend Configuration & Startup
1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at: `http://localhost:3000`

---

## 4. Default Credentials & Roles

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `anish.borkar@example.com` | `AdminPassword123!` | Full organization management (Users, Roles, Projects, Tasks, Settings, Deletion) |
| **User** | `rahul.kumar@example.com` | `UserPassword123!` | Access strictly restricted to assigned projects, task status modification, reordering |

*A "Quick Demo Access" pill switcher is embedded on the login page for instant one-click testing.*

---

## 5. Hand-Coded Assignment Boundaries

Per assignment specifications, core modules have been structured with explicit contracts and test scenarios for manual hand-coding:
1. `backend/src/database/schema/projects.schema.ts` — Projects table definition.
2. `backend/src/database/schema/project-members.schema.ts` — Project-member join table.
3. `backend/src/database/schema/tasks.schema.ts` — Tasks table definition.
4. `backend/src/database/schema/task-assignees.schema.ts` — Task-assignee join table.
5. `backend/src/tasks/` — Task CRUD and ordering controllers/services.
6. `frontend/src/pages/tasks/TasksPage.tsx` — Main Task list UI & DnD event handlers.

---

## 6. Testing Strategy

1. **Authentication Testing:**
   - Log in with Admin credentials $\rightarrow$ Verify access to Dashboard, Projects, Tasks, Users, Permissions.
   - Log in with User credentials $\rightarrow$ Verify Users & Permissions are hidden and guarded.
2. **Project Membership Testing:**
   - Verify regular users only see projects where they are explicitly added as a member.
3. **Drag-and-Drop Persistence:**
   - Reorder tasks on the Tasks page.
   - Refresh the browser $\rightarrow$ Verify that the reordered sequence remains identical.
4. **Real-Time Notification Testing:**
   - Open TaskFlow in two separate browser windows (one Admin, one User).
   - Assign a task to the user $\rightarrow$ Verify that the toast and unread notification badge trigger immediately without refresh.
