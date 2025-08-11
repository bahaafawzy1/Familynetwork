## Family Care Network - Monorepo

- backend: Node.js + Express + Prisma (PostgreSQL)
- apps/mobile: Flutter (mobile + web)
- apps/admin: React + Vite (admin dashboard)
- infra: Docker for Postgres/pgAdmin
- docs: API specs and guides

Quickstart
- Start DB: `docker compose -f infra/docker-compose.yml up -d`
- Backend: `cd backend && npm i && npx prisma generate && npm run prisma:migrate && npm run dev`
- Admin: `cd apps/admin && npm i && npm run dev`
- Mobile: open `apps/mobile` in Flutter and run `flutter pub get`