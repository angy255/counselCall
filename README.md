# CounselCall

CounselCall helps clients find attorneys and book consultation sessions without back-and-forth scheduling.

## Demo

![CounselCall demo](demo.gif)

## Test Credentials

> **Demo Login Box**
>
> - Shared password for seeded users: `password123`
> - Attorney accounts:
>   - `attorney.avery@example.com`
>   - `attorney.casey@example.com`
>   - `attorney.quinn@example.com`
>   - `attorney.rowan@example.com`
> - Client accounts:
>   - `client.01@example.com`
>   - `client.02@example.com`
>   - `client.03@example.com`
>   - `client.04@example.com`
>   - `client.05@example.com`

## Why This Matters

People who need legal help often struggle to find a lawyer who matches their needs and has open time. This app solves that by letting clients filter attorneys by practice area and submit booking requests in one place.

Attorneys often manage availability through messages and calls, which leads to missed updates and accidental overlaps. CounselCall gives attorneys a direct way to set weekly hours, block days off, and handle bookings from one dashboard.

Clients and attorneys also need a shared source of truth for booking status, cancellations, and feedback. This app tracks the full booking lifecycle so both sides can see the same information.

## Screenshots

### Client Payment Flow

![Client payment view](docs/screenshots/client_payment.png)

![Client payment view](docs/screenshots/stripe_client_payment.png)

### Client Dashboard

![Client payment view](docs/screenshots/client_dashboard.png)

## Key Features

| Feature (plain English) | Technical implementation |
|---|---|
| Secure login for two account types | JWT auth in `httpOnly` cookies, bcrypt password hashing, role-aware route protection for `CLIENT` and `ATTORNEY` |
| Attorney profile management | Profile data stored in Prisma `AttorneyProfile` model with bio, practice areas, hourly rate, and photo URL |
| Weekly schedule control | Attorneys create recurring `Availability` entries by day of week and time range |
| Day-off blocking | `BlockedDate` records remove specific dates from bookable availability |
| Reliable booking requests | Booking API validates input with Zod and writes pending bookings to the database |
| Double-booking prevention | Conflict query checks overlap: `existing.startTime < requested.endTime` and `existing.endTime > requested.startTime` |
| Fast availability lookups | Upstash Redis caches day-level availability with 60-second TTL and cache invalidation on schedule updates |
| End-to-end workflow | Attorneys confirm/cancel bookings; clients view upcoming/past bookings, cancel (24-hour rule), and leave reviews |

## Tech Stack

- **Frontend**: Next.js App Router + Tailwind CSS  
  Chosen for fast page rendering, clean routing, and easy responsive styling.
- **Backend**: Node.js + Express + TypeScript  
  Chosen for simple, explicit REST APIs and type-safe server logic.
- **Database**: PostgreSQL (Supabase) + Prisma ORM  
  Chosen for reliable relational data modeling and migration-driven schema changes.
- **Security**: `jsonwebtoken` + `bcrypt` + cookie-based auth middleware  
  Chosen so sessions stay server-validated and passwords are never stored in plain text.
- **Caching**: Upstash Redis REST API (`@upstash/redis`)  
  Chosen to speed up repeated availability checks with minimal operational overhead.

## Stripe Connect Integration

- **Why Connect (not Checkout):** This app is a marketplace flow where clients pay the platform and attorneys receive payouts. Stripe Connect enables destination charges, platform fees, and attorney onboarding under one integration.
- **Required environment variables:**
  - Backend: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Frontend: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Test card for local QA:** `4242 4242 4242 4242` (future date, any CVC, any ZIP)
- **Attorney onboarding flow:** Attorney clicks **Connect Bank Account** -> backend creates/reuses Stripe Express account -> Stripe onboarding link redirects attorney -> status sync updates `stripeOnboardingComplete`.
- **Payment flow summary:** Booking creation initializes a manual-capture PaymentIntent when attorney onboarding is complete. Client authorizes payment, then attorney confirmation captures funds. Platform fee is set to 10% via `application_fee_amount`.

## ER Diagram

<details>
<summary>Show/Hide ER Diagram</summary>

