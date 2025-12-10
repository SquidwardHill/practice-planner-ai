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
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_KEY=your_service_role_key
     ```

3. **Run migration:**
   - In Supabase Dashboard → SQL Editor
   - Copy/paste `supabase/migrations/001_users.sql`
   - Run it

4. **Start dev server:**
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start dev server
- `npm run seed` - Seed test users
