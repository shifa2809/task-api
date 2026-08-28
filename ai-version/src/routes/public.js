const express = require('express');

const router = express.Router();

/**
 * @swagger
 * /public/info:
 *   get:
 *     summary: Open/public info endpoint (no auth required)
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: A simple public message
 */
router.get('/info', (req, res) => {
  return res.status(200).json({ message: 'This is a public endpoint. No authentication required.' });
});

module.exports = router;
