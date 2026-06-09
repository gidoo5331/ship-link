# ShipLink — Backend CLAUDE.md

## Overview

This is the NestJS backend API for ShipLink. It serves all client apps:
- `apps/portal` — company-facing admin (Next.js)
- `apps/admin` — super admin (Next.js)
- `apps/web` — public company website (Next.js, coming later)

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

## Project Structure

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── permissions.guard.ts
│   │   ├── decorators/
│   │   │   ├── require-permissions.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   ├── companies/
│   │   ├── companies.module.ts
│   │   ├── companies.controller.ts
│   │   ├── companies.service.ts
│   │   └── dto/
│   ├── roles/
│   │   ├── roles.module.ts
│   │   ├── roles.controller.ts
│   │   ├── roles.service.ts
│   │   └── dto/
│   │       ├── create-role.dto.ts
│   │       └── assign-role.dto.ts
│   ├── agents/
│   │   ├── agents.module.ts
│   │   ├── agents.controller.ts
│   │   ├── agents.service.ts
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
- [ ] **2. Auth module** — register, login, JWT access + refresh, PermissionsGuard, decorators
- [ ] **3. Companies module** — registration, super admin approve/suspend, company profile
- [ ] **4. Users module** — CRUD, scoped by company, staff invite flow, role assignment
- [ ] **5. Roles module** — dynamic role + permission creation, assign roles to staff
- [ ] **6. Agents module** — register agents, region/city, trust score, referral code
- [ ] **7. Shipments module** — create request, status lifecycle, assign agent
- [ ] **8. Verification module** — session creation, agent uploads, admin approval
- [ ] **9. Payments module** — record payments, agent confirmation, append-only ledger
- [ ] **10. Contracts module** — file upload, link to shipment, signed status
- [ ] **11. Notifications module** — email on key events

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
  CUSTOMER         // Own shipments, payments, contracts only
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

model User {
  id           String     @id @default(uuid())
  systemRole   SystemRole
  firstName    String
  lastName     String
  email        String     @unique
  phone        String?
  passwordHash String
  isActive     Boolean    @default(true)
  companyId    String?
  company      Company?   @relation(fields: [companyId], references: [id])
  roleId       String?    // assigned dynamic Role — only for COMPANY_STAFF
  role         Role?      @relation(fields: [roleId], references: [id])
  agent        Agent?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Company {
  id          String            @id @default(uuid())
  name        String
  subdomain   String            @unique  // e.g. "gh-motors" → gh-motors.shiplink.com
  customDomain String?          @unique  // future paid feature
  status      CompanyStatus     @default(PENDING)
  email       String?
  phone       String?
  address     String?
  logoUrl     String?
  users       User[]
  agents      Agent[]
  shipments   ShipmentRequest[]
  roles       Role[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
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

model ShipmentRequest {
  id                  String              @id @default(uuid())
  customerId          String
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
  customerId        String
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

## Dynamic RBAC System

### Concept
`COMPANY_ADMIN` and `SUPER_ADMIN` have fixed full access and bypass permission checks entirely.
`AGENT` and `CUSTOMER` have fixed restricted access handled by dedicated guards.
`COMPANY_STAFF` access is 100% determined by their assigned `Role` and its `RolePermission` rows.

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
// 1. If user.systemRole === SUPER_ADMIN or COMPANY_ADMIN → allow
// 2. If user.systemRole === AGENT → handled by separate AgentGuard
// 3. If user.systemRole === COMPANY_STAFF:
//    - Load user's Role with RolePermission[] (cache this — don't query per request)
//    - Check each required permission against the loaded permissions
//    - If any required permission is missing → throw ForbiddenException
```

### JWT payload
Include enough to avoid a DB call on every request:
```typescript
interface JwtPayload {
  sub: string           // userId
  systemRole: SystemRole
  companyId: string
  roleId?: string       // only for COMPANY_STAFF
  isActive: boolean
}
```

### Permission check helper (use in PermissionsGuard)
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

### Staff invite flow
1. Company admin (or staff with `roles:create`) creates a Role with chosen permissions
2. Company admin invites staff member by email, selects their Role
3. Staff receives invite email, sets password
4. On login, JWT includes `roleId` — PermissionsGuard loads permissions from DB
5. Role can be reassigned at any time by anyone with `roles:update` permission
6. Staff can be deactivated (`isActive: false`) — blocked at JWT validation

---

## Auth Rules

### Endpoints (public — no token required)
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

### System roles and access
| SystemRole | Access |
|---|---|
| `SUPER_ADMIN` | All endpoints, all companies — bypasses all permission checks |
| `COMPANY_ADMIN` | Full access to their own company — bypasses permission checks |
| `COMPANY_STAFF` | Only what their assigned Role's permissions allow |
| `AGENT` | Assigned customers and verification sessions only |
| `CUSTOMER` | Own shipments, payments, contracts only |

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

// Mixed — admins always pass, staff need the permission
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions({ resource: 'payments', actions: ['read', 'update'] })
@Patch(':id')
update() {}
```

### Current user decorator
Always use `@CurrentUser()` — never trust body/query params for user identity.

---

## API Conventions

- Base path: `/api/v1`
- All routes versioned from day one
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