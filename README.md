# 🚿 Car Wash Booking API

> Production-grade REST API for a **one-provider mobile car wash business**.

This project was built for a very real customer: **my grandfather's home car wash
service**. He drives to each customer's address and washes their car himself — so
there is exactly **one provider** and the schedule must never double-book. That
single constraint drives the most interesting logic in the codebase: the
**anti-overbooking engine** and the **availability calculator**.

It is also a portfolio piece, so the code quality, layering, type-safety and tests
matter as much as the feature set.

---

## ✨ Features

- **JWT authentication** (register / login) with bcrypt-hashed passwords.
- **Service catalogue** — public reads, protected writes, optional active filter.
- **Customer management** — private, paginated.
- **Bookings** with real business rules:
  - 🚫 **No overbooking** — a single provider can't be in two places; overlapping
    bookings are rejected with `409`.
  - ⏰ **No bookings in the past** (`400`).
  - 💤 **No bookings on inactive services** (`400`).
  - 🧮 **Server-derived `endTime`** = `startTime + service.durationMinutes`.
  - 🔁 **Validated status transitions** (`PENDING → CONFIRMED → COMPLETED`, or
    `→ CANCELLED` from any non-terminal state).
- **Availability engine** — given a day and a service, returns the free time slots,
  excluding anything already booked.
- **Consistent response envelope**, centralized error handling, fail-fast config
  validation and graceful shutdown.

---

## 🧱 Tech Stack

| Concern        | Choice                              |
| -------------- | ----------------------------------- |
| Language       | TypeScript (strict mode)            |
| Runtime        | Node.js ≥ 18                        |
| Web framework  | Express 4                           |
| ORM            | Prisma                              |
| Database       | MySQL 8                             |
| Validation     | Zod                                 |
| Auth           | jsonwebtoken (JWT) + bcryptjs       |
| Testing        | Vitest + Supertest (Prisma mocked)  |
| Container      | Docker + docker-compose             |
| CI             | GitHub Actions                      |

---

## 🏛️ Architecture

A strict layered architecture — one responsibility per folder. A request flows
straight down the layers and a response flows back up:

```
            HTTP request
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  routes/         route + middleware wiring    │
├─────────────────────────────────────────────┤
│  middlewares/    auth · validate · errors     │
├─────────────────────────────────────────────┤
│  controllers/    HTTP only (req → res)        │
├─────────────────────────────────────────────┤
│  services/       business logic + DTO mapping │  ◄── booking rules live here
├─────────────────────────────────────────────┤
│  repositories/   data access (Prisma only)    │
├─────────────────────────────────────────────┤
│  Prisma Client ──► MySQL 8                     │
└─────────────────────────────────────────────┘

config/  env (fail-fast) + prisma singleton
schemas/ Zod request schemas
utils/   AppError, asyncHandler, jwt, bcrypt, pagination
types/   Express type augmentation
```

**Rule of thumb:** services never touch Prisma directly — they go through
repositories. Controllers never contain business logic — they only translate
HTTP ↔ service calls.

---

## 🗃️ Data Model

```
User (admin / business owner — the grandfather)
  id · email (unique) · password (bcrypt) · timestamps

Service (catalogue: basic wash, wax, interior, …)
  id · name · description? · price (Decimal 10,2) · durationMinutes
  isActive · timestamps
  └── has many Booking

Customer (served at home)
  id · name · phone · address · zone? · timestamps
  └── has many Booking

Booking
  id · startTime · endTime (DERIVED) · status (enum) · notes? · timestamps
  ├── belongs to Service
  └── belongs to Customer

BookingStatus = PENDING | CONFIRMED | COMPLETED | CANCELLED
```

Columns use `snake_case` (`@map`) and tables are pluralized `snake_case` (`@@map`).

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- Docker (for the local MySQL 8 instance)

### 1. Clone & install

```bash
git clone https://github.com/abelvelasquezchavez/carwash-booking-api.git
cd carwash-booking-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# edit .env if needed (defaults match docker-compose.yml)
```

### 3. Start MySQL

```bash
docker compose up -d mysql
```

### 4. Apply the database schema

```bash
npm run prisma:migrate   # creates tables from prisma/schema.prisma
```

### 5. Run the API

```bash
npm run dev              # hot-reload (tsx)
# or
npm run build && npm start
```

The API is now at `http://localhost:3000/api`.

---

## ⚙️ Environment Variables

| Variable         | Required | Default       | Description                                   |
| ---------------- | :------: | ------------- | --------------------------------------------- |
| `PORT`           |    no    | `3000`        | HTTP port.                                    |
| `NODE_ENV`       |    no    | `development` | `development` \| `test` \| `production`.      |
| `DATABASE_URL`   |  **yes** | —             | MySQL connection string.                      |
| `JWT_SECRET`     |  **yes** | —             | Secret used to sign JWTs.                     |
| `JWT_EXPIRES_IN` |    no    | `1d`          | Token lifetime (e.g. `1d`, `12h`).            |
| `BUSINESS_OPEN`  |    no    | `8`           | Opening hour (0–23), used by availability.    |
| `BUSINESS_CLOSE` |    no    | `18`          | Closing hour (1–24), used by availability.    |