```mermaid
erDiagram
    User ||--o| AttorneyProfile : has
    User ||--o{ Availability : defines
    User ||--o{ BlockedDate : blocks
    User ||--o{ Booking : clientBookings
    User ||--o{ Booking : attorneyBookings
    User ||--o{ Review : clientReviews
    User ||--o{ Review : attorneyReviews
    AttorneyProfile {
      string id
      string userId
      string bio
      json practiceAreas
      float hourlyRate
      string photoUrl
      string stripeAccountId
      boolean stripeOnboardingComplete
      datetime createdAt
    }
    Availability {
      string id
      string attorneyId
      int dayOfWeek
      string startTime
      string endTime
    }
    BlockedDate {
      string id
      string attorneyId
      date date
    }
    Booking {
      string id
      string clientId
      string attorneyId
      date date
      string startTime
      string endTime
      string status
      string notes
      string paymentIntentId
      int amountInCents
      datetime createdAt
    }
    Review {
      string id
      string clientId
      string attorneyId
      int rating
      string comment
      datetime createdAt
    }
```

</details>

## Local Setup

These steps assume you already have Node.js installed. This project currently runs on Supabase PostgreSQL, so you will connect using a `DATABASE_URL`.

1. Clone the repository and enter it:
   ```bash
   git clone https://github.com/YOUR_USERNAME/counselcall.git
   cd counselcall
   ```
2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd ../client
   npm install
   ```
4. Create environment files:
   ```bash
   cd ..
   cp server/.env.example server/.env
   cp client/.env.example client/.env.local
   ```
5. Fill `server/.env` and `client/.env.local` with real values.
6. Generate Prisma client and run migrations:
   ```bash
   cd server
   npm run prisma:generate
   npm run prisma:migrate
   ```
7. Seed demo data:
   ```bash
   npx prisma db seed
   ```
8. Start backend:
   ```bash
   npm run dev
   ```
9. Start frontend in a second terminal:
   ```bash
   cd ../client
   npm run dev
   ```
10. Open the app:
    - `http://localhost:3000`

## Environment Variables

<details>
<summary>Show/Hide Environment Variables</summary>

### Backend (`server/.env`)

| Variable | Example value | Description |
|---|---|---|
| `PORT` | `4000` | Port for the Express API server |
| `NODE_ENV` | `development` | Runtime mode used for security/cookie behavior |
| `CLIENT_URL` | `http://localhost:3000` | Allowed frontend origin for CORS |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres` | Database connection string used by Prisma |
| `JWT_SECRET` | `replace-me-with-strong-secret` | Secret key used to sign and verify JWT tokens |
| `UPSTASH_REDIS_REST_URL` | `https://example.upstash.io` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | `your-upstash-token` | Upstash REST API token |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase project URL (used for uploads) |
| `SUPABASE_SERVICE_KEY` | `your-service-role-key` | Server-side key for secure storage operations |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe secret key used for Connect and PaymentIntent operations |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe webhook signing secret used for signature verification |

### Frontend (`client/.env.local`)

| Variable | Example value | Description |
|---|---|---|
| `API_URL` | `http://localhost:4000` | Backend base URL used by Next.js rewrite/proxy |
| `NEXT_PUBLIC_API_URL` | `/api` | Browser-facing API path prefix (kept same-origin) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Stripe publishable key used by Stripe Elements on the booking page |

</details>

## API Reference

