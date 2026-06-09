const express = require('express');
const router = express.Router();
const { createCustomProxy } = require('../middleware/proxyHandler');

router.all('*', (req, res, next) => {
  const io = req.app.get('io');
  const target = req.query.target || 'https://api.example.com';
  
  const proxyHandler = createCustomProxy(target, io);
  return proxyHandler(req, res, next);
});

module.exports = router;
