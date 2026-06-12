# ShipLink — Backend CLAUDE.md

## Overview

This is the NestJS backend API for ShipLink. It serves all client apps:
- `apps/portal` — company-facing admin (Next.js)
- `apps/admin` — super admin (Next.js)
- `apps/web` — public company website (Next.js)

All business logic lives here. Apps are thin clients that consume this API.

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | NestJS |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| Password hashing | bcrypt |
| Validation | class-validator + class-transformer |
| Config | @nestjs/config (.env) |
| File uploads | Multer → AWS S3 or Cloudinary |
| Mailing | Nodemailer or @nestjs-modules/mailer |
| Testing | Jest |

---

## User Model Split: Internal vs External

ShipLink has two distinct categories of people, stored in **two separate tables**:

### `User` table — internal platform users (require login)
- `SUPER_ADMIN` — ShipLink platform team
- `COMPANY_ADMIN` — company owner/manager, full access to their company
- `COMPANY_STAFF` — company employees, access via dynamic `Role` permissions
- `AGENT` — trusted regional reps (1:1 linked to an `Agent` record for extra data)

### `Customer` table — external, the people buying products
- Belongs to a company (`companyId`)
- May or may not have login access (`passwordHash` is nullable — many customers are onboarded via an agent without ever setting a password in MVP)
- Has shipment requests, payments, contracts
- Has fields a `User` never needs: Ghana Card number, ID documents, shipping address

**Why split them:** Customers and internal users have fundamentally different data shapes, different auth requirements, and different permission models. Cramming both into one `User` table leads to a pile of nullable fields and confusing permission logic (`customers: ['read']` should mean "staff can view customer records," not "staff can manage customer login accounts").

---

