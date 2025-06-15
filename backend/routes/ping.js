const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => {
  res.status(200).json({ status: 'pong' });
});

module.exports = router;