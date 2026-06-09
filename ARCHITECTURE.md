# Architecture Documentation

## System Overview

The MITM API Proxy Platform consists of three main components:

1. **Backend Server** - Node.js/Express application with Socket.IO
2. **Proxy Layer** - HTTP proxy middleware for intercepting traffic
3. **Frontend Dashboard** - React application for managing the platform

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │     │   Supabase      │
│   (React)       │     │   (Express)     │     │   (PostgreSQL)  │
│                 │     │                 │     │                 │
│  - Dashboard    │────▶│  - API Routes   │────▶│  - Mocks        │
│  - Components   │     │  - Proxy Layer  │     │  - Scenarios    │
│  - Socket.IO    │◀────│  - Socket.IO    │     │  - Recordings   │
│     Client      │     │     Server      │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Target API    │
                        │   (External)    │
                        │                 │
                        │  - Real Backend │
                        │  - Third-party  │
                        └─────────────────┘
```

## Component Details

### Backend Server

**Location**: `backend/src/`

**Main File**: `server.js`

**Responsibilities**:
- Serve REST API endpoints
- Handle WebSocket connections
- Manage proxy middleware
- Interact with Supabase database
- Coordinate between frontend and proxy layer

**Key Modules**:

1. **config/supabase.js**
   - Initializes Supabase client
   - Provides database access

2. **middleware/proxyHandler.js**
   - Core proxy logic
   - Mock and scenario matching
   - Traffic capture
   - Recording management
   - WebSocket emission

3. **routes/**
   - `proxy.js` - Proxy endpoint
   - `traffic.js` - Traffic data API
   - `mocks.js` - Mock CRUD operations
   - `scenarios.js` - Scenario CRUD operations
   - `recordings.js` - Recording session management

### Proxy Layer

**Technology**: http-proxy-middleware

**Flow**:

1. **Incoming Request**
   ```
   Frontend → Proxy → Check Mocks → Check Scenarios → Forward to Target
   ```

2. **Mock Matching**
   - Exact URL match
   - HTTP method match
   - Enabled status check
   - If match: return mock response immediately

3. **Scenario Matching**
   - Exact URL match
   - Enabled status check
   - If match: apply scenario (error, delay, timeout, custom)

4. **Proxy Forwarding**
   - If no mock/scenario match
   - Forward request to target API
   - Capture response
   - Emit to WebSocket
   - Save to recording if active

### Frontend Dashboard

**Location**: `frontend/src/`

**Main File**: `App.jsx`

**Responsibilities**:
- Provide user interface
- Display real-time traffic
- Manage mocks and scenarios
- Control recording sessions
- Configure settings

**Key Modules**:

1. **api/**
   - `client.js` - Axios configuration
   - `mocks.js` - Mock API calls
   - `scenarios.js` - Scenario API calls
   - `recordings.js` - Recording API calls
   - `traffic.js` - Traffic API calls

2. **components/**
   - `TrafficInspector.jsx` - Real-time traffic view
   - `MockManagement.jsx` - Mock CRUD interface
   - `ScenarioTesting.jsx` - Scenario CRUD interface
   - `RecordReplay.jsx` - Recording management
   - `SettingsPanel.jsx` - Configuration

3. **hooks/**
   - `useSocket.js` - Socket.IO connection hook

### Database Schema

**Tables**:

1. **mocks**
   - id (UUID, PK)
   - url (VARCHAR)
   - method (VARCHAR)
   - response_body (JSONB)
   - status_code (INTEGER)
   - enabled (BOOLEAN)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. **scenarios**
   - id (UUID, PK)
   - url (VARCHAR)
   - scenario_type (VARCHAR)
   - status_code (INTEGER)
   - delay_ms (INTEGER)
   - timeout (BOOLEAN)
   - custom_response (JSONB)
   - enabled (BOOLEAN)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

3. **recording_sessions**
   - id (UUID, PK)
   - name (VARCHAR)
   - started_at (TIMESTAMP)
   - ended_at (TIMESTAMP)
   - request_count (INTEGER)

4. **recorded_requests**
   - id (UUID, PK)
   - session_id (UUID, FK)
   - url (VARCHAR)
   - method (VARCHAR)
   - request_headers (JSONB)
   - request_body (JSONB)
   - query_params (JSONB)
   - response_headers (JSONB)
   - response_body (JSONB)
   - status_code (INTEGER)
   - response_time_ms (INTEGER)
   - timestamp (TIMESTAMP)

## Data Flow

### Traffic Inspection Flow

```
1. Frontend makes API request through proxy
2. Proxy intercepts request
3. Proxy forwards to target API
4. Target API responds
5. Proxy captures response
6. Proxy emits to WebSocket
7. Frontend receives via Socket.IO
8. Frontend updates UI
```

### Mock Flow

```
1. User creates mock in UI
2. Frontend sends POST /api/mocks
3. Backend saves to Supabase
4. Proxy checks database on each request
5. If match: return mock response
6. Emit to WebSocket with "Mock" badge
```

### Scenario Flow

```
1. User creates scenario in UI
2. Frontend sends POST /api/scenarios
3. Backend saves to Supabase
4. Proxy checks database on each request
5. If match: apply scenario (error/delay/timeout)
6. Emit to WebSocket with "Scenario" badge
```

### Recording Flow

```
1. User starts recording in UI
2. Frontend sends POST /api/recordings/sessions
3. Backend creates session in Supabase
4. Backend sets recording state
5. Proxy saves each request to Supabase
6. User stops recording
7. Frontend sends POST /api/recordings/sessions/:id/stop
8. Backend updates session end time
```

## WebSocket Events

### Client → Server

- `connection` - Client connects to WebSocket
- `disconnect` - Client disconnects from WebSocket

### Server → Client

- `traffic:new` - New traffic entry
  ```json
  {
    "id": "1234567890",
    "url": "/api/users",
    "method": "GET",
    "statusCode": 200,
    "responseTime": 150,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestHeaders": {},
    "requestBody": null,
    "queryParams": {},
    "responseHeaders": {},
    "responseBody": {},
    "isMock": false,
    "isScenario": false
  }
  ```

## API Endpoints

### Traffic
- `GET /api/traffic` - Get all traffic
- `DELETE /api/traffic` - Clear traffic

### Mocks
- `GET /api/mocks` - List all mocks
- `GET /api/mocks/:id` - Get single mock
- `POST /api/mocks` - Create mock
- `PUT /api/mocks/:id` - Update mock
- `DELETE /api/mocks/:id` - Delete mock
- `PATCH /api/mocks/:id/toggle` - Toggle mock

### Scenarios
- `GET /api/scenarios` - List all scenarios
- `GET /api/scenarios/:id` - Get single scenario
- `POST /api/scenarios` - Create scenario
- `PUT /api/scenarios/:id` - Update scenario
- `DELETE /api/scenarios/:id` - Delete scenario
- `PATCH /api/scenarios/:id/toggle` - Toggle scenario

### Recordings
- `GET /api/recordings/sessions` - List sessions
- `GET /api/recordings/sessions/:id` - Get session details
- `POST /api/recordings/sessions` - Start recording
- `POST /api/recordings/sessions/:id/stop` - Stop recording
- `DELETE /api/recordings/sessions/:id` - Delete session
- `GET /api/recordings/sessions/:id/export` - Export session
- `GET /api/recordings/state` - Get recording state

## Security Considerations

### Current Implementation
- No authentication (MVP)
- No rate limiting
- CORS configured for development
- Environment variables for credentials

### Production Recommendations
1. Add authentication (JWT, OAuth)
2. Implement rate limiting
3. Add request validation
4. Use HTTPS
5. Implement Row Level Security (RLS) in Supabase
6. Add logging and monitoring
7. Implement session management
8. Add input sanitization

## Performance Considerations

### Current Implementation
- In-memory traffic storage (last 100 requests)
- No pagination for recordings
- No caching layer
- Synchronous database queries

### Optimization Opportunities
1. Implement Redis for caching
2. Add pagination for large datasets
3. Use connection pooling
4. Implement request queuing
5. Add response compression
6. Optimize database queries with proper indexes
7. Implement lazy loading for UI components

## Scalability

### Horizontal Scaling
- Stateless backend design
- WebSocket connections need sticky sessions
- Database can scale independently
- Frontend can be served via CDN

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching
- Use connection pooling

## Technology Choices

### Why Express.js?
- Lightweight and fast
- Large ecosystem
- Easy to learn
- Good middleware support

### Why Socket.IO?
- Real-time bidirectional communication
- Automatic reconnection
- Room support
- Fallback mechanisms

### Why http-proxy-middleware?
- Easy integration with Express
- Built-in request/response handling
- Websocket support
- Customizable middleware

### Why Supabase?
- PostgreSQL database
- Real-time subscriptions
- Built-in authentication
- Easy to use
- Free tier available

### Why React?
- Component-based architecture
- Large ecosystem
- Good performance with hooks
- Easy state management

### Why Tailwind CSS?
- Utility-first approach
- No custom CSS needed
- Responsive design
- Dark mode support

## Future Enhancements

### Planned Features
1. User authentication and multi-tenancy
2. Team collaboration features
3. Advanced filtering and search
4. Traffic diffing
5. Automated testing integration
6. API documentation generation
7. Traffic replay with modifications
8. Mock versioning
9. Scenario templates
10. Analytics and reporting

### Technical Improvements
1. TypeScript migration
2. End-to-end testing
3. CI/CD pipeline
4. Docker containerization
5. Kubernetes deployment
6. Monitoring dashboard
7. Error tracking (Sentry)
8. Performance monitoring
9. A/B testing support
10. GraphQL proxy support
