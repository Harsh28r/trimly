# Trimly

A role-based salon booking app built with Expo, React Native, Express, MongoDB, and Redis.

## What is included

- Customer discovery, nearby search, salon profiles, favorites, reviews, live availability, pay-at-store booking, cancellations, and notifications
- Owner store onboarding, services, staff schedules, time off, booking confirmation/completion, and dashboard metrics
- JWT access/rotating refresh sessions, role authorization, rate limiting, Zod validation, Redis booking locks, MongoDB overlap protection, and reminder notifications
- Shared request contracts, seed data, API docs, and scheduling tests

## Requirements

- Node.js 22+
- Docker Desktop
- Expo Go or an Android/iOS simulator

## Local setup

```powershell
npx pnpm@10.13.1 install
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
docker compose up -d
npx pnpm@10.13.1 seed
```

For a physical phone, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your computer's LAN IP. Android Emulator uses `http://10.0.2.2:4000/api`; iOS Simulator uses localhost.

Run the API and Expo app in separate terminals:

```powershell
npx pnpm@10.13.1 --filter @trimly/api dev
npx pnpm@10.13.1 --filter @trimly/mobile dev
```

Without Docker, run the included development launcher instead. It downloads MongoDB into the project’s `.cache` directory, starts an in-memory database, and seeds demo accounts automatically:

```powershell
.\run-memory.ps1
```

In-memory data resets whenever the API process stops. Redis is optional in this mode; booking conflict checks fall back to MongoDB.

API: `http://localhost:4000/api`  
Swagger: `http://localhost:4000/docs`  
Health: `http://localhost:4000/health`

## Seed accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer@trimly.test` | `Password123!` |
| Salon owner | `owner@trimly.test` | `Password123!` |

The seed creates “The Yellow Chair” in Bengaluru with two services and one stylist.

## Commands

```powershell
npx pnpm@10.13.1 typecheck
npx pnpm@10.13.1 test
npx pnpm@10.13.1 build
npx pnpm@10.13.1 seed
```

## Booking integrity

Availability combines staff working hours, service duration/buffer, time off, and active bookings. Creation takes a short Redis lock and repeats the overlap check in MongoDB before insertion. A partial unique index rejects duplicate active starts as an additional guard.

Times are sent as ISO UTC values. The MVP defaults salon hours to `Asia/Kolkata`; production should use a timezone library such as Temporal/Luxon when owners in multiple timezones are enabled.