## Project Structure

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts       # /auth/login handles BOTH User and Customer
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── system-role.guard.ts
│   │   │   └── permissions.guard.ts
│   │   ├── decorators/
│   │   │   ├── require-permissions.decorator.ts
│   │   │   ├── system-roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   └── dto/
│   │       ├── login.dto.ts          # includes optional userType: 'user' | 'customer'
│   │       └── register.dto.ts
│   ├── admin/
│   │   ├── admin.module.ts
│   │   ├── admin.service.ts          # shared logic over the User table
│   │   ├── admin-users.controller.ts # @ApiTags('Admin Users') — SUPER_ADMIN only — /admin-users
│   │   ├── staff.controller.ts       # @ApiTags('Company Staff') — COMPANY_ADMIN + COMPANY_STAFF — /companies/:id/staff
│   │   └── dto/
│   │       ├── create-staff.dto.ts
│   │       └── create-admin.dto.ts
│   ├── companies/
│   │   ├── companies.module.ts
│   │   ├── companies.controller.ts   # @ApiTags('Companies')
│   │   ├── companies.service.ts
│   │   └── dto/
│   ├── roles/
│   │   ├── roles.module.ts
│   │   ├── roles.controller.ts       # @ApiTags('Roles') — /companies/:id/roles
│   │   ├── roles.service.ts
│   │   └── dto/
│   │       ├── create-role.dto.ts
│   │       └── assign-role.dto.ts
│   ├── agents/
│   │   ├── agents.module.ts
│   │   ├── agents.controller.ts      # @ApiTags('Agents') — /companies/:id/agents
│   │   ├── agents.service.ts
│   │   └── dto/
│   ├── customers/
│   │   ├── customers.module.ts
│   │   ├── customers.controller.ts   # @ApiTags('Customers') — /companies/:id/customers
│   │   ├── customers.service.ts
│   │   └── dto/
│   ├── shipments/
│   │   ├── shipments.module.ts
│   │   ├── shipments.controller.ts
│   │   ├── shipments.service.ts
│   │   └── dto/
│   ├── verification/
│   │   ├── verification.module.ts
│   │   ├── verification.controller.ts
│   │   ├── verification.service.ts
│   │   └── dto/
│   ├── payments/
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   └── dto/
│   ├── contracts/
│   │   ├── contracts.module.ts
│   │   ├── contracts.controller.ts
│   │   ├── contracts.service.ts
│   │   └── dto/
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   └── notifications.service.ts
│   └── common/
│       ├── decorators/
│       ├── filters/
│       │   └── http-exception.filter.ts
│       ├── interceptors/
│       │   └── response.interceptor.ts
│       ├── pipes/
│       └── types/
│           └── express.d.ts   # augment Request with user
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/
├── .env
├── .env.example
└── package.json
```

---

## Current Build Phase

Building modules in this order. Check off as completed.

- [ ] **1. Project setup** — NestJS scaffold, Prisma connected, config module, global pipes/filters
- [ ] **2. Auth module** — register, login (User + Customer), JWT access + refresh, guards, decorators
- [ ] **3. Companies module** — registration, super admin approve/suspend, company profile, subdomain, auto-create owner (`COMPANY_ADMIN`) + default "Full Access" role on onboarding
- [ ] **4. Admin module** — `admin-users.controller.ts` (SUPER_ADMIN CRUD), `staff.controller.ts` (owner + staff CRUD, invite flow, role assignment)
- [ ] **5. Roles module** — dynamic role + permission creation, assign roles to staff
- [ ] **6. Agents module** — register agents, region/city, trust score, referral code
- [ ] **7. Customers module** — Customer CRUD, scoped by company
- [ ] **8. Shipments module** — create request, status lifecycle, assign agent
- [ ] **9. Verification module** — session creation, agent uploads, admin approval
- [ ] **10. Payments module** — record payments, agent confirmation, append-only ledger
- [ ] **11. Contracts module** — file upload, link to shipment, signed status
- [ ] **12. Notifications module** — email on key events

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SystemRole {
  SUPER_ADMIN      // ShipLink platform admin — full access, all companies
  COMPANY_ADMIN    // Full access to their own company — can manage roles
  COMPANY_STAFF    // Access determined entirely by their assigned dynamic Role
  AGENT            // Verification + assigned customers only
}

enum CompanyStatus {
  PENDING
  APPROVED
  SUSPENDED
}

enum ShipmentStatus {
  REQUESTED
  APPROVED
  AWAITING_PAYMENT
  AT_WAREHOUSE
  IN_CONTAINER
  SHIPPED
  AT_PORT
  CLEARING_CUSTOMS
  READY_FOR_PICKUP
  DELIVERED
}

enum PaymentStatus {
  PENDING
  PARTIAL
  CONFIRMED
  REFUNDED
}

enum VerificationStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

// ============================================
// INTERNAL USERS — require login, platform/company staff
// ============================================
model User {
  id           String     @id @default(uuid())
  systemRole   SystemRole
  firstName    String
  lastName     String
  email        String     @unique
  phone        String?
  passwordHash String
  isActive     Boolean    @default(true)
  companyId    String?              // null for SUPER_ADMIN
  company      Company?   @relation(fields: [companyId], references: [id])
  roleId       String?              // assigned dynamic Role — only for COMPANY_STAFF
  role         Role?      @relation(fields: [roleId], references: [id])
  agent        Agent?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

// Dynamic role created by company admin or staff with roles:manage permission
model Role {
  id          String           @id @default(uuid())
  name        String           // e.g. "Freight Manager", "Accounts Officer"
  description String?
  companyId   String
  company     Company          @relation(fields: [companyId], references: [id])
  permissions RolePermission[]
  users       User[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([name, companyId])  // role names unique within a company
}

// One row per resource granted to a role
model RolePermission {
  id       String   @id @default(uuid())
  roleId   String
  role     Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  resource String   // e.g. "shipments", "payments", "agents", "roles", "customers"
  actions  String[] // e.g. ["create", "read", "update", "delete"]

  @@unique([roleId, resource])  // one permission row per resource per role
}

model Company {
  id           String            @id @default(uuid())
  name         String
  subdomain    String            @unique  // e.g. "gh-motors" → gh-motors.shiplink.com
  customDomain String?           @unique  // future paid feature
  status       CompanyStatus     @default(PENDING)
  email        String?
  phone        String?
  address      String?
  logoUrl      String?
  users        User[]
  agents       Agent[]
  customers    Customer[]
  shipments    ShipmentRequest[]
  roles        Role[]
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
}

model Agent {
  id                   String                @id @default(uuid())
  userId               String                @unique
  user                 User                  @relation(fields: [userId], references: [id])
  companyId            String
  company              Company               @relation(fields: [companyId], references: [id])
  region               String
  city                 String
  profession           String?
  referralCode         String                @unique
  gpsCoordinates       String?
  trustScore           Float                 @default(5.0)
  verificationStatus   VerificationStatus    @default(PENDING)
  isAvailable          Boolean               @default(true)
  shipmentRequests     ShipmentRequest[]
  verificationSessions VerificationSession[]
  payments             Payment[]
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
}

// ============================================
// EXTERNAL — the people buying products
// May or may not have login access (passwordHash nullable)
// ============================================
model Customer {
  id              String   @id @default(uuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  firstName       String
  lastName        String
  phone           String
  email           String?  @unique
  passwordHash    String?  // null until/unless customer self-registers
  ghanaCardNumber String?
  address         String?
  region          String?
  city            String?
  shipmentRequests ShipmentRequest[]
  payments        Payment[]
  contracts       Contract[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ShipmentRequest {
  id                  String              @id @default(uuid())
  customerId          String
  customer            Customer            @relation(fields: [customerId], references: [id])
  companyId           String
  company             Company             @relation(fields: [companyId], references: [id])
  shipmentType        String
  productName         String
  description         String?
  estimatedCost       Float?
  currentStatus       ShipmentStatus      @default(REQUESTED)
  assignedAgentId     String?
  assignedAgent       Agent?              @relation(fields: [assignedAgentId], references: [id])
  referredByCode      String?             // agent referral code from website
  shipment            Shipment?
  payments            Payment[]
  contract            Contract?
  verificationSession VerificationSession?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}

model Shipment {
  id                String          @id @default(uuid())
  shipmentRequestId String          @unique
  shipmentRequest   ShipmentRequest @relation(fields: [shipmentRequestId], references: [id])
  containerNumber   String?
  departureDate     DateTime?
  arrivalDate       DateTime?
  currentLocation   String?
  customsStatus     String?
  deliveryStatus    String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

model VerificationSession {
  id                String             @id @default(uuid())
  customerId        String             // references Customer
  agentId           String
  agent             Agent              @relation(fields: [agentId], references: [id])
  shipmentRequestId String             @unique
  shipmentRequest   ShipmentRequest    @relation(fields: [shipmentRequestId], references: [id])
  scheduledDate     DateTime?
  status            VerificationStatus @default(PENDING)
  notes             String?
  documents         Document[]
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

model Payment {
  id                   String          @id @default(uuid())
  customerId           String
  customer             Customer        @relation(fields: [customerId], references: [id])
  shipmentRequestId    String
  shipmentRequest      ShipmentRequest @relation(fields: [shipmentRequestId], references: [id])
  agentId              String?
  agent                Agent?          @relation(fields: [agentId], references: [id])
  amount               Float
  currency             String          @default("GHS")
  paymentMethod        String?
  transactionReference String?
  paymentStatus        PaymentStatus   @default(PENDING)
  confirmedByAgent     Boolean         @default(false)
  confirmedAt          DateTime?
  createdAt            DateTime        @default(now())
  // No updatedAt — payments are append-only, never updated
}

model Contract {
  id                 String             @id @default(uuid())
  shipmentRequestId  String             @unique
  shipmentRequest    ShipmentRequest    @relation(fields: [shipmentRequestId], references: [id])
  customerId         String
  customer           Customer           @relation(fields: [customerId], references: [id])
  documentUrl        String?
  signedAt           DateTime?
  verificationStatus VerificationStatus @default(PENDING)
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
}

model Document {
  id                    String              @id @default(uuid())
  verificationSessionId String
  verificationSession   VerificationSession @relation(fields: [verificationSessionId], references: [id])
  fileUrl               String
  fileType              String              // ghana_card, passport, drivers_license, signed_contract, photo
  uploadedById          String
  createdAt             DateTime            @default(now())
}
```

