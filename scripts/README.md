# Database Seeder Scripts

These scripts help you seed your database with test data for development and testing.

## Prerequisites

Make sure you have the following environment variables set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR
SUPABASE_KEY=your_service_role_key
```

**Important:** The seeder uses the service role key to bypass RLS and create users. Never expose this key to the client!

## Usage

### Seed Test Users

```bash
npm run seed
```

This will create 5 test users with different subscription statuses:

1. **trial@test.com** - Active trial user (7 days remaining)
2. **active@test.com** - Active subscriber
3. **cancelled@test.com** - Cancelled subscription (but still has access until end date)
4. **expired@test.com** - Expired subscription
5. **expired_trial@test.com** - Expired trial

All users have the password: `testpassword123`

For active and trial users, the seeder also creates:
- A test team with branding colors
- 2 sample drills

### Cleanup Test Users

```bash
npm run seed:cleanup
```

This will delete all test users (identified by their email addresses). This will cascade delete all related data (profiles, drills, teams, practice plans).

## Test Users Details

| Email | Status | Password | Notes |
|-------|--------|----------|-------|
| trial@test.com | trial | testpassword123 | 7 days remaining |
| active@test.com | active | testpassword123 | Has team and drills |
| cancelled@test.com | cancelled | testpassword123 | Still has access until end date |
| expired@test.com | expired | testpassword123 | No access |
| expired_trial@test.com | trial (expired) | testpassword123 | Trial expired 5 days ago |

## Manual Testing

After seeding, you can:

1. Sign in with any test user in your app
2. Test subscription access control
3. Test RLS policies (users should only see their own data)
4. Test different subscription statuses

## Integration with Tests

The seeder can also be used in integration tests. Import and use it:

```typescript
import { seed } from '@/scripts/seed';

beforeAll(async () => {
  await seed();
});

afterAll(async () => {
  // Clean up test data
});
```

