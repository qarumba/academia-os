# AcademiaOS API Server

This is the server-side proxy for LangFuse AI Observatory and Semantic Scholar API integration, required to bypass CORS limitations in browser environments and provide seamless academic research capabilities.

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

### Health & Status
- `GET /` - Simple status check (returns "OK - AcademiaOS Server is running")
- `GET /health` - Detailed health check with JSON response

### LangFuse AI Observatory
- `GET /api/langfuse/status` - Check LangFuse instance connectivity
- `GET /api/langfuse/usage` - Fetch current model usage metrics  
- `GET /api/langfuse/cost` - Calculate total AI costs for budgeting
- `GET /api/langfuse/stats` - Generate academic research statistics
- `POST /api/langfuse/test` - Test LangFuse connection

## Configuration

The server can be configured via environment variables (create `.env` file):

```env
PORT=3001
NODE_ENV=development
LANGFUSE_HOST=http://localhost:3030
```

## Integration

The React client automatically detects:
- **Development**: Uses `http://localhost:3001/api/langfuse`
- **Production**: Uses `/api/langfuse` (assumes server is proxied)

## LangFuse Observatory Features

- **Self-hosted AI monitoring** for academic data privacy
- **Real-time cost tracking** across OpenAI and Anthropic providers
- **Academic session monitoring** with usage statistics
- **LangChain callback integration** for automatic request tracing
- **PostgreSQL + ClickHouse backend** for comprehensive analytics

## Production Deployment

For production, you can:
1. Deploy this as a separate microservice alongside LangFuse
2. Integrate into your existing Node.js backend
3. Use Docker containers for full-stack deployment
4. Deploy with docker-compose for complete infrastructure

## Docker Support

The server includes Docker support for containerized deployment:

```bash
# Build and run with Docker Compose
docker-compose up -d academia-os-server

# Health check
curl http://localhost:3001/health
```

## Security Notes

- API keys are sent via POST body, not headers
- CORS is configured for localhost development  
- LangFuse provides self-hosted privacy for academic compliance
- Add rate limiting and authentication for production use
- Academic data remains on your infrastructure