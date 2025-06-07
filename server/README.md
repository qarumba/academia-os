# AcademiaOS Helicone Server

This is the server-side proxy for Helicone API integration, required to bypass CORS limitations in browser environments.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **For development with auto-restart:**
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3001` by default.

## Endpoints

- `GET /health` - Health check
- `POST /api/helicone/requests` - Fetch Helicone requests
- `POST /api/helicone/test` - Test Helicone API connection

## Configuration

The server can be configured via environment variables (create `.env` file):

```env
PORT=3001
NODE_ENV=development
```

## Integration

The React client automatically detects:
- **Development**: Uses `http://localhost:3001/api/helicone`
- **Production**: Uses `/api/helicone` (assumes server is proxied)

## Production Deployment

For production, you can:
1. Deploy this as a separate microservice
2. Integrate into your existing Node.js backend
3. Use a serverless function (Vercel, Netlify, AWS Lambda)

## Security Notes

- API keys are sent via POST body, not headers
- CORS is configured for localhost development
- Add rate limiting and authentication for production use