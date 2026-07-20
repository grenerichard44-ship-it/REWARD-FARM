# Reward Farm System

Two independent Next.js applications backed by one Supabase project:

- `apps/user-app` — Farm World, Campaign City, structured Work view, Farm Vault and read-only Farm Guide.
- `apps/admin-platform` — campaign/task operations, exceptional manual fallback, payout notifications, invited users, Guide moderation, admins and audit log.

## Product rules

GEM COIN is an internal points tally with no exchange rate. The app does not process payments, perform FX conversion, automate crypto/bank transfers, provide a marketplace, or accept screenshot proof. Automatic provider signals are the default completion path. A short note/link is available only for exceptional manual tasks.

## Run locally

```bash
npm install
npm run dev
```

User app: `http://localhost:3000`  
Admin app: `http://localhost:3001`

Production builds:

```bash
npm run build
```

Apply `supabase/migrations/001_reward_farm_core.sql` to the single shared Supabase project. Sensitive tally writes, completion approval, verification ingestion and AI Guide calls belong in server-only functions using the service role.
