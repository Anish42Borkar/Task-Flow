# AI_PROMPTS.md

# TaskFlow – AI Development Documentation

## 1. Purpose

This document records the AI-assisted development activities performed during the development of the TaskFlow application.

As per the assignment guidelines, AI coding assistance was restricted to the following three modules:

1. Authentication
2. User Management
3. Role-Based Access Control (RBAC)

All remaining application features were developed independently without using AI coding tools.

The prompts documented below describe the intended development workflow, implementation requirements, and technical constraints for the permitted modules.

---

## 2. Project Technology Stack

| Technology  | Usage                   |
| ----------- | ----------------------- |
| NestJS      | Backend development     |
| TypeScript  | Application programming |
| PostgreSQL  | Database                |
| Drizzle ORM | Database operations     |
| React       | Frontend development    |
| JWT         | Authentication          |
| bcrypt      | Password hashing        |

---

# 3. Authentication Module

### AUTH-01: Analyze Existing Authentication Architecture

**Objective:** Understand the existing backend implementation before introducing authentication.

**Prompt:**

I am working on the authentication functionality of my TaskFlow application.

Before implementing anything, inspect the existing backend structure and understand how the application is organized.

Please review:

- NestJS module architecture.
- Existing user schema.
- Drizzle ORM configuration.
- Database connection.
- Environment variable configuration.
- Existing DTO and validation patterns.

I want the authentication implementation to follow the existing project conventions rather than introducing a separate architecture.

Do not modify any files yet. First explain the recommended implementation approach.

### AUTH-02: Set Up Authentication Module

**Objective:** Establish a modular authentication implementation.

**Prompt:**

Based on the existing project architecture, set up the authentication module in NestJS.

I want separate responsibilities for the controller, service, DTOs and module configuration.

Use the existing database connection and Drizzle ORM setup.

Keep the implementation consistent with the current folder structure and avoid unnecessary changes to existing files.

### AUTH-03: Implement User Registration

**Objective:** Allow new users to register securely.

**Prompt:**

Implement the registration functionality for TaskFlow.

The registration endpoint should:

- Accept the user's name, email and password.
- Validate the incoming request.
- Check for an existing account with the same email.
- Hash the password using bcrypt.
- Store the user details using the existing Drizzle ORM configuration.
- Avoid returning password hashes in the response.
- Handle duplicate email and validation errors appropriately.

Please follow the existing database schema and API response conventions.

### AUTH-04: Implement Login and JWT Generation

**Objective:** Authenticate registered users and generate access tokens.

**Prompt:**

Now implement the login functionality.

The login API should:

- Accept email and password.
- Find the registered user.
- Compare the submitted password with the stored bcrypt hash.
- Generate a JWT access token after successful authentication.
- Include the necessary user information in the token payload.
- Read the JWT secret and expiration configuration from environment variables.
- Return an appropriate error for invalid credentials.

Ensure that sensitive user information is not exposed in the response.

### AUTH-05: Protect APIs Using JWT Guard

**Objective:** Restrict access to authenticated endpoints.

**Prompt:**

Implement a reusable JWT authentication guard in the NestJS application.

The guard should validate incoming JWT tokens, check their expiration and extract the authenticated user's information.

Attach the authenticated user to the request object so that other controllers and guards can access it.

Support public endpoints where authentication is not required.

Keep authentication separate from role-based authorization because RBAC will be implemented as a separate module.

### AUTH-06: Review Authentication Security

**Objective:** Verify the authentication implementation.

**Prompt:**

Review the authentication implementation and identify any security or implementation issues.

Pay attention to:

- Password hashing and comparison.
- JWT validation and expiration.
- Invalid credential handling.
- Duplicate account prevention.
- Sensitive information in API responses.
- Environment variable configuration.
- Authentication guard behavior.

Suggest corrections only within the Authentication module.

---

# 4. User Management Module

### USER-01: Review Existing User Structure

**Objective:** Understand the existing user model and identify the required operations.

**Prompt:**

I want to implement User Management functionality in TaskFlow.

First inspect the existing user schema, authentication module and database queries.

Identify how user information is currently stored and suggest the APIs required for user management.

Reuse the existing database configuration and avoid creating duplicate user tables or database connections.

Do not modify unrelated application functionality.

### USER-02: Implement User Management APIs

**Objective:** Provide APIs for managing registered users.

**Prompt:**

Implement the User Management APIs using NestJS and Drizzle ORM.

Required functionality:

- Retrieve the list of users.
- Retrieve an individual user by ID.
- Update user profile information.
- Support user deactivation or deletion according to the existing data model.
- Implement pagination and search where appropriate.

Ensure that password hashes and other sensitive information are excluded from API responses.

Follow the existing controller, service and DTO conventions.

