### Family Care Network Platform - Docs

- Setup
  - Copy `backend/.env.example` to `backend/.env` and fill values
  - Start DB: `docker compose -f infra/docker-compose.yml up -d`
  - Install backend deps: `cd backend && npm i && npx prisma generate && npm run prisma:migrate && npm run dev`
  - Admin app: `cd apps/admin && npm i && npm run dev`
  - Mobile app (Flutter): ensure Flutter SDK is installed, then `flutter pub get` and run

- See `docs/api/openapi.yaml` for API spec.