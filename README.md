# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
# OPO

## Environment Variables

Copy `.env.example` to `.env.local` and update the values to match your setup:

```bash
cp .env.example .env.local
# edit .env.local to set DATABASE_URL
```

## Database Seeding

After setting `DATABASE_URL`, initialize the schema and insert the default admin user:

```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/init.sql
```

This seeds an `admin@paguemenos.com` account with the password `password` stored as a SHA-256 hash.
