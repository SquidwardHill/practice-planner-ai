# Supabase Database Setup

This directory contains database migrations and setup instructions for the Practice Planner AI project.

## Running Migrations

### Option 1: Using Supabase Dashboard (Recommended for initial setup)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/001_initial_schema.sql`
4. Copy and paste the entire SQL content into the SQL Editor
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## What This Migration Creates

### Tables

1. **profiles** - User profile information and Shopify integration
   - Extends `auth.users` with additional fields
   - Tracks subscription status, trial dates, Shopify customer ID
   - Automatically created when a user signs up (via trigger)

2. **drills** - User's drill library
   - Name, category, duration, description
   - Steps and coaching points (arrays)
   - Diagram URL (Supabase Storage)
   - Source URL (for tracking imports)

3. **teams** - Team branding information
   - Team name, logo, colors
   - Used for PDF generation

4. **practice_plans** - Generated practice plans
   - Links to teams
   - Stores plan structure as JSONB
   - Used for analytics

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only view/edit their own data
- All queries automatically filter by `user_id = auth.uid()`
- No user can access another user's data

### Triggers

- **handle_new_user()** - Automatically creates a profile when a user signs up
- **handle_updated_at()** - Automatically updates the `updated_at` timestamp on any table update

## Shopify Integration

The `profiles` table includes fields for Shopify integration:

- `shopify_customer_id` - Links to Shopify customer
- `subscription_status` - Current status: 'trial', 'active', 'cancelled', 'expired'
- `trial_end_date` - When the trial period ends
- `subscription_start_date` - When subscription started
- `subscription_end_date` - When subscription ends

You'll need to set up webhooks from Shopify to update these fields when:
- A customer subscribes
- A subscription is cancelled
- A subscription expires
- A trial starts/ends

## Next Steps

1. Run the migration in your Supabase project
2. Set up Supabase Storage buckets (see below)
3. Configure Shopify webhooks to update subscription status
4. Test RLS policies to ensure data isolation

## Storage Buckets

You'll need to create the following storage buckets in Supabase:

### `drill-diagrams`
- Public: No (private bucket)
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp

### `team-logos`
- Public: No (private bucket)
- File size limit: 2MB
- Allowed MIME types: image/jpeg, image/png, image/webp, image/svg+xml

Storage policies will need to be set up to allow users to upload to their own folders. This can be done via the Supabase Dashboard under Storage > Policies.

## Testing RLS

After running the migration, test that RLS is working:

1. Create a test user in Supabase Auth
2. Sign in as that user
3. Try to query data - you should only see your own data
4. Try to insert data - it should automatically set `user_id` to your user ID
5. Try to access another user's data - it should return empty results

## Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_KEY=your_service_role_key
```

The service role key should only be used server-side and never exposed to the client.

