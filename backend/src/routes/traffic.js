const express = require('express');
const router = express.Router();
const { getTrafficData, clearTrafficData } = require('../middleware/proxyHandler');

// Get all traffic
router.get('/', (req, res) => {
  const { url, method } = req.query;
  let traffic = getTrafficData();

  if (url) {
    traffic = traffic.filter(t => t.url.toLowerCase().includes(url.toLowerCase()));
  }
  if (method) {
    traffic = traffic.filter(t => t.method.toLowerCase() === method.toLowerCase());
  }

  res.json(traffic);
});

// Clear traffic
router.delete('/', (req, res) => {
  clearTrafficData();
  res.json({ message: 'Traffic cleared' });
});

module.exports = router;