<details>
<summary>Show/Hide API Reference</summary>

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user account |
| `POST` | `/api/auth/login` | No | Authenticate user and set JWT cookie |
| `POST` | `/api/auth/logout` | Yes | Clear auth cookie |
| `GET` | `/api/auth/me` | Yes | Return current authenticated user |
| `GET` | `/api/attorneys` | No | List attorneys, optional practice area filter |
| `GET` | `/api/attorneys/:attorneyId` | No | Fetch attorney profile, availability, and reviews |
| `POST` | `/api/bookings` | Yes (Client) | Create booking request (pending) |
| `POST` | `/api/stripe/connect` | Yes (Attorney) | Start Stripe Connect onboarding and return redirect URL |
| `GET` | `/api/stripe/connect/status` | Yes (Attorney) | Return current attorney Stripe onboarding status |
| `GET` | `/api/stripe/connect/return` | Yes (Attorney) | Handle Stripe return redirect and sync onboarding status |
| `POST` | `/api/stripe/webhook` | No (Stripe-signed) | Process Stripe webhook events (payment/account updates) |
| `GET` | `/api/dashboard/attorney/profile` | Yes (Attorney) | Get attorney profile |
| `PUT` | `/api/dashboard/attorney/profile` | Yes (Attorney) | Update attorney profile |
| `GET` | `/api/dashboard/attorney/availability` | Yes (Attorney) | List recurring availability |
| `POST` | `/api/dashboard/attorney/availability` | Yes (Attorney) | Add recurring availability entry |
| `PUT` | `/api/dashboard/attorney/availability/:id` | Yes (Attorney) | Update recurring availability entry |
| `DELETE` | `/api/dashboard/attorney/availability/:id` | Yes (Attorney) | Delete recurring availability entry |
| `GET` | `/api/dashboard/attorney/blocked-dates` | Yes (Attorney) | List blocked dates |
| `POST` | `/api/dashboard/attorney/blocked-dates` | Yes (Attorney) | Add blocked date |
| `DELETE` | `/api/dashboard/attorney/blocked-dates/:id` | Yes (Attorney) | Remove blocked date |
| `GET` | `/api/dashboard/attorney/bookings` | Yes (Attorney) | List attorney bookings (upcoming/history) |
| `PATCH` | `/api/dashboard/attorney/bookings/:id/status` | Yes (Attorney) | Confirm or cancel booking |
| `GET` | `/api/dashboard/attorney/reviews` | Yes (Attorney) | List reviews for the attorney |
| `GET` | `/api/dashboard/client/bookings` | Yes (Client) | List client bookings (upcoming/past) |
| `PATCH` | `/api/dashboard/client/bookings/:id/cancel` | Yes (Client) | Cancel booking if 24+ hours ahead |
| `POST` | `/api/dashboard/client/reviews` | Yes (Client) | Submit attorney review |

</details>

## Deployment Guide (Vercel + Render)

### Frontend on Vercel

1. Push your code to GitHub.
2. In Vercel, click **Add New Project**.
3. Import your GitHub repo.
4. Set Root Directory to `client`.
5. Add environment variables:
   - `API_URL` = your backend URL (Render)
   - `NEXT_PUBLIC_API_URL` = `/api`
6. Deploy and copy your Vercel URL.

### Backend on Render

1. In Render, click **New** -> **Web Service**.
2. Connect your GitHub repo and set root to `server`.
3. Configure build/start:
   - Build: `npm install && npm run build`
   - Start: `npm run start`
4. Add all variables from `server/.env.example`.
5. Set `CLIENT_URL` to your Vercel frontend URL.
6. Redeploy and copy the backend URL.

### Final wiring

1. Update Vercel `API_URL` to point at Render backend.
2. Confirm login, browse attorneys, and booking flow in production.

## Security Features

- Passwords are never saved in plain text; they are stored as bcrypt hashes, which helps protect user accounts if database data is exposed.
- Login state is stored in `httpOnly` cookies, so browser JavaScript cannot directly read tokens.
- Protected API routes verify identity before running, so private dashboards stay private.
- Role checks keep client-only and attorney-only actions separate.
- Input validation blocks malformed requests before they reach database operations.
- Booking conflict checks prevent overlapping sessions from being created.

## What I Learned

I chose to keep the backend as explicit REST endpoints instead of abstracting everything behind a service layer early on. It made it easier to reason about role-specific behavior and quickly verify each flow end-to-end while building.

I decided to use Redis as a best-effort cache for day-level availability instead of as a critical dependency. If Redis fails or is unavailable, the app still reads from the database and continues working.

I used JWT in `httpOnly` cookies rather than local storage tokens because it reduces token exposure in the browser. That decision made CORS and cookie settings more important, but it led to a safer default auth setup.

I also kept schedule data relational and simple (availability + blocked dates + bookings) instead of introducing a heavy calendar engine. That tradeoff made conflict logic straightforward and easier to maintain while still supporting practical booking use cases.

## Roadmap

- Add automated unit and integration tests for booking and auth flows.
- Add a richer calendar UI for slot selection on the attorney detail page.
- Add email notifications for booking status updates.
- Add pagination and search for larger attorney and review datasets.
- Add request rate limiting and structured audit logging.
- Add multi-timezone support for attorneys and clients in different regions.
- Add attorney notifications for new bookings (email or in-app).
- Add attorney-to-attorney client referral workflows.
- Add attorney-initiated booking and scheduling flows.
