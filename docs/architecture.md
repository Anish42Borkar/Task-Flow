# TaskFlow Architecture Documentation

## 1. System Overview
TaskFlow is a multi-tenant full-stack task and project management system designed with strict role-based access control (RBAC), drag-and-drop task reordering persisted in PostgreSQL, and real-time bidirectional synchronization using WebSockets (Socket.IO).

## 2. High-Level Architecture

```
+----------------------------------------------------------------------+
|                           React Client                               |
| (Vite, TypeScript, React Router, Zustand, Socket.IO Client, CSS)     |
+----------------------------------+-----------------------------------+
                                   |
                  +----------------+----------------+
                  | HTTP (REST)                     | WebSocket (WS)
                  v                                 v
+----------------------------------------------------------------------+
|                           NestJS Server                              |
|                                                                      |
|  +------------------------+  +------------------------------------+  |
|  |     REST Controllers   |  |        Socket.IO Gateway           |  |
|  | (Auth, Users, Projects,|  | (Connection Handshake, User Rooms, |  |
|  |  Tasks, Notifications) |  |       Project Board Rooms)         |  |
|  +-----------+------------+  +-----------------+------------------+  |
|              |                                 |                     |
|  +-----------v---------------------------------v------------------+  |
|  |                           Guards                               |  |
|  |  (JwtAuthGuard, RolesGuard, ProjectMemberGuard, WsJwtGuard)    |  |
|  +---------------------------+------------------------------------+  |
|                              |                                       |
|  +---------------------------v------------------------------------+  |
|  |                      Service Layer                             |  |
|  |   (AuthService, UserService, ProjectService, TaskService,     |  |
|  |              NotificationService, EventsService)               |  |
|  +---------------------------+------------------------------------+  |
|                              |                                       |
|  +---------------------------v------------------------------------+  |
|  |                       Drizzle ORM                              |  |
|  |        (PostgreSQL Client 'pg' Connection Pool Provider)       |  |
|  +---------------------------+------------------------------------+  |
+------------------------------|---------------------------------------+
                               |
                               v
+----------------------------------------------------------------------+
|                   Local PostgreSQL 18 Database                       |
| (Users, Roles, Permissions, Projects, Members, Tasks, Assignees, ...) |
+----------------------------------------------------------------------+
```

## 3. Technology Rationale
- **Frontend (Vite + React + TypeScript):** Ultra-fast compilation and HMR, strong typing across DTOs and API responses.
- **State Management (Zustand):** Lightweight, boilerplate-free state stores for auth, tasks, and real-time notification streams.
- **Backend (NestJS + TypeScript):** Enterprise modular architecture with Dependency Injection, declarative Guards, Interceptors, and Pipes.
- **ORM (Drizzle ORM & Drizzle Kit):** Type-safe SQL builder with zero runtime overhead, transparent SQL generation, and instant schema migrations without heavy abstraction.
- **Real-Time (Socket.IO):** Event-driven synchronization for task assignments, drag-and-drop reordering, and team notifications.
- **Local Database (PostgreSQL 18):** Robust ACID transactions, relational integrity, compound indexes, and strict constraint validation without Docker.

## 4. Security & Access Boundaries
- **Authentication:** Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256. Passwords hashed using bcrypt (salt rounds: 10).
- **Authorization:** Multi-tiered NestJS guards:
  - `JwtAuthGuard`: Enforces token validity.
  - `RolesGuard`: Enforces admin-only operations (user management, project deletion, global roles).
  - `ProjectMemberGuard`: Database verification ensuring a standard user can only access projects where they are explicitly added as members.
- **Zero Trust UI:** While the UI conditionally hides unpermitted actions, the backend API independently validates all privileges.
