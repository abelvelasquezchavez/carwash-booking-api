# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
