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
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
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
- [ ] **2. Auth module** — register, login, JWT access + refresh, RolesGuard, decorators
- [ ] **3. Companies module** — registration, super admin approve/suspend, company profile
- [ ] **4. Users module** — CRUD, scoped by company, staff invite flow, staffRole assignment
- [ ] **5. Agents module** — register agents, region/city, trust score, referral code
- [ ] **6. Shipments module** — create request, status lifecycle, assign agent
- [ ] **7. Verification module** — session creation, agent uploads, admin approval
- [ ] **8. Payments module** — record payments, agent confirmation, append-only ledger
- [ ] **9. Contracts module** — file upload, link to shipment, signed status
- [ ] **10. Notifications module** — email on key events

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

enum Role {
  SUPER_ADMIN
  COMPANY_ADMIN
  COMPANY_STAFF
  AGENT
  CUSTOMER
}

enum StaffRole {
  LOGISTICS   // create + update shipments and statuses, view payments (read-only)
  FINANCE     // view + record payments and invoices, read-only shipments
  SUPPORT     // read-only access to everything, can add notes on shipments
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

model User {
  id           String     @id @default(uuid())
  role         Role
  staffRole    StaffRole? // only set when role is COMPANY_STAFF
  firstName    String
  lastName     String
  email        String     @unique
  phone        String?
  passwordHash String
  isActive     Boolean    @default(true)
  companyId    String?
  company      Company?   @relation(fields: [companyId], references: [id])
  agent        Agent?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Company {
  id          String        @id @default(uuid())
  name        String
  status      CompanyStatus @default(PENDING)
  email       String?
  phone       String?
  address     String?
  logoUrl     String?
  users       User[]
  agents      Agent[]
  shipments   ShipmentRequest[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model Agent {
  id                 String             @id @default(uuid())
  userId             String             @unique
  user               User               @relation(fields: [userId], references: [id])
  companyId          String
  company            Company            @relation(fields: [companyId], references: [id])
  region             String
  city               String
  profession         String?
  referralCode       String             @unique
  gpsCoordinates     String?
  trustScore         Float              @default(5.0)
  verificationStatus VerificationStatus @default(PENDING)
  isAvailable        Boolean            @default(true)
  shipmentRequests   ShipmentRequest[]
  verificationSessions VerificationSession[]
  payments           Payment[]
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
}

model ShipmentRequest {
  id              String         @id @default(uuid())
  customerId      String
  companyId       String
  company         Company        @relation(fields: [companyId], references: [id])
  shipmentType    String
  productName     String
  description     String?
  estimatedCost   Float?
  currentStatus   ShipmentStatus @default(REQUESTED)
  assignedAgentId String?
  assignedAgent   Agent?         @relation(fields: [assignedAgentId], references: [id])
  referredByCode  String?        // agent referral code from website
  shipment        Shipment?
  payments        Payment[]
  contract        Contract?
  verificationSession VerificationSession?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
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
  id                   String        @id @default(uuid())
  customerId           String
  shipmentRequestId    String
  shipmentRequest      ShipmentRequest @relation(fields: [shipmentRequestId], references: [id])
  agentId              String?
  agent                Agent?        @relation(fields: [agentId], references: [id])
  amount               Float
  currency             String        @default("GHS")
  paymentMethod        String?
  transactionReference String?
  paymentStatus        PaymentStatus @default(PENDING)
  confirmedByAgent     Boolean       @default(false)
  confirmedAt          DateTime?
  createdAt            DateTime      @default(now())
  // No updatedAt — payments are append-only, never updated
}

model Contract {
  id                String          @id @default(uuid())
  shipmentRequestId String          @unique
  shipmentRequest   ShipmentRequest @relation(fields: [shipmentRequestId], references: [id])
  customerId        String
  documentUrl       String?
  signedAt          DateTime?
  verificationStatus VerificationStatus @default(PENDING)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

model Document {
  id                    String               @id @default(uuid())
  verificationSessionId String
  verificationSession   VerificationSession  @relation(fields: [verificationSessionId], references: [id])
  fileUrl               String
  fileType              String               // ghana_card, passport, drivers_license, signed_contract, photo
  uploadedById          String
  createdAt             DateTime             @default(now())
}
```

---

## Auth Rules

### Endpoints (public — no token required)
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

### Roles and access
| Role | Access |
|---|---|
| `SUPER_ADMIN` | All endpoints, all companies |
| `COMPANY_ADMIN` | Full access to their company's data |
| `COMPANY_STAFF` | Limited access determined by `staffRole` preset |
| `AGENT` | Assigned customers and verification sessions only |
| `CUSTOMER` | Their own shipments, payments, contracts |

### Staff role presets
| StaffRole | Shipments | Payments | Verifications | Agents | Customers |
|---|---|---|---|---|---|
| `LOGISTICS` | Read + Write | Read only | Read only | Read only | Read only |
| `FINANCE` | Read only | Read + Write | Read only | None | Read only |
| `SUPPORT` | Read only | None | Read only | None | Read only |

### Guards pattern
```typescript
// Single role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COMPANY_ADMIN)
@Get()
findAll() {}

// Multiple roles allowed
@Roles(Role.COMPANY_ADMIN, Role.COMPANY_STAFF)
@Get()
findAll() {}

// Staff with specific preset check (use inside service layer)
if (user.role === Role.COMPANY_STAFF && user.staffRole !== StaffRole.LOGISTICS) {
  throw new ForbiddenException();
}
```

### Staff invite flow
- Company admin invites a staff member by email
- Picks a `staffRole` preset (Logistics / Finance / Support)
- Staff member receives invite email, sets their password
- `staffRole` can be changed by company admin at any time
- Company admin can deactivate a staff account without deleting it

### Current user decorator
Always use `@CurrentUser()` to get the authenticated user — never trust body/query params for user identity.

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

- A shipment request cannot advance to `APPROVED` until a verification session is `COMPLETED`
- Payments are **append-only** — never update a payment row, always insert a new one
- An agent's `referralCode` is auto-generated on creation and never changes
- `companyId` must be validated on every request — a company admin cannot access another company's data
- A customer can only have one shipment request in `REQUESTED` or `APPROVED` status at a time
- Agent assignment must prefer agents with `isAvailable: true` and higher `trustScore`
- `staffRole` is only meaningful when `role === COMPANY_STAFF` — ignore it for all other roles
- Staff permission checks happen in the **service layer**, not just the guard — guards check role, services check staffRole
- Only `COMPANY_ADMIN` can invite staff, change their `staffRole`, or deactivate them
- A deactivated staff account must be blocked at the JWT validation stage — add an `isActive` boolean to `User`

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