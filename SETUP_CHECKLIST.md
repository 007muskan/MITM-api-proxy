# Setup Checklist

Use this checklist to ensure your MITM API Proxy Platform is set up correctly.

## Pre-Installation

- [ ] Node.js v18 or higher installed
- [ ] npm or yarn installed
- [ ] Git installed (for cloning)
- [ ] Supabase account created

## Supabase Setup

- [ ] Created a new Supabase project
- [ ] Ran the SQL schema from `backend/src/config/database.sql` in SQL Editor
- [ ] Copied Project URL from Settings → API
- [ ] Copied anon key from Settings → API

## Environment Configuration

- [ ] Copied `backend/.env.example` to `backend/.env`
- [ ] Filled in SUPABASE_URL in `backend/.env`
- [ ] Filled in SUPABASE_ANON_KEY in `backend/.env`
- [ ] Set PORT in `backend/.env` (default: 3001)
- [ ] Set PROXY_PORT in `backend/.env` (default: 3002)
- [ ] Set FRONTEND_URL in `backend/.env` (default: http://localhost:5173)
- [ ] Copied `frontend/.env.example` to `frontend/.env`
- [ ] Verified VITE_API_URL in `frontend/.env`
- [ ] Verified VITE_SOCKET_URL in `frontend/.env`

## Installation

- [ ] Ran `npm install` in root directory
- [ ] Ran `npm install` in backend directory
- [ ] Ran `npm install` in frontend directory
- [ ] OR ran `npm run install:all` from root

## Database Verification

- [ ] Connected to Supabase database
- [ ] Verified `mocks` table exists
- [ ] Verified `scenarios` table exists
- [ ] Verified `recording_sessions` table exists
- [ ] Verified `recorded_requests` table exists
- [ ] Verified indexes are created

## Server Startup

- [ ] Started backend server: `cd backend && npm run dev`
- [ ] Backend started successfully on port 3001
- [ ] Started frontend server: `cd frontend && npm run dev`
- [ ] Frontend started successfully on port 5173
- [ ] OR ran `npm run dev` from root (both servers started)

## Application Verification

### Traffic Inspector
- [ ] Opened http://localhost:5173 in browser
- [ ] Navigated to Traffic Inspector tab
- [ ] WebSocket connection shows "Connected"
- [ ] Made a test request through proxy
- [ ] Request appeared in traffic list
- [ ] Clicked request to view details
- [ ] Details panel showed request/response data

### API Mocks
- [ ] Navigated to API Mocks tab
- [ ] Clicked "New Mock"
- [ ] Created a mock for `/api/test`
- [ ] Mock appeared in list
- [ ] Made request to `/api/test` through proxy
- [ ] Received mock response
- [ ] Traffic Inspector showed "Mock" badge
- [ ] Toggled mock off
- [ ] Request went to real API (or failed if no real API)
- [ ] Toggled mock back on
- [ ] Edited mock
- [ ] Deleted mock

### Scenarios
- [ ] Navigated to Scenarios tab
- [ ] Clicked "New Scenario"
- [ ] Created error scenario (500)
- [ ] Made request to endpoint
- [ ] Received 500 error
- [ ] Created delay scenario (2000ms)
- [ ] Made request to endpoint
- [ ] Response took 2+ seconds
- [ ] Created timeout scenario
- [ ] Made request to endpoint
- [ ] Request timed out
- [ ] Created custom response scenario
- [ ] Made request to endpoint
- [ ] Received custom response
- [ ] Toggled scenarios on/off
- [ ] Deleted scenario

### Record & Replay
- [ ] Navigated to Record & Replay tab
- [ ] Clicked "Start Recording"
- [ ] Entered session name
- [ ] Made several API requests
- [ ] Clicked "Stop Recording"
- [ ] Session appeared in list
- [ ] Clicked eye icon to view details
- [ ] Saw all recorded requests
- [ ] Clicked download icon to export
- [ ] JSON file downloaded successfully
- [ ] Deleted session

### Settings
- [ ] Navigated to Settings tab
- [ ] Changed proxy port
- [ ] Changed target URL
- [ ] Saved settings
- [ ] Settings persisted in localStorage

## Troubleshooting

If you encounter issues:

1. **Backend won't start**
   - Check if port 3001 is already in use
   - Verify Node.js version is 18+
   - Check backend/.env file exists

2. **Frontend won't start**
   - Check if port 5173 is already in use
   - Verify dependencies are installed
   - Check frontend/.env file exists

3. **Supabase connection fails**
   - Verify SUPABASE_URL is correct
   - Verify SUPABASE_ANON_KEY is correct
   - Check Supabase project is active
   - Ensure database schema was run

4. **WebSocket won't connect**
   - Verify backend is running
   - Check VITE_SOCKET_URL in frontend/.env
   - Check CORS settings in backend/.env

5. **Proxy not intercepting requests**
   - Ensure you're using the proxy URL
   - Check target parameter is correct
   - Verify proxy middleware is loaded

6. **Tailwind CSS not working**
   - Install dependencies: `cd frontend && npm install`
   - Restart frontend server
   - Check tailwind.config.js exists

## Next Steps

Once setup is complete:

1. Read the [GUIDES.md](./GUIDES.md) for detailed usage instructions
2. Configure your frontend application to use the proxy
3. Create mocks for your API endpoints
4. Set up scenarios for testing error conditions
5. Record real API traffic for offline development
6. Share recordings with your team

## Support

For issues:
- Check the README.md troubleshooting section
- Review the GUIDES.md for detailed instructions
- Open an issue on GitHub
