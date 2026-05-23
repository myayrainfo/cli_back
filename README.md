# Clinic ERP Backend

Clinic ERP is a pharmacy-first clinic management system that brings inventory, billing, purchases, patient workflows, alerts, reports, and settings into one platform.

This is the Express + MongoDB backend for the Clinic ERP project.

## Setup

Make sure your `.env` file is configured with:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`

## Backend architecture

The backend follows a simple Express structure:
- `src/server.js` boots the app and registers routes
- `src/routes` defines endpoints
- `src/controllers` contains request handling logic
- `src/models` contains Mongoose models
- `src/config` contains shared configuration like DB connection
- `src/seed` contains demo seed scripts

## Run locally

```bash
npm install
npm run dev
```

The backend runs on the port defined in `.env`.

## Seed demo data

```bash
npm run seed
```

This creates demo records for medicines, customers, suppliers, clinic data, sales, and purchases.
