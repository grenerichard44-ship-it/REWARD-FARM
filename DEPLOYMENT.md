# Vercel deployment

Reward Farm is a monorepo containing two independent Next.js applications.
Create two Vercel projects from the same GitHub repository. Do not deploy the
repository root as a single application.

## User application

- Root Directory: `apps/user-app`
- Framework Preset: Next.js
- Install Command: use Vercel's default
- Build Command: `npm run build`
- Output Directory: use Vercel's default

The current user application does not require environment variables to build.

## Admin application

- Root Directory: `apps/admin-platform`
- Framework Preset: Next.js
- Install Command: use Vercel's default
- Build Command: `npm run build`
- Output Directory: use Vercel's default

Configure these variables in Vercel for Production and Preview:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

The service-role key is server-only. Never prefix it with `NEXT_PUBLIC_`, place
it in client components, commit it, or publish it in screenshots.

The admin application now builds without the variables so configuration errors
do not break Vercel's build phase. At runtime, `/api/campaigns` returns HTTP 503
until both variables are configured.

## Supabase

Apply `supabase/migrations/001_reward_farm_core.sql` to the production Supabase
project before using the admin campaigns page.

## Deployment checklist

1. Create or select the production Supabase project.
2. Apply the migration.
3. Create the two Vercel projects with the Root Directories above.
4. Add the admin environment variables.
5. deploy both projects.
6. Confirm the user URL returns the Farm interface.
7. Confirm the admin URL loads and `/api/campaigns` returns JSON.
