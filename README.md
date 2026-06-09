# MITM API Proxy Platform

A powerful Man-In-The-Middle (MITM) proxy that allows frontend developers to intercept, inspect, mock, record, and replay API traffic. Eliminate dependency on backend services during development.

## Features

### 1. Traffic Inspector
- Real-time monitoring of all API traffic passing through the proxy
- Display URL, HTTP method, status code, response time, and timestamp
- View detailed request/response headers and bodies
- Search and filter by URL or method
- WebSocket-powered real-time updates

### 2. Smart API Mocking
- Create mock responses for any API endpoint
- Define custom response bodies (JSON)
- Specify HTTP methods that trigger mocks
- Enable/disable mocks without deleting
- Persistent storage in Supabase
- Exact URL matching

### 3. Scenario Testing Engine
- Simulate failure conditions (404, 500, 503 errors)
- Add configurable delays to responses
- Simulate timeouts
- Return custom response payloads
- Toggle scenarios independently

### 4. Record & Replay
- Start/stop recording sessions
- Capture full request/response data including headers
- Store timestamps and response times
- List all recorded sessions
- Replay recorded sessions
- Export recordings as JSON
- Delete recordings

### 5. Dashboard UI
- Single-page React application
- Modern dark theme with Tailwind CSS
- Real-time traffic updates
- Mock management interface
- Scenario creation interface
- Recording management
- Settings panel for proxy configuration

## Tech Stack

- **Frontend**: React.js + Tailwind CSS + Socket.IO Client
- **Backend**: Node.js + Express.js
- **Proxy Layer**: http-proxy-middleware + Node HTTP Module
- **Database**: Supabase (PostgreSQL)
- **Real-Time**: Socket.IO

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (free tier works)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd mitm-api
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and run the SQL schema from `backend/src/config/database.sql`
4. Go to Settings → API
5. Copy your Project URL and anon key

### 3. Configure Environment Variables

```bash
# Copy example files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env and add your Supabase credentials
PORT=3001
PROXY_PORT=3002
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
FRONTEND_URL=http://localhost:5173
```

### 4. Install Dependencies

```bash
npm run install:all
```

This will install dependencies for the root, backend, and frontend.

### 5. Start the Application

```bash
npm run dev
```

This starts both the backend server (port 3001) and frontend (port 5173) concurrently.

