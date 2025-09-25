# English Learning Platform — MVP

An English-learning platform built with Next.js 15 App Router, Prisma, Postgres, TanStack React Query, Zustand, Firebase Authentication, and shadcn-inspired UI components. Arabic is the default locale with RTL layout and English as a secondary language.

## Requirements
- Node.js 18+
- pnpm or npm
- PostgreSQL database

## Getting Started
1. Copy `.env.example` to `.env` and fill in environment variables.
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Generate Prisma client and run migrations:
   ```bash
   npx prisma migrate dev
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

## Scripts
- `npm run dev` — start Next.js dev server
- `npm run build` — create production build
- `npm run start` — start production server
- `npm run lint` — run ESLint
- `npm run prisma:migrate` — run Prisma migrations
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:studio` — open Prisma Studio

## Project Structure
Refer to the repository directories for app routes, admin dashboard, API routes, Prisma schema, Zustand store, and localization files under `i18n/`.