---

## Dual Auth (User vs Customer)

### Login flow
`POST /auth/login` accepts `email`, `password`, and optional `userType: 'user' | 'customer'`.

```typescript
// auth.service.ts — login logic
async login(dto: LoginDto) {
  // 1. Try User table first (covers super admin, company admin, staff, agents)
  let account = await this.usersService.findByEmail(dto.email)
  let accountType: 'user' | 'customer' = 'user'

  // 2. If not found, try Customer table
  if (!account) {
    account = await this.customersService.findByEmail(dto.email)
    accountType = 'customer'
  }

  if (!account || !account.passwordHash) {
    throw new UnauthorizedException()
  }

  // 3. Verify password, issue JWT with accountType embedded
}
```

### JWT payload
```typescript
interface JwtPayload {
  sub: string                    // userId or customerId
  accountType: 'user' | 'customer'
  systemRole?: SystemRole        // only present if accountType === 'user'
  companyId: string
  roleId?: string                // only for COMPANY_STAFF
  isActive: boolean
}
```

### Guard behavior
- `JwtAuthGuard` validates the token regardless of `accountType`
- `SystemRoleGuard` and `PermissionsGuard` only apply to `accountType === 'user'` — reject or skip for customers
- Customer-facing routes (own shipments, own payments) use a separate `CustomerGuard` that checks `accountType === 'customer'` and matches `sub` to the resource's `customerId`

