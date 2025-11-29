# Database Setup Complete! 🎉

Your Supabase database schema is ready with RLS (Row Level Security) and Shopify integration support.

## What's Been Set Up

### ✅ Database Schema
- **profiles** table - User profiles with Shopify subscription tracking
- **drills** table - User's drill library with RLS
- **teams** table - Team branding (logos, colors) with RLS
- **practice_plans** table - Generated practice plans with RLS

### ✅ Row Level Security (RLS)
All tables have RLS policies that ensure:
- Users can only access their own data
- Automatic filtering by `user_id = auth.uid()`
- Secure data isolation between users

### ✅ Shopify Integration Fields
The `profiles` table includes:
- `shopify_customer_id` - Link to Shopify customer
- `subscription_status` - 'trial', 'active', 'cancelled', 'expired'
- `trial_end_date` - Trial expiration
- `subscription_start_date` / `subscription_end_date` - Subscription dates

### ✅ TypeScript Types & Helpers
- Full TypeScript types for all database tables
- Type-safe query helper functions
- Subscription access control helpers

## Testing & Seeding

### Test Users Seeder

We've included a seeder script to create test users with different subscription statuses:

```bash
npm run seed
```

This creates 5 test users:
- `trial@test.com` - Active trial (7 days remaining)
- `active@test.com` - Active subscriber
- `cancelled@test.com` - Cancelled but still has access
- `expired@test.com` - Expired subscription
- `expired_trial@test.com` - Expired trial

All passwords: `testpassword123`

To clean up test users:
```bash
npm run seed:cleanup
```

See `scripts/README.md` for more details.

### Running Tests

We have comprehensive tests for:
- Subscription access control
- Database queries
- RLS policies

```bash
npm test
```

## Next Steps

### 1. Run the Migration

Go to your Supabase Dashboard → SQL Editor and run:
```
supabase/migrations/001_initial_schema.sql
```

Or use the Supabase CLI:
```bash
supabase db push
```

### 2. Set Up Storage Buckets

In Supabase Dashboard → Storage, create:

**`drill-diagrams`** bucket:
- Private bucket
- Max file size: 5MB
- MIME types: image/jpeg, image/png, image/webp

**`team-logos`** bucket:
- Private bucket  
- Max file size: 2MB
- MIME types: image/jpeg, image/png, image/webp, image/svg+xml

### 3. Configure Shopify Webhooks

Set up webhooks in Shopify to update subscription status:

**Webhook endpoints to create:**
- `customer.subscription.created` → Update `subscription_status` to 'active'
- `customer.subscription.updated` → Update subscription dates
- `customer.subscription.cancelled` → Update `subscription_status` to 'cancelled'
- `customer.trial.started` → Set `subscription_status` to 'trial' and `trial_end_date`

### 4. Test the Setup

```typescript
// Example: Check user access
import { checkUserAccess } from '@/lib/supabase';

const access = await checkUserAccess(userId);
if (!access.hasAccess) {
  // Redirect to subscription page
}

// Example: Get user's drills
import { getUserDrills } from '@/lib/supabase';

const drills = await getUserDrills(userId);
```

## File Structure

```
lib/supabase/
├── client.ts              # Client-side Supabase client
├── server.ts              # Server-side Supabase client
├── index.ts               # Exports everything
├── database.types.ts      # TypeScript types for all tables
├── queries.ts             # Type-safe query helper functions
└── subscription.ts        # Subscription access control helpers

supabase/
├── migrations/
│   └── 001_initial_schema.sql  # Database migration
└── README.md                    # Detailed migration instructions
```

## Usage Examples

### Creating a Drill
```typescript
import { createDrill } from '@/lib/supabase';

const drill = await createDrill(userId, {
  name: '3-Man Weave',
  category: 'Warmup',
  duration: 10,
  description: 'Full court passing drill',
  steps: ['Step 1', 'Step 2'],
  coaching_points: ['Point 1', 'Point 2'],
});
```

### Checking Subscription Access
```typescript
import { requireAccess } from '@/lib/supabase';

// In an API route
export async function POST(req: Request) {
  const userId = await getUserId(req); // Your auth logic
  
  // Throws error if no access
  await requireAccess(userId);
  
  // Continue with protected operation
}
```

### Getting User's Practice Plans
```typescript
import { getUserPracticePlans } from '@/lib/supabase';

const plans = await getUserPracticePlans(userId);
```

## Important Notes

1. **RLS is Automatic**: All queries automatically filter by `user_id`. You don't need to manually add `WHERE user_id = ...` in most cases.

2. **Server vs Client**: 
   - Use `server` client in API routes and Server Components
   - Use `client` client in Client Components (browser)

3. **Service Role Key**: The `SUPABASE_KEY` (service role key) should NEVER be exposed to the client. Only use it server-side.

4. **Profile Creation**: Profiles are automatically created when a user signs up via the database trigger.

## Questions?

Check the detailed migration guide: `supabase/README.md`

