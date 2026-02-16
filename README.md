# Practice Planner AI

AI-powered basketball practice plan generator.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Get your keys from Supabase Dashboard → Settings → API
   - Add to `.env.local`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_url
     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

3. **Run migration:**
   - In Supabase Dashboard → SQL Editor
   - Copy/paste `supabase/migrations/001_users.sql`
   - Run it

4. **Email testing (optional):**
   - **Mailpit** is included with local Supabase (http://localhost:54324)
   - For now, disable email confirmation: Supabase Dashboard → Authentication → Settings → Turn OFF "Enable email confirmations"
   - Or confirm users via CLI: `npm run confirm:user <email>`

5. **Start dev server:**
   ```bash
   npm run dev
   ```

## Quick Start (Local Development)

### Start All Services

```bash
# 1. Start ngrok (for Shopify webhooks) - in a separate terminal
npm run ngrok:start

# 2. Start Next.js dev server - in a separate terminal
npm run dev
```

### Stop All Services

```bash
npm run stop:all
```

### Check Service Status

```bash
npm run status
```

## Scripts

### Development
- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Services
- `npm run start:all` - Show instructions for starting all services
- `npm run stop:all` - Stop all services
- `npm run status` - Check status of all services
- `npm run ngrok:start` - Start ngrok tunnel (for webhooks)
- `npm run ngrok:stop` - Stop ngrok

### Supabase (Local - Optional)
- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:status` - Check Supabase status
- `npm run supabase:migrate` - Run migrations (local: `db reset`)

### Supabase (Production)
- `npm run supabase:push` - Push pending migrations to the **linked** remote project
- `npm run supabase:push:all` - Same, but apply all local migrations even if they are dated before the last remote one (use when the CLI says "Found local migration files to be inserted before the last migration on remote database")

**First-time setup for prod migrations:**
1. Install Supabase CLI and log in: `supabase login`
2. Link this repo to your project: `supabase link --project-ref <PROJECT_REF>`  
   (Project ref is in Dashboard → Settings → General.)
3. When prompted, enter your **database password** (Dashboard → Settings → Database).
4. Run: `npm run supabase:push` (or `supabase db push`).  
   This applies all pending files in `supabase/migrations/` to the remote DB.

### Utilities
- `npm run seed` - Seed test users (auto-confirmed)
- `npm run confirm:user <email>` - Confirm a user's email via CLI
- `npm run lint` - Run ESLint

## Email Testing & Bypass

**Mailpit is included with Supabase local!** Access it at http://localhost:54324

For local development, email confirmation is disabled. Options:

**Option 1: Disable Email Confirmation (Recommended)**
- Go to Supabase Dashboard → Authentication → Settings
- Turn OFF "Enable email confirmations"

**Option 2: Confirm Users via CLI**
```bash
npm run confirm:user <email>
```

**Option 3: Use Mailpit for Testing (Later)**
- Mailpit is already running at http://localhost:54324
- Configure SMTP in Supabase Studio: Host `localhost`, Port `1025`
