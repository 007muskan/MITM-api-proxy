# How-To Guides

This document provides detailed instructions for using each feature of the MITM API Proxy Platform.

## Table of Contents

1. [Setting Up Your First Mock](#setting-up-your-first-mock)
2. [Recording and Replaying API Traffic](#recording-and-replaying-api-traffic)
3. [Testing Error Scenarios](#testing-error-scenarios)
4. [Using the Traffic Inspector](#using-the-traffic-inspector)
5. [Configuring Your Frontend to Use the Proxy](#configuring-your-frontend-to-use-the-proxy)

---

## Setting Up Your First Mock

### Scenario
You're building a user profile feature but the backend `/api/users/:id` endpoint isn't ready yet.

### Steps

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Open the Dashboard**
   Navigate to `http://localhost:5173`

3. **Create a Mock**
   - Click the "API Mocks" tab in the sidebar
   - Click the "New Mock" button
   - Fill in the form:
     - **URL**: `/api/users/1`
     - **Method**: `GET`
     - **Status Code**: `200`
     - **Response Body**:
       ```json
       {
         "id": 1,
         "name": "John Doe",
         "email": "john@example.com",
         "role": "admin"
       }
       ```
   - Click "Create Mock"

4. **Test the Mock**
   - Configure your frontend to use the proxy (see [Configuring Your Frontend](#configuring-your-frontend-to-use-the-proxy))
   - Make a request to `/api/users/1` through the proxy
   - You should receive the mock response

5. **Verify in Traffic Inspector**
   - Go to the "Traffic Inspector" tab
   - You'll see the request with a "Mock" badge
   - Click on it to view the mock response

### Tips
- Create multiple mocks for different endpoints
- Use the toggle to quickly enable/disable mocks
- Edit mocks to test different response scenarios
- Mocks persist in Supabase, so they survive server restarts

---

## Recording and Replaying API Traffic

### Scenario
You want to capture real API responses from production to test your frontend offline.

### Steps

1. **Start Recording**
   - Navigate to the "Record & Replay" tab
   - Click "Start Recording"
   - Enter a name: "Production API Capture"
   - Click OK

2. **Generate Traffic**
   - Make API requests through the proxy
   - The recording indicator will show "Recording in progress"
   - All requests are automatically captured

3. **Stop Recording**
   - Click "Stop Recording" when done
   - The session is saved with all captured requests

4. **View Recorded Session**
   - Click the eye icon on the session
   - View all captured requests with full details
   - See timestamps, response times, and status codes

5. **Export Recording**
   - Click the download icon on the session
   - The recording is exported as JSON
   - Share with team members or save for later

6. **Delete Recording**
   - Click the trash icon on the session
   - Confirm deletion
   - The session and all its requests are removed

### Use Cases
- Capture production traffic for offline development
- Record API responses for regression testing
- Document API behavior
- Share test data with team members

---

## Testing Error Scenarios

### Scenario
You want to test how your frontend handles API failures and slow responses.

### Steps

### Testing 500 Errors

1. **Create Error Scenario**
   - Navigate to "Scenarios" tab
   - Click "New Scenario"
   - Fill in:
     - **URL**: `/api/users`
     - **Scenario Type**: `Error Response`
     - **Status Code**: `500`
   - Click "Create Scenario"

2. **Test Error Handling**
   - Make a request to `/api/users`
   - You'll receive a 500 error
   - Verify your frontend shows an error message

### Testing Delayed Responses

1. **Create Delay Scenario**
   - Navigate to "Scenarios" tab
   - Click "New Scenario"
   - Fill in:
     - **URL**: `/api/users`
     - **Scenario Type**: `Delayed Response`
     - **Delay (ms)**: `5000`
   - Click "Create Scenario"

2. **Test Loading States**
   - Make a request to `/api/users`
   - The response will take 5 seconds
   - Verify your loading spinner appears

### Testing Timeouts

1. **Create Timeout Scenario**
   - Navigate to "Scenarios" tab
   - Click "New Scenario"
   - Fill in:
     - **URL**: `/api/users`
     - **Scenario Type**: `Timeout`
   - Click "Create Scenario"

2. **Test Timeout Handling**
   - Make a request to `/api/users`
   - No response will be sent
   - Verify your frontend handles the timeout

### Testing Custom Responses

1. **Create Custom Scenario**
   - Navigate to "Scenarios" tab
   - Click "New Scenario"
   - Fill in:
     - **URL**: `/api/users`
     - **Scenario Type**: `Custom Response`
     - **Status Code**: `418`
     - **Custom Response**:
       ```json
       {
         "error": "I'm a teapot",
         "message": "This is a custom error"
       }
       ```
   - Click "Create Scenario"

2. **Test Custom Response**
   - Make a request to `/api/users`
   - You'll receive your custom response

### Tips
- Toggle scenarios on/off to switch between normal and test modes
- Combine scenarios with mocks for comprehensive testing
- Use scenarios to test edge cases without backend changes

---

## Using the Traffic Inspector

### Scenario
You want to debug why an API request is failing or taking too long.

### Steps

1. **Monitor Traffic**
   - Navigate to "Traffic Inspector" tab
   - Make API requests through the proxy
   - Watch requests appear in real-time

2. **Filter Traffic**
   - Use the URL filter to find specific endpoints
   - Use the method filter to show only GET, POST, etc.
   - Combine filters for precise results

3. **View Request Details**
   - Click on any request in the list
   - View the request details panel on the right
   - See:
     - Request URL and method
     - Query parameters
     - Request headers
     - Request body
     - Response status code
     - Response headers
     - Response body
     - Response time

4. **Identify Issues**
   - **Slow responses**: Check response time column
   - **Errors**: Look for red status codes (4xx, 5xx)
   - **Wrong data**: Compare response body with expectations
   - **Missing headers**: Check request headers

5. **Clear Traffic**
   - Click "Clear Traffic" to reset the list
   - Useful when starting a new debugging session

### Tips
- The traffic list keeps the last 100 requests
- Mocked requests show a "Mock" badge
- Scenario-triggered requests show a "Scenario" badge
- Use the timestamp to correlate with frontend logs

---

## Configuring Your Frontend to Use the Proxy

### Scenario
You have an existing React application and want to use the MITM proxy.

### Option 1: Environment Variable (Recommended)

1. **Update Your Frontend .env**
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api/proxy?target=https://your-real-api.com
   ```

2. **Update Your API Calls**
   ```javascript
   const apiUrl = import.meta.env.VITE_API_BASE_URL;
   
   fetch(`${apiUrl}/users`)
     .then(response => response.json())
     .then(data => console.log(data));
   ```

### Option 2: Axios Base URL

1. **Configure Axios**
   ```javascript
   import axios from 'axios';
   
   const api = axios.create({
     baseURL: 'http://localhost:3001/api/proxy?target=https://your-real-api.com'
   });
   
   export default api;
   ```

2. **Use the Configured Instance**
   ```javascript
   import api from './api';
   
   api.get('/users')
     .then(response => console.log(response.data));
   ```

### Option 3: Proxy Configuration in Vite

1. **Update vite.config.js**
   ```javascript
   export default defineConfig({
     plugins: [react()],
     server: {
       proxy: {
         '/api': {
           target: 'http://localhost:3001',
           changeOrigin: true,
           rewrite: (path) => path.replace(/^\/api/, '/api/proxy?target=https://your-real-api.com')
         }
       }
     }
   });
   ```

2. **Use Normal API Paths**
   ```javascript
   fetch('/api/users')
     .then(response => response.json())
     .then(data => console.log(data));
   ```

### Testing Your Configuration

1. **Start the MITM Proxy**
   ```bash
   npm run dev
   ```

2. **Make a Test Request**
   ```javascript
   fetch('http://localhost:3001/api/proxy?target=https://jsonplaceholder.typicode.com/users')
     .then(response => response.json())
     .then(data => console.log(data));
   ```

3. **Verify in Traffic Inspector**
   - Navigate to "Traffic Inspector"
   - You should see the request appear
   - Click on it to view details

### Common Issues

**CORS Errors**
- Ensure the backend CORS is configured correctly
- Check that FRONTEND_URL in backend/.env matches your frontend URL

**Connection Refused**
- Verify the backend server is running on port 3001
- Check that no firewall is blocking the connection

**Requests Not Appearing**
- Ensure you're using the proxy URL, not the direct API URL
- Check that the target parameter is correct
- Verify the proxy middleware is loaded

---

## Best Practices

### Development Workflow

1. **Start with Recording**
   - Record real API traffic from staging/production
   - Export the recording for reference

2. **Create Mocks Based on Recordings**
   - Use recorded responses as mock data
   - Create mocks for all endpoints you need

3. **Test with Scenarios**
   - Add error scenarios to test error handling
   - Add delay scenarios to test loading states

4. **Monitor with Traffic Inspector**
   - Keep the inspector open while developing
   - Use it to debug issues quickly

5. **Iterate Quickly**
   - Toggle mocks and scenarios on/off
   - Test different response formats
   - No need to wait for backend changes

### Team Collaboration

1. **Share Recordings**
   - Export recordings as JSON
   - Commit to version control
   - Share with team members

2. **Document Mocks**
   - Use descriptive mock names
   - Add comments in response bodies
   - Document expected behavior

3. **Version Control**
   - Commit database schema changes
   - Document environment setup
   - Share .env.example files

### Production Considerations

1. **Security**
   - Never use in production without authentication
   - Add rate limiting
   - Use HTTPS
   - Implement proper CORS

2. **Performance**
   - Monitor memory usage (traffic data is in-memory)
   - Implement traffic cleanup
   - Add pagination for recorded sessions

3. **Monitoring**
   - Add logging for proxy operations
   - Monitor WebSocket connections
   - Track mock/scenario usage

---

## Troubleshooting

### Mock Not Working

**Symptom**: Request goes to real API instead of mock

**Solutions**:
- Verify the mock is enabled (green dot)
- Check that the URL matches exactly (case-sensitive)
- Ensure the HTTP method matches
- Check the Traffic Inspector for errors

### Scenario Not Triggering

**Symptom**: Request returns normal response instead of scenario

**Solutions**:
- Verify the scenario is enabled
- Check that the URL matches exactly
- Ensure no mock is taking precedence
- Check the Traffic Inspector for scenario badge

### Recording Not Saving

**Symptom**: Requests not being recorded

**Solutions**:
- Verify recording is active (red indicator)
- Check Supabase connection
- Look for errors in backend console
- Ensure database schema is correct

### WebSocket Not Connecting

**Symptom**: "Disconnected" status in Traffic Inspector

**Solutions**:
- Verify backend is running
- Check VITE_SOCKET_URL in frontend/.env
- Ensure CORS is configured correctly
- Check browser console for errors

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Socket.IO Documentation](https://socket.io/docs/)
- [http-proxy-middleware Documentation](https://github.com/chimurai/http-proxy-middleware)
- [Express.js Documentation](https://expressjs.com/)