The process **exits at boot** if `DATABASE_URL` or `JWT_SECRET` is missing.

---

## 📡 API Reference

All routes are prefixed with `/api`. Protected routes require an
`Authorization: Bearer <token>` header.

| Method | Endpoint                      | Auth | Description                                  |
| ------ | ----------------------------- | :--: | -------------------------------------------- |
| POST   | `/auth/register`              |  —   | Create the admin account, returns a token.   |
| POST   | `/auth/login`                 |  —   | Log in, returns a token.                     |
| GET    | `/health`                     |  —   | Status + uptime.                             |
| GET    | `/services`                   |  —   | List services (`?active=true\|false`).       |
| GET    | `/services/:id`               |  —   | Get one service.                             |
| POST   | `/services`                   |  🔒  | Create a service.                            |
| PUT    | `/services/:id`               |  🔒  | Update a service.                            |
| DELETE | `/services/:id`               |  🔒  | Delete a service.                            |
| GET    | `/customers`                  |  🔒  | List customers (paginated).                  |
| POST   | `/customers`                  |  🔒  | Create a customer.                           |
| GET    | `/customers/:id`              |  🔒  | Get one customer.                            |
| PUT    | `/customers/:id`              |  🔒  | Update a customer.                           |
| GET    | `/bookings`                   |  🔒  | List bookings (`?date=`, `?status=`).        |
| POST   | `/bookings`                   |  🔒  | Create a booking (anti-overbooking).         |
| GET    | `/bookings/:id`               |  🔒  | Get one booking.                             |
| PATCH  | `/bookings/:id/status`        |  🔒  | Change booking status (validated).           |
| GET    | `/availability`               |  🔒  | Free slots (`?date=&serviceId=`).            |

### Response envelopes

```jsonc
// single resource
{ "data": { /* ... */ } }

// list with pagination
{ "data": [ /* ... */ ], "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }

// error
{ "status": "error", "message": "…", "errors": [ { "path": "body.x", "message": "…" } ] }
```

---

## 🧪 Example Walkthrough (curl)

### 1. Register & grab a token

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"abuelo@carwash.com","password":"supersecret"}' \
  | jq -r '.data.token')
```

### 2. Create a service

```bash
curl -s -X POST http://localhost:3000/api/services \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Basic Wash","price":25.00,"durationMinutes":60}'
```

### 3. Create a customer

```bash
curl -s -X POST http://localhost:3000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Doña Rosa","phone":"+51 999 888 777","address":"Av. Siempreviva 742","zone":"Centro"}'
```

### 4. Check availability for a day

```bash
curl -s -G http://localhost:3000/api/availability \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode 'date=2026-07-01' \
  --data-urlencode 'serviceId=1'
# -> { "data": { "slots": [ { "startTime": "...T08:00...", "endTime": "...T09:00..." }, ... ] } }
```

### 5. Create a booking (endTime is derived automatically)

```bash
curl -s -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"serviceId":1,"customerId":1,"startTime":"2026-07-01T09:00:00.000Z","notes":"Garage code 1234"}'
```

### 6. Try to double-book the same slot → `409`

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"serviceId":1,"customerId":1,"startTime":"2026-07-01T09:30:00.000Z"}'
# -> 409
```

### 7. Confirm the booking

```bash
curl -s -X PATCH http://localhost:3000/api/bookings/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"CONFIRMED"}'
```

---

## ✅ Testing

Integration tests use **Vitest + Supertest** and run against the real Express app
with **Prisma fully mocked** (`vitest-mock-extended`) — no database required.

```bash
npm test          # run once
npm run test:watch
```

Covered scenarios include:

- `GET /api/health` → 200
- Service catalogue listing + envelope
- Paginated customer listing
- Successful booking creation (with derived `endTime`)
- Overlapping booking → `409` (overbooking)
- Booking in the past → `400`
- Booking an inactive service → `400`
- Writing without a token → `401`
- Availability returns correct slots, excluding occupied ones
- Booking status transition validation

---

## 📜 Scripts

| Script                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Run with hot-reload (tsx).               |
| `npm run build`         | Compile TypeScript to `dist/`.           |
| `npm start`             | Run the compiled server.                 |
| `npm test`              | Run the test suite once.                 |
| `npm run test:watch`    | Run tests in watch mode.                 |
| `npm run type-check`    | `tsc --noEmit`.                          |
| `npm run prisma:migrate`| Create/apply a dev migration.            |
| `npm run prisma:studio` | Open Prisma Studio.                      |

---

## 📄 License

[MIT](./LICENSE) © Abel Velasquez
