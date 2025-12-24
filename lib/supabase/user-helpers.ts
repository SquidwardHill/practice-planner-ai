/**
 * Check if user is new (created within last 5 minutes)
 * Used to redirect new users to welcome page
 * @param createdAt - The user's created_at timestamp from auth.users
 */
export function isNewUser(createdAt: string | null | undefined): boolean {
  if (!createdAt) {
    return false;
  }

  const created = new Date(createdAt).getTime();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  return created > fiveMinutesAgo;
}