### 6. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:5173
```

## Project Structure

```
mitm-api/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.js       # Supabase client configuration
│   │   │   └── database.sql      # Database schema
│   │   ├── middleware/
│   │   │   └── proxyHandler.js   # MITM proxy logic
│   │   ├── routes/
│   │   │   ├── proxy.js          # Proxy routes
│   │   │   ├── traffic.js        # Traffic API
│   │   │   ├── mocks.js          # Mocks API
│   │   │   ├── scenarios.js      # Scenarios API
│   │   │   └── recordings.js     # Recordings API
│   │   └── server.js             # Express server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js         # Axios client
│   │   │   ├── mocks.js          # Mocks API calls
│   │   │   ├── scenarios.js      # Scenarios API calls
│   │   │   ├── recordings.js     # Recordings API calls
│   │   │   └── traffic.js        # Traffic API calls
│   │   ├── components/
│   │   │   ├── TrafficInspector.jsx
│   │   │   ├── MockManagement.jsx
│   │   │   ├── ScenarioTesting.jsx
│   │   │   ├── RecordReplay.jsx
│   │   │   └── SettingsPanel.jsx
│   │   ├── hooks/
│   │   │   └── useSocket.js      # Socket.IO hook
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── package.json
├── .gitignore
└── README.md
```

## How to Use Each Feature

### Traffic Inspector

1. Navigate to the "Traffic Inspector" tab
2. Make API requests through the proxy (configure your frontend to use the proxy URL)
3. Watch real-time traffic appear in the list
4. Click on any request to view detailed headers and bodies
5. Use the search/filter to find specific requests
6. Click "Clear Traffic" to reset the list

### API Mocking

1. Navigate to the "API Mocks" tab
2. Click "New Mock"
3. Enter the URL (e.g., `/api/users`)
4. Select the HTTP method (GET, POST, etc.)
5. Enter the desired status code (default: 200)
6. Provide the mock response body as JSON
7. Click "Create Mock"
8. Toggle the mock on/off using the toggle button
9. Edit or delete mocks using the action buttons

### Scenario Testing

1. Navigate to the "Scenarios" tab
2. Click "New Scenario"
3. Enter the URL to apply the scenario to
4. Select the scenario type:
   - **Error Response**: Return 404, 500, or 503
   - **Delayed Response**: Add a delay (in milliseconds)
   - **Timeout**: Simulate a timeout (no response)
   - **Custom Response**: Return a custom status code and body
5. Configure the scenario parameters
6. Click "Create Scenario"
7. Toggle scenarios on/off as needed

### Record & Replay

1. Navigate to the "Record & Replay" tab
2. Click "Start Recording"
3. Enter a name for the recording session
4. Make API requests through the proxy
5. Click "Stop Recording" when done
6. View the recorded session by clicking the eye icon
7. Export recordings as JSON using the download icon
8. Delete sessions using the trash icon

### Settings

1. Navigate to the "Settings" tab
2. Configure proxy port and target URL
3. Set up Supabase credentials
4. Follow the setup instructions provided
5. Save settings (requires server restart)

## API Endpoints

### Traffic
- `GET /api/traffic` - Get all traffic (supports ?url= and ?method= filters)
- `DELETE /api/traffic` - Clear all traffic

### Mocks
- `GET /api/mocks` - Get all mocks
- `GET /api/mocks/:id` - Get single mock
- `POST /api/mocks` - Create mock
- `PUT /api/mocks/:id` - Update mock
- `DELETE /api/mocks/:id` - Delete mock
- `PATCH /api/mocks/:id/toggle` - Toggle mock on/off

### Scenarios
- `GET /api/scenarios` - Get all scenarios
- `GET /api/scenarios/:id` - Get single scenario
- `POST /api/scenarios` - Create scenario
- `PUT /api/scenarios/:id` - Update scenario
- `DELETE /api/scenarios/:id` - Delete scenario
- `PATCH /api/scenarios/:id/toggle` - Toggle scenario on/off

### Recordings
- `GET /api/recordings/sessions` - Get all recording sessions
- `GET /api/recordings/sessions/:id` - Get session with requests
- `POST /api/recordings/sessions` - Start new recording
- `POST /api/recordings/sessions/:id/stop` - Stop recording
- `DELETE /api/recordings/sessions/:id` - Delete session
- `GET /api/recordings/sessions/:id/export` - Export session as JSON
- `GET /api/recordings/state` - Get current recording state

## WebSocket Events

### Client → Server
- `connection` - Client connects
- `disconnect` - Client disconnects

### Server → Client
- `traffic:new` - New traffic entry

## Development

### Running Backend Only
```bash
cd backend
npm run dev
```

### Running Frontend Only
```bash
cd frontend
npm run dev
```

### Building for Production
```bash
npm run backend:build
npm run frontend:build
```

## Troubleshooting

### Supabase Connection Issues
- Verify your SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Ensure you've run the database.sql schema in the Supabase SQL Editor
- Check that your Supabase project is active

### WebSocket Connection Issues
- Ensure the backend server is running
- Check that VITE_SOCKET_URL matches your backend URL
- Verify CORS settings in backend/.env

### Proxy Not Intercepting Requests
- Ensure your frontend is configured to use the proxy URL
- Check that the target URL is correctly set
- Verify the proxy middleware is properly configured

## Security Notes

- Never commit your `.env` files to version control
- Use Supabase Row Level Security (RLS) for production
- Consider adding authentication for multi-user scenarios
- Use HTTPS in production environments

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
