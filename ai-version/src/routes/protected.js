const express = require('express');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

/**
 * @swagger
 * /protected/profile:
 *   get:
 *     summary: Get the logged-in user's profile
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's profile
 *       401:
 *         description: Missing, malformed, invalid, or expired token
 */
router.get('/profile', requireAuth, (req, res) => {
  const { id, email, created_at } = req.user;

  return res.status(200).json({
    id,
    email,
    created_at,
  });
});

module.exports = router;
