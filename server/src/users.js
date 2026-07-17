// Allow-list of usernames, configured via the DICT_USERS env var (comma-separated).
// No passwords — anyone who knows a valid username can use it as that user.
export const USERS = (process.env.DICT_USERS || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);
