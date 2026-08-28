const express = require('express');
const { supabase, supabaseAdmin } = require('../supabaseClient');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Missing email or password, or Supabase rejected the signup
 */
router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({
    message: 'Account created successfully',
    user: {
      id: data.user?.id,
      email: data.user?.email,
    },
  });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful, returns JWT access token
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.session) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  return res.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    token_type: 'bearer',
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out and end the current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logged out successfully, no content returned
 *       401:
 *         description: Missing, malformed, invalid, or expired token
 */
router.post('/logout', requireAuth, async (req, res) => {
  // Revoke this specific session server-side. Requires the service role key
  // (admin API). Falls back to a best-effort local sign-out if the service
  // role key isn't configured, since without it Supabase has no server-side
  // API to revoke an arbitrary user-supplied token.
  try {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.auth.admin.signOut(req.token, 'global');
      if (error) {
        return res.status(401).json({ error: 'Unable to end session: ' + error.message });
      }
    } else {
      await supabase.auth.signOut();
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(401).json({ error: 'Unable to end session' });
  }
});

module.exports = router;
