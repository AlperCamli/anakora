# ANAKORA Backend (Strapi)

## Stack
- Strapi v4
- PostgreSQL
- S3-compatible media storage
- Resend email provider

## Setup
1. Copy `.env.example` to `.env` and fill secrets.
2. Install dependencies: `npm install`
3. Run development server: `npm run develop`

## Seed
Set `SEED_DEMO_DATA=true` in `.env` to seed initial website content.

## Public API Endpoints
- `GET /api/public/layout`
- `GET /api/public/home`
- `GET /api/public/experiences`
- `GET /api/public/programs/:slug`
- `GET /api/public/archive`
- `GET /api/public/journal`
- `GET /api/public/journal/:slug`
- `GET /api/public/about`
- `GET /api/public/legal/:slug`
- `POST /api/public/leads/booking`
- `POST /api/public/leads/contact`
- `POST /api/public/leads/newsletter`

## Deploy (Docker)
- `docker compose up --build`

