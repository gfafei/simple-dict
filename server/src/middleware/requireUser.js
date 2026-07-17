import { USERS } from '../users.js';

export function requireUser(req, res, next) {
  const username = req.get('X-Username');
  if (!username || !USERS.includes(username)) {
    return res.status(401).json({ error: 'invalid or missing username' });
  }
  req.username = username;
  next();
}
