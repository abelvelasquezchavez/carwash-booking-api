# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Payments & receivables** (optional charging — never blocks a booking):
  - `Booking` gains `paymentStatus` (UNPAID|PAID) and a frozen `amount`
    (captured from `service.price` at creation).
  - New `Payment` entity (1:1 optional with `Booking`) with `method`
    (CASH|TRANSFER|YAPE|PLIN|CARD), `amount`, `paidAt` and `notes`.
  - `PATCH /api/bookings/:id/payment` — records a payment and marks the booking
    PAID atomically; amount defaults to the booking amount; paying twice → 409.
  - `GET /api/reports/pending` — unpaid bookings with days outstanding + total owed.
  - `GET /api/reports/revenue?from=&to=` — collected revenue by payment method.
- Tests for payment registration, the 409 on double payment, and both reports.
- **Database seed** (`prisma/seed.ts`, `npm run prisma:seed`) with realistic
  sample data: an admin (hashed with the same bcrypt helper as auth, so login
  works), the service catalogue, customers, and a mix of bookings — including
  paid and unpaid ones so the reports return data.
- **Deployment** — `render.yaml` Blueprint (Render web service; build runs
  `prisma migrate deploy`, not `migrate dev`) and `DEPLOYMENT.md` documenting the
  TiDB Cloud `DATABASE_URL` + SSL format, CA-certificate handling, the
  initial-migration prerequisite, and a free-tier uptime keep-alive.

## [1.0.0] - 2026-06-19

### Added

- Initial release of the Car Wash Booking API.
- JWT authentication (`/api/auth/register`, `/api/auth/login`) with bcrypt password hashing.
- Health endpoint (`/api/health`) reporting status and uptime.
- Service catalogue CRUD (`/api/services`) — public reads, protected writes, optional `?active=` filter.
- Customer management (`/api/customers`) — fully protected, paginated listing.
- Booking management (`/api/bookings`) with the core business rules:
  - No overbooking for the single provider (overlapping bookings rejected with 409).
  - No bookings in the past (400).
  - No bookings against inactive services (400).
  - Server-derived `endTime` (`startTime` + service duration).
  - Validated status transitions (PENDING → CONFIRMED → COMPLETED, or → CANCELLED).
- Availability engine (`/api/availability`) computing free slots for a given day and service.
- Layered architecture: routes → controllers → services → repositories → Prisma.
- Centralized error handling, Zod request validation, fail-fast env validation, graceful shutdown.
- Vitest + Supertest integration tests with a mocked Prisma client.
- Docker + docker-compose (MySQL 8) and GitHub Actions CI (type-check + tests).
