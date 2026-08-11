# Custodia Screening Tool

Custodia Screening Tool is a Next.js application for collecting short diabetes screening assessments, scoring submissions, and surfacing high-risk cases for nurse follow-up.

The public experience is titled **Know Your Risk | Diabetes Screening**. It guides a visitor through either a diabetes-risk questionnaire or a complication-risk questionnaire, stores the assessment in Postgres, returns plain-language guidance, and can hand high-risk diagnosed users to a nurse contact flow.

## Features

- Public diabetes screening flow for people who are diagnosed, not diagnosed, or unsure.
- Two scoring branches: diabetes risk and diabetes complication risk.
- Reference codes for each submitted assessment, generated as `CST-XXXXXXXX`.
- Postgres persistence for assessments, responses, scoring rule versions, and results.
- Nurse dashboard at `/dashboard` with password-protected access.
- Dashboard search by reference code and detail pages with full responses and scoring breakdowns.
- Optional WhatsApp handoff for diagnosed high-risk results.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma 7
- PostgreSQL 16 through Docker Compose
- ESLint and Node's built-in test runner

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop or another Docker Compose-compatible runtime

### Install Dependencies

```bash
npm install
```

The `postinstall` script runs `prisma generate` and writes the generated Prisma client to [lib/generated/prisma](lib/generated/prisma).

### Configure Environment

Copy the environment template:

```bash
cp .env.example .env
```

Default local database URL:

```text
postgresql://postgres:postgres@localhost:5433/custodia_screening_tool?schema=public
```

Environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma and the app. |
| `NEXT_PUBLIC_NURSE_WHATSAPP_NUMBER` | No | Nurse WhatsApp number in international format, digits only. Enables the WhatsApp handoff for diagnosed high-risk results. |
| `NURSE_DASHBOARD_PASSWORD` | Yes | Password for `/dashboard/login`. Change this outside local development. |
| `NURSE_DASHBOARD_SESSION_SECRET` | Yes | Secret used to sign the HTTP-only nurse dashboard session cookie. |

### Start the Database

```bash
npm run db:up
```

Apply migrations and seed the scoring rule versions:

```bash
npx prisma migrate dev
npm run db:seed
```

The seed script creates version 1 rules for both scoring branches. Submissions require an active scoring rule version, so seed the database before testing the public form.

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public screening flow.

Useful local URLs:

- Public screening: [http://localhost:3000](http://localhost:3000)
- Nurse dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Development Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Next.js development server. |
| `npm run build` | Build the production app. |
| `npm run start` | Start the production server after a build. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run tests in [lib](lib). |
| `npm run db:up` | Start the local Postgres container. |
| `npm run db:down` | Stop and remove the local Docker Compose services. |
| `npm run db:seed` | Seed scoring rule versions. |

## Application Flow

1. A visitor completes the public questionnaire.
2. The client posts the normalized payload to `POST /api/assessments`.
3. The API validates responses, scores the assessment, stores the assessment and result, and returns the classification plus a reference code.
4. The result screen shows user-facing guidance. Diagnosed high-risk results can show a WhatsApp nurse handoff when configured.
5. Nurses sign in at `/dashboard`, review submitted assessments, search by reference code, and open detail pages for full responses.

## Scoring

Scoring logic lives in [lib/scoring.ts](lib/scoring.ts). The app currently supports:

- `risk_of_diabetes` for users who are not diagnosed or are unsure.
- `complication_risk` for users who report an existing diabetes diagnosis.

Persisted scoring rule metadata is seeded from [prisma/seed.ts](prisma/seed.ts). The database stores the active rule version used for each result, while the TypeScript scoring implementation computes the submitted result.

## Database

The Prisma schema is defined in [prisma/schema.prisma](prisma/schema.prisma). Main models:

- `Assessment`: submitted responses, session id, diabetes status, and reference code.
- `Result`: classification, score, contributing factors, and scoring rule version link.
- `ScoringRuleVersion`: versioned metadata for each scoring branch.

Local Postgres runs on host port `5433` and container port `5432`.

## Nurse Dashboard

Set `NURSE_DASHBOARD_PASSWORD` and `NURSE_DASHBOARD_SESSION_SECRET` before using the dashboard. The dashboard session is stored in an HTTP-only cookie.

Dashboard capabilities:

- View newest assessments first.
- See total or matching assessment counts.
- Search by reference code.
- Flag diagnosed high-risk results.
- Open assessment detail pages with response data and score breakdowns.

## API Routes

- `POST /api/assessments`: validate, score, persist, and return a new assessment result.
- `GET /api/assessments/:id/result`: return a result for the current assessment session.
- `GET /api/health`: check database connectivity.

## Deployment Notes

- Provide a production Postgres database through `DATABASE_URL`.
- Run Prisma migrations against the production database before serving traffic.
- Seed scoring rule versions as part of release setup or migration operations.
- Set strong values for `NURSE_DASHBOARD_PASSWORD` and `NURSE_DASHBOARD_SESSION_SECRET`.
- Configure `NEXT_PUBLIC_NURSE_WHATSAPP_NUMBER` only when the nurse line is ready to receive follow-up messages.