### MVP note on customer accounts
Most customers in MVP are onboarded **by an agent** without ever setting a password — `passwordHash` stays `null`. They can still be tracked, have shipments, contracts, and payments recorded against their `Customer` row. Login/self-service portal access is optional and can be added later by setting a password via an invite link.

---

## Dynamic RBAC System

### Concept
`COMPANY_ADMIN` is the **company owner** — exactly one per company, created during onboarding (not via the staff endpoint), and always bypasses permission checks. It exists to represent account ownership (billing, legal agreement, account deletion) — not as a role that gets assigned to multiple people.

`SUPER_ADMIN` also bypasses all permission checks (platform-level).

`AGENT` has fixed restricted access handled by a dedicated guard.

`COMPANY_STAFF` access is 100% determined by their assigned `Role` and its `RolePermission` rows. **"Full control" for a staff member is achieved by assigning them a Role with every permission on every resource** — not by creating a second `COMPANY_ADMIN`. This keeps the owner structurally unique while letting them delegate complete operational control to trusted staff, revocably.

### Available resources
```typescript
export const RESOURCES = [
  'shipments',
  'payments',
  'agents',
  'customers',
  'contracts',
  'verifications',
  'invoices',
  'roles',       // grants ability to create/edit roles — acts as role manager
  'staff',       // grants ability to manage other staff accounts
  'reports',
] as const

export type Resource = typeof RESOURCES[number]
export type Action = 'create' | 'read' | 'update' | 'delete'
```

### Permission decorator
```typescript
// Require specific permission on a route
@RequirePermissions({ resource: 'shipments', actions: ['read'] })
@Get()
findAll() {}

// Multiple permissions (user must have ALL)
@RequirePermissions(
  { resource: 'shipments', actions: ['read'] },
  { resource: 'payments', actions: ['read'] }
)
```

### PermissionsGuard logic
```typescript
// Guard runs after JwtAuthGuard
// 1. If accountType !== 'user' → reject (customers don't have permission-based access)
// 2. If systemRole === SUPER_ADMIN or COMPANY_ADMIN → allow
// 3. If systemRole === AGENT → handled by separate AgentGuard
// 4. If systemRole === COMPANY_STAFF:
//    - Load user's Role with RolePermission[] (cache this — don't query per request)
//    - Check each required permission against the loaded permissions
//    - If any required permission is missing → throw ForbiddenException
```

### Permission check helper
```typescript
function hasPermission(
  rolePermissions: RolePermission[],
  resource: Resource,
  actions: Action[]
): boolean {
  const perm = rolePermissions.find(p => p.resource === resource)
  if (!perm) return false
  return actions.every(action => perm.actions.includes(action))
}
```

