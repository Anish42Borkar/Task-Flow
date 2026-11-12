# TaskFlow API Documentation

All endpoints are prefixed with `/api`. Protected routes require a Bearer token in the `Authorization` header:
`Authorization: Bearer <jwt_access_token>`

---

## 1. Authentication & Profile (`/api/auth`)

### `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "fullName": "Alex Johnson",
    "email": "alex.johnson@example.com",
    "password": "Password123!",
    "department": "Engineering",
    "phone": "+91 98765 43210"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "c1f7b8a0-...",
      "fullName": "Alex Johnson",
      "email": "alex.johnson@example.com",
      "role": "user",
      "department": "Engineering",
      "phone": "+91 98765 43210",
      "isActive": true,
      "createdAt": "2026-11-12T18:15:00.000Z"
    }
  }
  ```

### `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "anish.borkar@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "c1f7b8a0-...",
      "fullName": "Anish Borkar",
      "email": "anish.borkar@example.com",
      "role": "admin",
      "department": "IT"
    }
  }
  ```

### `POST /api/auth/refresh`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "refreshToken": "eyJhbGciOi..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
  ```

### `POST /api/auth/logout`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "refreshToken": "eyJhbGciOi..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### `POST /api/auth/logout-all`
- **Access:** Protected (Requires `Authorization: Bearer <accessToken>`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out from all active sessions"
  }
  ```

### `GET /api/auth/me`
- **Access:** Protected
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "c1f7b8a0-...",
      "fullName": "Anish Borkar",
      "email": "anish.borkar@example.com",
      "role": "admin",
      "department": "IT",
      "phone": "+91 98765 43210",
      "joinedOn": "2026-11-01T00:00:00.000Z",
      "lastLogin": "2026-11-08T14:45:00.000Z",
      "status": "Active"
    },
    "permissions": [...]
  }
  ```

### `PUT /api/auth/profile`
- **Access:** Protected
- **Request Body:**
  ```json
  {
    "fullName": "Anish Borkar",
    "phone": "+91 98765 43210",
    "department": "IT"
  }
  ```

### `PUT /api/auth/change-password`
- **Access:** Protected
- **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewStrongPassword456!"
  }
  ```

---

## 2. User Management (`/api/users`) — Admin Only

### `GET /api/users`
- **Access:** Admin
- **Query Params:** `?page=1&limit=10&search=Rahul&role=user&status=active`
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "...",
        "fullName": "Rahul Kumar",
        "email": "rahul@taskflow.com",
        "role": "admin",
        "department": "IT",
        "isActive": true,
        "createdAt": "2026-10-28T00:00:00.000Z"
      }
    ],
    "meta": {
      "total": 24,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
  ```

### `POST /api/users`
- **Access:** Admin
- **Request Body:**
  ```json
  {
    "fullName": "Priya Desai",
    "email": "priya.desai@taskflow.com",
    "password": "Password123!",
    "roleId": "user",
    "department": "Design",
    "phone": "+91 91234 56789",
    "isActive": true
  }
  ```

---

## 3. Project Management (`/api/projects`)

### `GET /api/projects`
- **Access:** Protected (Admin receives all; User receives only member projects)
- **Response (200 OK):**
  ```json
  [
    {
      "id": "...",
      "name": "Website Redesign",
      "description": "Marketing website revamp with new UI/UX",
      "status": "active",
      "dueDate": "2026-11-30T00:00:00.000Z",
      "tasksCount": 24,
      "completedTasksCount": 17,
      "progressPercentage": 70,
      "members": [
        { "id": "...", "fullName": "Anish Borkar", "avatar": "AB" },
        { "id": "...", "fullName": "Priya Sharma", "avatar": "PS" }
      ]
    }
  ]
  ```

### `POST /api/projects`
- **Access:** Admin
- **Request Body:**
  ```json
  {
    "name": "Mobile App",
    "description": "Cross-platform mobile application (React Native)",
    "status": "active",
    "dueDate": "2026-12-15T00:00:00.000Z",
    "memberIds": ["user-uuid-1", "user-uuid-2"]
  }
  ```

---

## 4. Task Management (`/api/tasks` & `/api/projects/:projectId/tasks`)

### `GET /api/projects/:projectId/tasks`
- **Access:** Protected (Admin or Project Member)
- **Response (200 OK):**
  ```json
  [
    {
      "id": "...",
      "title": "Update project documentation",
      "description": "Update documentation with latest deployment steps.",
      "status": "In Progress",
      "priority": "Medium",
      "orderIndex": 1.0,
      "dueDate": "2026-11-30T00:00:00.000Z",
      "projectId": "...",
      "assignees": [
        { "id": "...", "fullName": "Anish Borkar" },
        { "id": "...", "fullName": "Priya Naik" }
      ],
      "createdAt": "2026-11-01T10:00:00.000Z"
    }
  ]
  ```

### `POST /api/projects/:projectId/tasks`
- **Access:** Protected (Admin or Project Member)
- **Request Body:**
  ```json
  {
    "title": "Integrate authentication",
    "description": "Implement JWT and protected routes",
    "status": "Pending",
    "priority": "High",
    "dueDate": "2026-11-10T00:00:00.000Z",
    "assigneeIds": ["user-uuid-1"]
  }
  ```

### `PATCH /api/projects/:projectId/tasks/reorder`
- **Access:** Protected (Admin or Project Member)
- **Request Body:**
  ```json
  {
    "orderedTaskIds": [
      "task-uuid-2",
      "task-uuid-1",
      "task-uuid-3"
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Task ordering persisted"
  }
  ```

### `PATCH /api/tasks/:id/status`
- **Access:** Protected (Admin or Project Member)
- **Request Body:**
  ```json
  {
    "status": "Completed"
  }
  ```

### `DELETE /api/tasks/:id`
- **Access:** Admin Only (403 if called by regular user)

---

## 5. Socket.IO Real-Time Events
- Handshake Auth: `socket = io(SERVER_URL, { auth: { token } })`
- Sockets subscribe to `project:join` with `{ projectId }`.
- Events broadcast: `task:created`, `task:updated`, `task:status_changed`, `task:reordered`, `notification:new`.
