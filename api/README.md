# ANP Monitor API

API Express + PostgreSQL (Render).

## Deploy no Render

1. New → Web Service → conecte o repo `hayralde/ANP.G`
2. Root Directory: `api`
3. Build: `npm install`
4. Start: `npm start`
5. Env var `DATABASE_URL` = connection string do Postgres

## Endpoints

- GET /api/activities
- PUT /api/activities
- PATCH /api/activities/:id
- GET /health
