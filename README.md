# EXPLANATION.md — Finance Intelligence Dashboard Backend

A detailed walkthrough of **every** component, decision, and implementation detail.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Design (Prisma Schema)](#2-database-design-prisma-schema)
3. [Project Configuration](#3-project-configuration)
4. [Authentication System](#4-authentication-system)
5. [Middleware Pipeline](#5-middleware-pipeline)
6. [RBAC Enforcement (scopeQuery)](#6-rbac-enforcement-scopequery)
7. [CRUD Modules](#7-crud-modules)
8. [Analytics Engine](#8-analytics-engine)
9. [Validation System](#9-validation-system)
10. [Error Handling](#10-error-handling)
11. [Pagination](#11-pagination)
12. [API Reference](#12-api-reference)
13. [Environment Variables](#13-environment-variables)

---

## 1. Architecture Overview

### Request Lifecycle

Every HTTP request flows through this pipeline:

```
Client Request
  → CORS + JSON parsing (global)
  → authenticate middleware (JWT verification)
  → authorize middleware (role check)
  → validateRequest middleware (Zod schema validation)
  → Controller (thin — calls service, formats response)
  → Service (business logic + RBAC scoping + Prisma queries)
  → Prisma ORM → PostgreSQL
  → Response (via ApiResponse envelope)
  → Global Error Handler (catches any thrown errors)
```

### Why This Stack?

| Technology | Why |
|---|---|
| **Express 5** | Native async error handling — no need for `asyncHandler` wrappers. Throws in async route handlers are automatically caught and forwarded to the error handler. |
| **Prisma 7** | Type-safe ORM with `groupBy` and `aggregate` support for analytics. Requires `@prisma/adapter-pg` driver adapter. |
| **Zod 4** | Schema validation with TypeScript type inference. Validates request body/params/query before reaching controllers. |
| **JWT** | Stateless authentication with access+refresh token pattern. Access tokens are short-lived (15min), refresh tokens are long-lived (7d) and stored in the database. |
| **bcrypt** | Industry-standard password hashing with 12 salt rounds. |

### Folder Structure

```
src/
├── config/          → Environment validation + Prisma client singleton
├── controllers/     → Thin request handlers — delegate to services
├── services/        → ALL business logic lives here
├── routes/          → Route definitions + middleware wiring
├── middleware/       → authenticate, authorize, validateRequest, errorHandler
├── validations/     → Zod schemas per domain
├── utils/           → Reusable helpers (errors, responses, pagination, RBAC scoping)
├── types/           → TypeScript type definitions
└── generated/prisma → Auto-generated Prisma client (DO NOT EDIT)
```

---

## 2. Database Design (Prisma Schema)

### Models

#### Company (Tenant Root)
- **Purpose**: The top-level entity. Every other model is scoped to a company.
- **Fields**: `id`, `name`, `industry` (optional)
- **Relations**: Has many Users, Teams, Projects, FinancialRecords, Budgets

#### User
- **Purpose**: A member of a company with a specific role.
- **Key fields**: `email` (unique), `password` (bcrypt hash), `role` (EMPLOYEE|MANAGER|ADMIN), `isActive` (for soft delete)
- **Tenant scoping**: `companyId` FK → Company
- **Team membership**: `teamId` FK → Team (optional, nullable)
- **Indexes**: `(companyId)`, `(companyId, role)`, `(companyId, teamId)` — accelerates tenant-scoped queries

#### RefreshToken
- **Purpose**: Stores refresh tokens in the database for token rotation.
- **Key fields**: `token` (unique), `expiresAt`, `userId`
- **Why a separate model?** Supports multiple devices per user. Each device gets its own refresh token. On refresh, the old token is deleted and a new one is created (rotation).
- **Cascade delete**: When a user is deleted, all their refresh tokens are automatically removed.

#### Team
- **Purpose**: Groups users within a company. MANAGER role scopes queries to their team.
- **Tenant scoping**: `companyId` FK → Company
- **Relations**: Has many Users, FinancialRecords, Budgets

#### Project
- **Purpose**: Optional grouping for financial records.
- **Tenant scoping**: `companyId` FK → Company

#### FinancialRecord
- **Purpose**: The core data entity — a single income or expense entry.
- **Key fields**: `amount`, `type` (INCOME|EXPENSE), `category`, `notes`, `date`
- **Relations**: Belongs to User (who created it), Team, optionally Project
- **Why `companyId` is denormalized**: Without it, analytics queries would need JOINs through User or Team to reach the company. By storing `companyId` directly, we enable single-table index scans for analytics (e.g., `WHERE companyId = ? AND date BETWEEN ? AND ?`).
- **Indexes** (critical for performance):
  - `(companyId)` — basic tenant filter
  - `(companyId, date)` — analytics date range queries
  - `(companyId, teamId)` — by-team analytics
  - `(companyId, category)` — by-category analytics
  - `(companyId, userId)` — EMPLOYEE scoped queries
  - `(teamId)` — MANAGER scoped queries
  - `(userId)` — user's own records
  - `(date)` — date sorting

#### Budget
- **Purpose**: Monthly spending limit per team. Tracks `totalBudget` and `usedAmount`.
- **Key fields**: `totalBudget`, `usedAmount` (auto-updated), `period` (format: "YYYY-MM")
- **Derived values** (computed at query time, not stored):
  - `remainingAmount` = `totalBudget - usedAmount`
  - `utilizationPercent` = `(usedAmount / totalBudget) * 100`
- **Unique constraint**: `@@unique([teamId, period])` — one budget per team per month
- **Auto-update logic**: When an EXPENSE-type FinancialRecord is created or deleted, the corresponding budget's `usedAmount` is incremented or decremented. See `FinancialRecordService.updateBudgetUsedAmount()`.

### Enums

- **Role**: `EMPLOYEE | MANAGER | ADMIN` — used for RBAC
- **RecordType**: `INCOME | EXPENSE` — categorizes financial records

---

## 3. Project Configuration

### `src/config/env.ts` — Environment Validation

Uses Zod to validate all environment variables at startup. If any required variable is missing, the process exits immediately with a descriptive error message.

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string(),         // Required
  PORT: z.string().default('5000'), // Optional, defaults to 5000
  JWT_SECRET: z.string(),           // Required
  JWT_REFRESH_SECRET: z.string().default('...'), // Optional with default
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  NODE_ENV: z.enum([...]).default('development'),
});
```

**Why validate at startup?** Fail fast. If the app can't connect to the database or sign tokens, it's better to crash immediately than discover it when the first request hits.

### `src/config/prisma.ts` — Prisma Client Singleton

Creates a single PrismaClient instance using the `@prisma/adapter-pg` driver adapter with a `pg.Pool` connection pool.

**Singleton pattern**: Uses `globalThis` to prevent multiple Prisma instances during hot reload in development (ts-node-dev restarts the module but globalThis persists).

```typescript
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

---

## 4. Authentication System

### Registration Flow (`POST /api/auth/register`)

1. Check if email already exists → 409 Conflict
2. Hash password with bcrypt (12 rounds)
3. Create Company + Admin User in a **transaction** (atomic — both succeed or both rollback)
4. Generate access token (15min) + refresh token (7d)
5. Store refresh token in database
6. Return user, company, and tokens

### Login Flow (`POST /api/auth/login`)

1. Find user by email
2. Check `isActive` flag → reject deactivated users
3. Compare password with bcrypt → 401 if wrong
4. Generate new token pair
5. Return user, company, and tokens

### Token Refresh Flow (`POST /api/auth/refresh`)

1. Find refresh token in database
2. Check expiration → 401 if expired (and delete the expired token)
3. **Token rotation**: Delete the old refresh token, generate a new pair
4. Return new access + refresh tokens

**Why token rotation?** If a refresh token is stolen, the attacker can only use it once. When the legitimate user tries to refresh, their old token is gone, alerting them to a compromise.

### JWT Payload

```typescript
{
  userId: string;    // User's ID
  companyId: string; // User's company (tenant)
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  teamId: string | null;  // User's team (null if unassigned)
}
```

**Critical security rule**: `companyId` is **never** derived from user input. It comes exclusively from the JWT payload, which was set during login from the database. This prevents tenant spoofing.

---

## 5. Middleware Pipeline

### `authenticate.ts`

Extracts the Bearer token from the `Authorization` header, verifies it with `jwt.verify()`, and attaches the decoded payload to `req.user`.

- No token → 401 `Missing or invalid authorization header`
- Invalid/expired token → 401 `Invalid or expired token`

### `authorize.ts`

Factory function that takes an array of allowed roles and returns middleware:

```typescript
authorize('MANAGER', 'ADMIN')
// → allows MANAGER and ADMIN, blocks EMPLOYEE with 403
```

### `validate-request.ts`

Factory that accepts Zod schemas for `body`, `params`, and/or `query`:

```typescript
validateRequest({
  body: createRecordSchema,
  params: recordIdParamSchema,
  query: analyticsQuerySchema,
})
```

If validation fails, returns 400 with the Zod error details. If it passes, the original `req.body`/`req.params`/`req.query` are **replaced** with the parsed+coerced values.

### `error-handler.ts`

The catch-all error handler (must be registered last in Express):

- **AppError** (operational): Returns the specific status code and message
- **PrismaClientKnownRequestError P2002**: Unique constraint violation → 409
- **PrismaClientKnownRequestError P2025**: Record not found → 404
- **Unknown errors**: 500 with generic message in production

---

## 6. RBAC Enforcement (scopeQuery)

The `scopeQuery(user)` utility is the **most critical piece** of the security model. It builds a Prisma `where` clause based on the user's role:

```typescript
scopeQuery(user) returns:
  ADMIN    → { companyId: user.companyId }                    // All company data
  MANAGER  → { companyId: user.companyId, teamId: user.teamId } // Team data only
  EMPLOYEE → { companyId: user.companyId, userId: user.userId }  // Own data only
```

### Defense in Depth

RBAC is enforced at **three** layers:

1. **Route level** (`authorize` middleware): Blocks entire routes by role
2. **Service level** (`scopeQuery`): Filters data by role within allowed routes
3. **Database level** (composite indexes): Makes scoped queries efficient

Even if a bug bypasses route-level authorization, the service layer will still scope the query correctly. This is why RBAC is enforced at the service layer, not just middleware.

### Variants

- `scopeUserQuery()` — For User model queries (EMPLOYEE scopes to self by `id`, not `userId`)
- `scopeTeamQuery()` — For Team queries (non-admins see only their team)
- `scopeBudgetQuery()` — For Budget queries (MANAGER sees their team's budgets)

---

## 7. CRUD Modules

Each CRUD module follows the same pattern: **Validation → Route → Controller → Service → Prisma**

### Company Module

Simple — users can only view/edit their **own** company:

- `GET /api/companies/me` — Get own company (all roles)
- `PUT /api/companies/me` — Update company (ADMIN only)

No `companyId` filtering needed since the route is always `/me`.

### User Module

- `GET /api/users` — List users (MANAGER sees team, ADMIN sees company)
- `POST /api/users` — Create user (ADMIN only, sets `companyId` from JWT)
- `PUT /api/users/:id` — Update user (ADMIN only, validates team exists in company)
- `DELETE /api/users/:id` — Soft delete (sets `isActive = false`, prevents self-delete)

**Password handling**: New users' passwords are hashed before storage. Passwords are **never** returned in responses (excluded via `select`).

### Team Module

- CRUD operations with ADMIN-only create/update/delete
- **Deletion guard**: Cannot delete a team that has members — must reassign them first
- All queries use `scopeTeamQuery()` for role-based filtering

### Project Module

- Company-scoped (all projects visible to all roles in the company)
- Create/update restricted to MANAGER and ADMIN
- Delete restricted to ADMIN

### Financial Record Module

- **Create**: Validates team and project belong to user's company. EMPLOYEE/MANAGER can only create for their own team.
- **Auto-budget update**: When an EXPENSE record is created, the budget's `usedAmount` for that team+month is incremented. When deleted, decremented. When updated, the old amount is reversed and the new amount is applied.
- **Period derivation**: The budget period is derived from the record's date: `date.getFullYear()-${month}` → "2026-04"
- **Filtering**: Supports `?type=`, `?category=`, `?startDate=`, `?endDate=` query parameters

### Budget Module

- `GET /api/budgets` — List budgets with derived `remainingAmount` and `utilizationPercent`
- `POST /api/budgets` — Create budget (one per team per period, enforced by `@@unique`)
- `PUT /api/budgets/:id` — Update totalBudget
- Restricted to MANAGER (own team) and ADMIN

---

## 8. Analytics Engine

All 5 analytics endpoints use Prisma's `groupBy` and `aggregate` — no raw SQL.

### `GET /api/analytics/summary`

Returns total income, total expense, and net for a date range.

**Implementation**: Two parallel `aggregate` calls (one for INCOME, one for EXPENSE) with `_sum` on `amount` and `_count`.

```
Response: { totalIncome, totalExpense, net, incomeCount, expenseCount }
```

### `GET /api/analytics/by-team`

Spending breakdown per team. Uses `groupBy(['teamId', 'type'])` to get income/expense per team, then JOINs team names via a separate query.

```
Response: [{ teamId, teamName, income, expense, net, count }]
```

### `GET /api/analytics/by-category`

Same pattern as by-team but grouped by `category`.

```
Response: [{ category, income, expense, net, count }]
```

### `GET /api/analytics/budget-vs-actual`

Compares budgeted amount vs actual spending per team. Fetches budgets + actual EXPENSE totals, then computes variance.

```
Response: [{ teamId, teamName, period, budgeted, actual, remaining, utilizationPercent, isOverBudget }]
```

### `GET /api/analytics/trends`

Month-over-month income/expense trends. Fetches all records in range, groups by month, and computes percentage change from previous month.

```
Response: [{ month, income, expense, net, incomeChange, expenseChange }]
```

### RBAC in Analytics

All analytics endpoints apply `scopeQuery(user)` before aggregating. This means:
- EMPLOYEE sees analytics for their own records only
- MANAGER sees analytics for their team
- ADMIN sees company-wide analytics

### Date Range Filtering

All endpoints accept `?startDate=` and `?endDate=` query parameters. These are converted to Prisma `date: { gte, lte }` filters.

---

## 9. Validation System

Every route input is validated by Zod before reaching the controller.

### Schema Examples

```typescript
// Registration requires minimum lengths + valid email
registerSchema = z.object({
  companyName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

// Financial record requires positive amount + valid date
createRecordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string().datetime() or z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  teamId: z.string().uuid(),
});

// Budget period must be YYYY-MM format
createBudgetSchema = z.object({
  totalBudget: z.number().positive(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
});
```

### UUID Validation

All ID parameters are validated as UUIDs:
```typescript
z.object({ id: z.string().uuid() })
```

---

## 10. Error Handling

### AppError Class

Custom error class with:
- `statusCode`: HTTP status code
- `isOperational`: `true` for expected errors (bad input, not found), `false` for bugs
- `details`: Optional extra information (e.g., Zod validation errors)

### Static Factories

```typescript
AppError.badRequest('Invalid input')     // 400
AppError.unauthorized('Bad credentials') // 401
AppError.forbidden('No permission')      // 403
AppError.notFound('User not found')      // 404
AppError.conflict('Email taken')         // 409
AppError.internal('Something broke')     // 500
```

### Standard Response Envelope

Every API response follows this format:

```json
// Success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// Error
{ "success": false, "error": { "message": "...", "details": [...] } }
```

---

## 11. Pagination

### Offset-Based (Default)

```
GET /api/records?page=2&limit=10
```

- `page` defaults to 1, `limit` defaults to 20
- `limit` is clamped to [1, 100]
- Response includes `meta: { page, limit, total, totalPages }`

### Cursor-Based (Optional)

```
GET /api/records?cursor=<lastId>&limit=10
```

- Uses Prisma's `cursor` and `skip: 1` to paginate
- Returns `meta: { limit, nextCursor, hasMore }`
- Better for large datasets — no performance degradation for deep pages

---

## 12. API Reference

### Auth (Public)

| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ companyName, name, email, password }` | Register company + admin |
| POST | `/api/auth/login` | `{ email, password }` | Login, returns tokens |
| POST | `/api/auth/refresh` | `{ refreshToken }` | Refresh access token |

### Companies (Authenticated)

| Method | Route | Roles | Description |
|---|---|---|---|
| GET | `/api/companies/me` | ALL | Get own company |
| PUT | `/api/companies/me` | ADMIN | Update company |

### Users (Authenticated)

| Method | Route | Roles | Description |
|---|---|---|---|
| GET | `/api/users` | MANAGER, ADMIN | List users (scoped) |
| GET | `/api/users/:id` | ALL | Get user (scoped) |
| POST | `/api/users` | ADMIN | Create user |
| PUT | `/api/users/:id` | ADMIN | Update user |
| DELETE | `/api/users/:id` | ADMIN | Soft-delete user |

### Teams (Authenticated)

| Method | Route | Roles | Description |
|---|---|---|---|
| GET | `/api/teams` | ALL | List teams (scoped) |
| GET | `/api/teams/:id` | ALL | Get team |
| POST | `/api/teams` | ADMIN | Create team |
| PUT | `/api/teams/:id` | ADMIN | Update team |
| DELETE | `/api/teams/:id` | ADMIN | Delete team |

### Projects (Authenticated)

| Method | Route | Roles | Description |
|---|---|---|---|
| GET | `/api/projects` | ALL | List projects |
| GET | `/api/projects/:id` | ALL | Get project |
| POST | `/api/projects` | MANAGER, ADMIN | Create project |
| PUT | `/api/projects/:id` | MANAGER, ADMIN | Update project |
| DELETE | `/api/projects/:id` | ADMIN | Delete project |

### Financial Records (Authenticated)

| Method | Route | Roles | Description |
|---|---|---|---|
| GET | `/api/records` | ALL | List records (scoped) |
| GET | `/api/records/:id` | ALL | Get record (scoped) |
| POST | `/api/records` | ALL | Create record (team-scoped) |
| PUT | `/api/records/:id` | ALL | Update record (scoped) |
| DELETE | `/api/records/:id` | ALL | Delete record (scoped) |

**Query params**: `?type=INCOME|EXPENSE`, `?category=`, `?startDate=`, `?endDate=`, `?page=`, `?limit=`

### Budgets (Authenticated)

| Method | Route | Roles | Description |
|---|---|---|---|
| GET | `/api/budgets` | MANAGER, ADMIN | List budgets (scoped) |
| POST | `/api/budgets` | MANAGER, ADMIN | Create budget |
| PUT | `/api/budgets/:id` | MANAGER, ADMIN | Update budget |

**Query params**: `?period=YYYY-MM`, `?page=`, `?limit=`

### Analytics (Authenticated)

| Method | Route | Roles | Description |
|---|---|---|---|
| GET | `/api/analytics/summary` | ALL | Total income/expense/net |
| GET | `/api/analytics/by-team` | MANAGER, ADMIN | Per-team breakdown |
| GET | `/api/analytics/by-category` | ALL | Per-category breakdown |
| GET | `/api/analytics/budget-vs-actual` | MANAGER, ADMIN | Budget vs actual |
| GET | `/api/analytics/trends` | ALL | Month-over-month trends |

**Query params**: `?startDate=`, `?endDate=`

---

## 13. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `PORT` | ❌ | `5000` | Server port |
| `JWT_SECRET` | ✅ | — | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ❌ | auto-generated | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRY` | ❌ | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | ❌ | `7d` | Refresh token lifetime |
| `NODE_ENV` | ❌ | `development` | Environment (development/production/test) |

---

## Design Decisions & Trade-offs

### 1. Why denormalize `companyId` on FinancialRecord?

**Trade-off**: Data duplication vs query performance.

Without denormalization, querying "all expenses for company X" requires a JOIN through User or Team. For analytics queries aggregating thousands of records, this adds latency. By storing `companyId` directly on FinancialRecord, analytics queries use single-table composite indexes.

### 2. Why soft delete for users?

**Trade-off**: Data integrity vs storage. Soft delete (`isActive = false`) preserves referential integrity — financial records still reference the user who created them. Hard delete would require cascading or nullifying foreign keys.

### 3. Why Zod over class-validator?

Zod provides compile-time type inference (`z.infer<typeof schema> → TypeScript type`), works without decorators (no reflect-metadata), and has smaller bundle size. With Zod 4, performance is improved significantly.

### 4. Why separate RefreshToken model?

A field on User (`refreshToken: string`) would only support one device. A separate model supports any number of concurrent sessions. Token rotation (delete old, create new) prevents replay attacks.

### 5. Why Express 5?

Express 5 natively catches async errors in route handlers and middleware. This eliminates the need for `asyncHandler` wrappers that Express 4 required, reducing boilerplate and preventing forgotten error handling.
