const { supabase } = require('../supabaseClient');

/**
 * Reusable auth middleware.
 *
 * Expects: Authorization: Bearer <access_token>
 *
 * - 401 if the header is missing or not in "Bearer <token>" form (malformed)
 * - 401 if the token is invalid or expired
 * - On success, attaches the verified Supabase user to req.user and the raw
 *   token to req.token (routes like /auth/logout need the raw token to
 *   revoke that specific session), then calls next()
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const parts = authHeader.split(' ');
  const isBearerFormat = parts.length === 2 && parts[0] === 'Bearer' && parts[1];

  if (!isBearerFormat) {
    return res.status(401).json({ error: 'Malformed Authorization header. Expected: Bearer <token>' });
  }

  const token = parts[1];

  try {
    // Asks Supabase to validate the JWT and return the user it belongs to.
    // Fails for invalid signatures, expired tokens, or revoked sessions.
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