### Who can manage roles
Role management is itself a permission — no special flag needed:
```
{ resource: 'roles', actions: ['create', 'read', 'update', 'delete'] }
```
A `COMPANY_ADMIN` can grant this to any staff member. That staff member can then create and edit roles, but **cannot grant permissions they don't have themselves** (enforce this in `RolesService`).

### Default "Full Access" role
When a company is created (and `COMPANY_ADMIN` account provisioned), a default `Role` is auto-generated:

```typescript
// companies.service.ts — on company creation
async createDefaultRoles(companyId: string) {
  await this.rolesService.create({
    companyId,
    name: 'Full Access',
    description: 'Complete control — equivalent to the owner, except billing/account-level actions',
    permissions: RESOURCES.map(resource => ({
      resource,
      actions: ['create', 'read', 'update', 'delete'],
    })),
  })
}
```

The owner can assign this role to a trusted staff member to give them full operational control, or clone/edit it to create a slightly restricted version (e.g. remove `staff:delete` so they can't remove themselves or others).

### Staff invite flow
There is **no `systemRole` field in the staff creation request** — every staff member created via `staff.controller.ts` is `systemRole: COMPANY_STAFF` with a required `roleId`.

```typescript
// CreateStaffDto
{
  firstName: string
  lastName: string
  email: string
  phone?: string
  roleId: string   // required — every staff member must have a Role
}
```

1. Company admin (owner) or staff with `roles:create` creates additional Roles as needed (or uses the default "Full Access" role)
2. Owner (or staff with `staff:create`) invites a staff member by email, selects their Role
3. Staff receives invite email, sets password
4. On login, JWT includes `roleId` — PermissionsGuard loads permissions from DB
5. Role can be reassigned at any time by anyone with `roles:update` permission — this is how "promote to full access" or "demote" works
6. Staff can be deactivated (`isActive: false`) — blocked at JWT validation
7. The owner (`COMPANY_ADMIN`) can never be deactivated, deleted, or reassigned via these endpoints — only via account-level operations (e.g. company deletion, ownership transfer — Phase 2)

---

## Auth Rules

### Endpoints (public — no token required)
- `POST /auth/register`
- `POST /auth/login` — handles both User and Customer accounts
- `POST /auth/refresh`

### System roles and access
| SystemRole | Access |
|---|---|
| `SUPER_ADMIN` | All endpoints, all companies — bypasses all permission checks |
| `COMPANY_ADMIN` | **One per company** — the owner. Full access, bypasses permission checks. Created at onboarding only. |
| `COMPANY_STAFF` | Only what their assigned Role's permissions allow (can be "Full Access" — still revocable, unlike the owner) |
| `AGENT` | Assigned customers and verification sessions only |

### Customer access (separate guard, not permission-based)
| Account type | Access |
|---|---|
| `Customer` | Own shipments, payments, contracts only — matched via `customerId` |

### Guards pattern
```typescript
// Fixed system role check (SUPER_ADMIN / COMPANY_ADMIN only routes)
@UseGuards(JwtAuthGuard, SystemRoleGuard)
@SystemRoles(SystemRole.SUPER_ADMIN)
@Get()
findAll() {}

// Permission-based check (COMPANY_STAFF routes)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions({ resource: 'shipments', actions: ['read'] })
@Get()
findAll() {}

// Customer-facing routes
@UseGuards(JwtAuthGuard, CustomerGuard)
@Get('my-shipments')
findMyShipments(@CurrentUser() customer) {}
```

### Current user decorator
Always use `@CurrentUser()` — never trust body/query params for identity. Returns `{ id, accountType, systemRole?, companyId, roleId? }`.

---

## API Conventions

- Base path: `/api/v1`
- All routes versioned from day one
- Swagger: every controller gets a distinct `@ApiTags()` so internal users, staff, agents, and customers appear as clearly separated sections — even where they share a service
- Response envelope:
```json
{
  "success": true,
  "data": {},
  "message": "optional"
}
```
- Error envelope:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": []
}
```
- Use global `ResponseInterceptor` and `HttpExceptionFilter` in `main.ts`
- Dates: always return ISO 8601 strings
- IDs: UUIDs everywhere, never sequential integers exposed in API

---

## Swagger Tag Map

| Tag | Controller | Route | Table(s) |
|---|---|---|---|
| `Auth` | `auth.controller.ts` | `/auth/*` | User + Customer |
| `Companies` | `companies.controller.ts` | `/companies` | Company |
| `Admin Users` | `admin-users.controller.ts` | `/admin-users` | User (SUPER_ADMIN only) |
| `Company Staff` | `staff.controller.ts` | `/companies/:companyId/staff` | User (COMPANY_ADMIN + COMPANY_STAFF) + Role |
| `Roles` | `roles.controller.ts` | `/companies/:companyId/roles` | Role, RolePermission |
| `Agents` | `agents.controller.ts` | `/companies/:companyId/agents` | Agent (+ linked User) |
| `Customers` | `customers.controller.ts` | `/companies/:companyId/customers` | Customer |
| `Shipments` | `shipments.controller.ts` | `/companies/:companyId/shipments` | ShipmentRequest, Shipment |
| `Verification` | `verification.controller.ts` | `/companies/:companyId/verifications` | VerificationSession, Document |
| `Payments` | `payments.controller.ts` | `/companies/:companyId/payments` | Payment |
| `Contracts` | `contracts.controller.ts` | `/companies/:companyId/contracts` | Contract |

Note: `Company Staff` returns **both** the owner (`COMPANY_ADMIN`) and `COMPANY_STAFF` members — from the company's perspective, these are all "team members." The owner row is read-only in this list (cannot be edited, deactivated, or removed via this endpoint).

---

## Naming Conventions

- Files: `kebab-case` (e.g. `shipment-request.service.ts`)
- Classes: `PascalCase`
- Variables/functions: `camelCase`
- Database columns: `camelCase` in Prisma schema (maps to `snake_case` in PostgreSQL via `@@map`)
- DTOs: suffix with `Dto` (e.g. `CreateShipmentRequestDto`)
- Services: suffix with `Service`
- Controllers: suffix with `Controller`

---

## Key Business Rules (enforce in service layer)

- `SUPER_ADMIN` and `COMPANY_ADMIN` bypass all permission checks — never run permission logic for them
- A `Customer` is a completely separate identity from a `User` — never assume an ID can be looked up in both tables interchangeably; `accountType` on the JWT determines which table to query
- A shipment request cannot advance to `APPROVED` until a verification session is `COMPLETED`
- Payments are **append-only** — never update a payment row, always insert a new one
- An agent's `referralCode` is auto-generated on creation and never changes
- `companyId` must be validated on every request — a company admin cannot access another company's data
- A customer can only have one shipment request in `REQUESTED` or `APPROVED` status at a time
- Agent assignment must prefer agents with `isAvailable: true` and higher `trustScore`
- A staff member cannot grant a permission to a role that they themselves do not have
- Role names must be unique within a company (`@@unique([name, companyId])`)
- A deactivated user (`isActive: false`) must be rejected at JWT validation — do not wait for a guard
- When a Role is deleted, all staff assigned to it must either be reassigned or deactivated — never leave a staff user with a null `roleId` and `systemRole === COMPANY_STAFF`
- Customers with `passwordHash: null` cannot log in — they exist as records only, managed entirely through staff/agent actions
- `COMPANY_ADMIN` (owner) accounts are never created via `staff.controller.ts` — only during company onboarding, exactly one per company
- The "Full Access" default Role is created automatically when a company is onboarded — do not require the owner to build it manually
- A `COMPANY_STAFF` user with the "Full Access" role is still subject to deactivation/role-reassignment by the owner — full permissions do not make them un-removable, unlike the actual `COMPANY_ADMIN`

---

## Environment Variables

```env
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/shiplink
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AWS_BUCKET_NAME=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
APP_URL=http://localhost:3000
```

---

## Out of Scope (do not implement yet)

- Payment gateway integrations (Paystack, Mobile Money, Hubtel)
- WhatsApp / SMS notifications
- WebSocket / realtime updates
- GIS map features
- QR code verification
- Mobile app
- AI features
- Customer self-service portal login (Phase 2 — password setup via invite link)