### USER-03: Add User Profile Validation

**Objective:** Protect user profile information from unauthorized modifications.

**Prompt:**

Review the user update functionality and improve its validation and access restrictions.

Ensure:

- Users can access their own profile.
- Users cannot modify protected account fields through profile updates.
- Users cannot update another user's information without appropriate authorization.
- Incoming data is validated using the existing validation approach.
- Appropriate HTTP status codes are returned.

Reuse the existing authentication guard.

### USER-04: Review User Management Implementation

**Objective:** Verify API behavior and security.

**Prompt:**

Review the User Management implementation.

Check the following scenarios:

- Retrieving users.
- Retrieving a user by ID.
- Updating profile information.
- Handling invalid user IDs.
- Handling duplicate or invalid data.
- Preventing unauthorized profile updates.
- Excluding sensitive information from responses.

Identify any issues and suggest improvements within the User Management scope only.

---

# 5. Role-Based Access Control (RBAC)

### RBAC-01: Review Authorization Requirements

**Objective:** Plan role-based access control based on the existing application architecture.

**Prompt:**

I want to introduce Role-Based Access Control in my TaskFlow application.

The application requires three roles:

- Admin
- Manager
- Member

First inspect the existing authentication implementation and user schema.

Suggest a maintainable approach for associating roles with users and enforcing role-based access to API endpoints.

Use the existing NestJS architecture and Drizzle ORM configuration.

Do not modify files until the proposed approach is reviewed.

### RBAC-02: Implement Roles Decorator

**Objective:** Define role requirements for protected endpoints.

**Prompt:**

Implement a reusable Roles decorator in NestJS.

The decorator should allow controllers and individual API endpoints to specify which roles are permitted to access them.

Keep the implementation reusable and consistent with standard NestJS metadata patterns.

Do not introduce additional authorization logic into the authentication service.

### RBAC-03: Implement Roles Guard

**Objective:** Enforce role-based authorization.

**Prompt:**

Implement a reusable RolesGuard that checks whether the authenticated user has permission to access a protected endpoint.

Requirements:

- Read allowed roles from the Roles decorator.
- Retrieve the authenticated user's role from the request.
- Validate whether the user's role is permitted.
- Integrate with the existing JWT authentication guard.
- Return HTTP 403 when the user lacks the required role.
- Handle endpoints that do not specify role restrictions appropriately.

Keep authentication and authorization responsibilities separate.

### RBAC-04: Secure Role Assignment

**Objective:** Prevent unauthorized role modifications.

**Prompt:**

Review the role assignment functionality and ensure that role changes are properly protected.

Only authorized administrators should be able to assign or modify privileged roles.

Ensure that:

- Users cannot assign themselves Admin privileges.
- Unauthorized users cannot change another user's role.
- Invalid role values are rejected.
- Role updates follow the existing user data model.
- Appropriate authorization checks are applied.

Implement changes only within the User Management and RBAC scope.

### RBAC-05: Authorization Review

**Objective:** Verify role-based access restrictions.

**Prompt:**

Perform a security review of the RBAC implementation.

Verify the following:

- Admin-only endpoints reject Manager and Member users.
- Manager-only endpoints reject Member users.
- Member users cannot access restricted administrative operations.
- Unauthenticated requests receive HTTP 401.
- Authenticated users without sufficient permissions receive HTTP 403.
- Missing or invalid role information is handled securely.

Report any identified issues and suggest corrections within the RBAC scope.

---

# 6. AI Usage Boundaries

AI coding assistance was restricted to Authentication, User Management and RBAC.

The following application functionalities were developed independently without AI coding assistance:

| Functionality                             | Development approach    |
| ----------------------------------------- | ----------------------- |
| Database design and schema implementation | Independent development |
| Project management                        | Independent development |
| Task management and CRUD operations       | Independent development |
| Task assignment                           | Independent development |
| Task status management                    | Independent development |
| Drag-and-drop functionality               | Independent development |
| Persistent task ordering                  | Independent development |
| Real-time notifications using Socket.IO   | Independent development |
| Other application business logic          | Independent development |

No AI coding tools were used to generate, debug, modify or refactor code for the above functionalities.

---

# 7. Verification and Code Review

The AI-assisted implementation was reviewed as part of the development process.

The following areas were considered during verification:

**Authentication**

- Registration and login behavior.
- Password hashing.
- JWT generation and validation.
- Protected endpoint access.

**User Management**

- User retrieval and profile updates.
- Request validation.
- Sensitive information protection.
- Unauthorized update prevention.

**RBAC**

- Role assignment restrictions.
- Role-based endpoint access.
- Unauthorized access handling.
- HTTP 401 and 403 responses.

Implementation and testing status should reflect the actual completed work.

---
