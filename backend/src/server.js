require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const proxyRoutes = require('./routes/proxy');
const mockRoutes = require('./routes/mocks');
const scenarioRoutes = require('./routes/scenarios');
const recordingRoutes = require('./routes/recordings');
const trafficRoutes = require('./routes/traffic');
const { createCustomProxy, getTrafficData, clearTrafficData, setRecordingState, getRecordingState } = require('./middleware/proxyHandler');

const app = express();
const server = http.createServer(app);

// Support multiple comma-separated frontend URLs, or allow all if not set
const rawFrontendUrl = process.env.FRONTEND_URL || '';
const allowedOrigins = rawFrontendUrl
  ? rawFrontendUrl.split(',').map(u => u.trim().replace(/\/$/, ''))
  : true; // allow all origins if FRONTEND_URL not configured

if (!rawFrontendUrl) {
  console.warn('⚠️  FRONTEND_URL not set — CORS is open (all origins allowed)');
}

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/proxy', proxyRoutes);
app.use('/api/mocks', mockRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/traffic', trafficRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'MITM API Proxy',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: ['/health', '/api/proxy', '/api/mocks', '/api/scenarios', '/api/recordings', '/api/traffic']
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    proxy: process.env.DISABLE_PROXY !== 'true'
  });
});

// 404 handler — must be last
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: ['/', '/health', '/api/proxy', '/api/mocks', '/api/scenarios', '/api/recordings', '/api/traffic']
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
const PROXY_PORT = process.env.PROXY_PORT || 3002;
const TARGET_URL = process.env.TARGET_URL || 'https://jsonplaceholder.typicode.com';
const DISABLE_PROXY = process.env.DISABLE_PROXY === 'true';

// Handle port conflicts gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using this port.`);
    console.error('Run: netstat -ano | findstr :' + PORT);
    console.error('Then: taskkill /F /PID <PID>');
  } else {
    console.error('Server error:', error);
  }
});

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

// Create separate proxy server (only if not disabled)
if (!DISABLE_PROXY) {
  const proxyApp = express();
  proxyApp.use(cors());
  proxyApp.use(express.json());
  proxyApp.use(express.urlencoded({ extended: true }));

  // Apply custom proxy handler to all routes
  proxyApp.use('/', createCustomProxy(TARGET_URL, io));

  const proxyServer = http.createServer(proxyApp);

  proxyServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Proxy port ${PROXY_PORT} is already in use.`);
    } else {
      console.error('Proxy server error:', error);
    }
  });

  proxyServer.listen(PROXY_PORT, () => {
    console.log(`Proxy server running on port ${PROXY_PORT}`);
    console.log(`Forwarding requests to: ${TARGET_URL}`);
    console.log(`Proxy URL: http://localhost:${PROXY_PORT}`);
  });
} else {
  console.log('Proxy server disabled (DISABLE_PROXY=true)');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
