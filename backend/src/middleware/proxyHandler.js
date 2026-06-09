const { createProxyMiddleware } = require('http-proxy-middleware');
const supabase = require('../config/supabase');

// In-memory storage for real-time traffic
let trafficData = [];
let isRecording = false;
let currentRecordingSession = null;

// Get traffic data
const getTrafficData = () => trafficData;

// Clear traffic data
const clearTrafficData = () => {
  trafficData = [];
};

// Set recording state
const setRecordingState = (recording, sessionId = null) => {
  isRecording = recording;
  currentRecordingSession = sessionId;
};

// Get recording state
const getRecordingState = () => ({ isRecording, currentRecordingSession });

// Check for active mock
const checkMock = async (url, method) => {
  const { data, error } = await supabase
    .from('mocks')
    .select('*')
    .eq('url', url)
    .eq('method', method.toUpperCase())
    .eq('enabled', true)
    .single();

  if (error || !data) return null;
  return data;
};

// Check for active scenario
const checkScenario = async (url) => {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('url', url)
    .eq('enabled', true)
    .single();

  if (error || !data) return null;
  return data;
};

// Save recorded request to Supabase
const saveRecordedRequest = async (reqData) => {
  if (!isRecording || !currentRecordingSession) return;

  const { data, error } = await supabase
    .from('recorded_requests')
    .insert({
      session_id: currentRecordingSession,
      url: reqData.url,
      method: reqData.method,
      request_headers: reqData.requestHeaders,
      request_body: reqData.requestBody,
      query_params: reqData.queryParams,
      response_headers: reqData.responseHeaders,
      response_body: reqData.responseBody,
      status_code: reqData.statusCode,
      response_time_ms: reqData.responseTime,
      timestamp: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving recorded request:', error);
  } else {
    // Update session request count
    await supabase
      .from('recording_sessions')
      .update({ request_count: supabase.raw('request_count + 1') })
      .eq('id', currentRecordingSession);
  }
};

// Create proxy middleware
const createProxy = (target, io) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    onProxyReq: async (proxyReq, req, res) => {
      const startTime = Date.now();
      req.proxyStartTime = startTime;
      req.proxyTiming = {
        ttfb: 0,
        download: 0,
        total: 0
      };

      // Capture request details
      req.capturedRequest = {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query
      };
    },
    onProxyRes: async (proxyRes, req, res) => {
      const endTime = Date.now();
      const responseTime = endTime - (req.proxyStartTime || endTime);
      
      let responseBody = '';
      let firstByteTime = null;
      let downloadStartTime = null;
      
      proxyRes.on('data', (chunk) => {
        if (!firstByteTime) {
          firstByteTime = Date.now();
          req.proxyTiming.ttfb = firstByteTime - req.proxyStartTime;
          downloadStartTime = firstByteTime;
        }
        responseBody += chunk;
      });
      
      proxyRes.on('end', async () => {
        const downloadEndTime = Date.now();
        req.proxyTiming.download = downloadEndTime - (downloadStartTime || firstByteTime || req.proxyStartTime);
        req.proxyTiming.total = responseTime;

        const trafficEntry = {
          id: Date.now().toString(),
          url: req.capturedRequest?.url || req.url,
          method: req.capturedRequest?.method || req.method,
          statusCode: proxyRes.statusCode,
          responseTime,
          timing: req.proxyTiming,
          timestamp: new Date().toISOString(),
          requestHeaders: req.capturedRequest?.headers || {},
          requestBody: req.capturedRequest?.body || null,
          queryParams: req.capturedRequest?.query || {},
          responseHeaders: proxyRes.headers,
          responseBody: responseBody || null
        };

        // Add to traffic data (keep last 100)
        trafficData.push(trafficEntry);
        if (trafficData.length > 100) {
          trafficData.shift();
        }

        // Emit to connected clients
        io.emit('traffic:new', trafficEntry);

        // Save to recording if active
        if (isRecording) {
          await saveRecordedRequest(trafficEntry);
        }
      });
    },
    onError: (err, req, res) => {
      const trafficEntry = {
        id: Date.now().toString(),
        url: req.url,
        method: req.method,
        statusCode: 500,
        responseTime: 0,
        timing: {
          ttfb: 0,
          download: 0,
          total: 0
        },
        timestamp: new Date().toISOString(),
        error: err.message
      };

      trafficData.push(trafficEntry);
      io.emit('traffic:new', trafficEntry);
    }
  });
};

// Custom proxy handler with mock and scenario support
const createCustomProxy = (target, io) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const timing = {
      ttfb: 0,
      download: 0,
      total: 0
    };
    try {
      // Check for both mock and scenario
      const mock = await checkMock(req.url, req.method);
      const scenario = await checkScenario(req.url);

      if (mock || scenario) {
        console.log(`Matched - Mock: ${!!mock}, Scenario: ${!!scenario} for ${req.method} ${req.url}`);

        // Determine response body (mock takes priority, then scenario custom response)
        let responseBody = mock?.response_body || scenario?.custom_response || { message: 'No response defined' };

        // Determine status code (scenario takes priority for errors, then mock)
        let statusCode = 200;
        if (scenario?.scenario_type === 'error' || scenario?.scenario_type === 'timeout') {
          statusCode = scenario.status_code || 500;
        } else if (mock) {
          statusCode = mock.status_code || 200;
        }

        // Determine delay (from scenario)
        let delay = scenario?.delay_ms || 0;

        // Apply delay if specified
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Calculate actual response time
        const responseTime = Date.now() - startTime;
        timing.total = responseTime;
        timing.ttfb = responseTime; // For mocks, TTFB is the total time
        timing.download = 0; // No download time for local responses

        // Handle timeout scenario
        if (scenario?.timeout || scenario?.scenario_type === 'timeout') {
          // Don't respond, let it timeout
          const trafficEntry = {
            id: Date.now().toString(),
            url: req.url,
            method: req.method,
            statusCode: 0,
            responseTime,
            timing,
            timestamp: new Date().toISOString(),
            requestHeaders: req.headers,
            requestBody: req.body,
            queryParams: req.query,
            responseHeaders: {},
            responseBody: null,
            isScenario: true,
            isTimeout: true
          };
          trafficData.push(trafficEntry);
          io.emit('traffic:new', trafficEntry);
          console.log(`Timeout scenario triggered for ${req.method} ${req.url} - not responding`);
          return;
        }

        const trafficEntry = {
          id: Date.now().toString(),
          url: req.url,
          method: req.method,
          statusCode,
          responseTime,
          timing,
          timestamp: new Date().toISOString(),
          requestHeaders: req.headers,
          requestBody: req.body,
          queryParams: req.query,
          responseHeaders: {
            ...(mock ? { 'x-mock-response': 'true' } : {}),
            ...(scenario ? { 'x-scenario-response': 'true' } : {})
          },
          responseBody,
          isMock: !!mock,
          isScenario: !!scenario
        };

        trafficData.push(trafficEntry);
        io.emit('traffic:new', trafficEntry);

        return res.status(statusCode).json(responseBody);
      }

      // No mock or scenario, use regular proxy
      const proxy = createProxy(target, io);
      return proxy(req, res, next);
    } catch (error) {
      console.error('Proxy error:', error);
      return res.status(500).json({ error: 'Proxy error' });
    }
  };
};

module.exports = {
  createProxy,
  createCustomProxy,
  getTrafficData,
  clearTrafficData,
  setRecordingState,
  getRecordingState
};
