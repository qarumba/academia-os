const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

// Import LangFuse service
const langFuseService = require('./services/LangFuseService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Root endpoint - simple browser-friendly health check
app.get('/', (req, res) => {
  res.send('OK - AcademiaOS Server is running');
});

// Health check endpoint (detailed JSON)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'AcademiaOS Server' });
});



// ==============================================
// Semantic Scholar API Proxy (CORS fix + Rate Limiting)
// ==============================================

// Server-side rate limiting for Semantic Scholar API
class SemanticScholarRateLimit {
  constructor() {
    this.lastRequestTime = 0;
    this.REQUEST_DELAY = 5000; // 5 seconds between requests
    this.rateLimitResetTime = 0;
  }

  async waitForRateLimit() {
    const now = Date.now();
    
    // If we hit a rate limit recently, wait longer
    if (this.rateLimitResetTime > now) {
      const waitTime = this.rateLimitResetTime - now;
      console.log(`⏳ Server rate limit cooldown: waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Normal rate limiting
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      const waitTime = this.REQUEST_DELAY - timeSinceLastRequest;
      console.log(`⏳ Server rate limiting: waiting ${Math.ceil(waitTime / 1000)}s before next request...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  handleRateLimit() {
    // Set a 10-second cooldown after hitting rate limit
    this.rateLimitResetTime = Date.now() + 10000;
    console.warn('🚫 Hit Semantic Scholar rate limit - implementing 10s server cooldown');
  }

  getRateLimitStatus() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const nextRequestAllowedAt = this.lastRequestTime + this.REQUEST_DELAY;
    const cooldownEndsAt = this.rateLimitResetTime;
    
    return {
      canMakeRequest: timeSinceLastRequest >= this.REQUEST_DELAY && now >= this.rateLimitResetTime,
      nextRequestAllowedAt,
      cooldownEndsAt: this.rateLimitResetTime > now ? cooldownEndsAt : null,
      timeSinceLastRequest,
      requestDelay: this.REQUEST_DELAY
    };
  }
}

// Create singleton rate limiter
const rateLimiter = new SemanticScholarRateLimit();

// Allowlisted Semantic Scholar API endpoints for security
const ALLOWED_SS_ENDPOINTS = [
  'graph/v1/paper/search',
  'graph/v1/paper/batch', 
  'graph/v1/author/search',
  'graph/v1/author/batch',
  'graph/v1/recommendations',
  // Legacy v1 endpoints (if needed)
  'v1/paper/search',
  'v1/paper/batch',
  'v1/author/search', 
  'v1/author/batch',
  // Direct endpoints (if needed)
  'paper/search',
  'paper/batch',
  'author/search',
  'author/batch',
  'recommendations'
];

// Validate if the requested path is allowed
function isValidSemanticScholarPath(path) {
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  // Remove any leading slashes and normalize
  const normalizedPath = path.replace(/^\/+/, '');
  
  // Check if path matches any allowed endpoint exactly or starts with it
  return ALLOWED_SS_ENDPOINTS.some(endpoint => 
    normalizedPath === endpoint || normalizedPath.startsWith(endpoint + '?')
  );
}

// SECURITY: Map validated user input to predefined safe endpoint URLs
// This prevents any user input from being directly concatenated into URLs
function getValidatedSemanticScholarEndpoint(userPath) {
  if (!userPath || typeof userPath !== 'string') {
    return null;
  }
  
  // Remove any leading slashes and normalize
  const normalizedPath = userPath.replace(/^\/+/, '').split('?')[0]; // Remove query params for mapping
  
  // Predefined safe endpoint mappings (no user input concatenation)
  const endpointMap = {
    'graph/v1/paper/search': 'https://api.semanticscholar.org/graph/v1/paper/search',
    'graph/v1/paper/batch': 'https://api.semanticscholar.org/graph/v1/paper/batch',
    'graph/v1/author/search': 'https://api.semanticscholar.org/graph/v1/author/search',
    'graph/v1/author/batch': 'https://api.semanticscholar.org/graph/v1/author/batch',
    'graph/v1/recommendations': 'https://api.semanticscholar.org/graph/v1/recommendations',
    'v1/paper/search': 'https://api.semanticscholar.org/v1/paper/search',
    'v1/paper/batch': 'https://api.semanticscholar.org/v1/paper/batch',
    'v1/author/search': 'https://api.semanticscholar.org/v1/author/search',
    'v1/author/batch': 'https://api.semanticscholar.org/v1/author/batch',
    'paper/search': 'https://api.semanticscholar.org/paper/search',
    'paper/batch': 'https://api.semanticscholar.org/paper/batch',
    'author/search': 'https://api.semanticscholar.org/author/search',
    'author/batch': 'https://api.semanticscholar.org/author/batch',
    'recommendations': 'https://api.semanticscholar.org/recommendations'
  };
  
  // Return the predefined safe URL or null if not found
  return endpointMap[normalizedPath] || null;
}

app.get('/api/semantic-scholar/*', async (req, res) => {
  try {
    const path = req.params[0];
    
    // Security: Validate the requested path against allowlist
    if (!isValidSemanticScholarPath(path)) {
      console.warn('🚫 Blocked potentially unsafe Semantic Scholar path:', path);
      return res.status(400).json({ 
        error: 'Invalid API endpoint',
        message: 'Only Semantic Scholar paper and author endpoints are allowed'
      });
    }
    
    // Rate limiting: Wait if necessary
    await rateLimiter.waitForRateLimit();
    
    // SECURITY: Construct URL safely to prevent SSRF
    // Map validated path to exact endpoint URL without user input concatenation
    const validatedEndpoint = getValidatedSemanticScholarEndpoint(path);
    if (!validatedEndpoint) {
      console.warn('🚫 Failed to map path to valid endpoint:', path);
      return res.status(400).json({ 
        error: 'Invalid API endpoint mapping',
        message: 'Path could not be mapped to a valid Semantic Scholar endpoint'
      });
    }
    
    // Extract and validate query parameters safely
    const allowedParams = ['query', 'fields', 'offset', 'limit', 'year', 'venue', 'fieldsOfStudy'];
    const safeQueryParams = new URLSearchParams();
    
    // Only allow specific query parameters to prevent SSRF
    for (const [key, value] of new URLSearchParams(req.url.split('?')[1] || '')) {
      if (allowedParams.includes(key)) {
        safeQueryParams.append(key, value);
      }
    }
    
    // Construct URL using predefined endpoint string (no user input)
    const url = new URL(validatedEndpoint);
    url.search = safeQueryParams.toString();
    
    console.log('📚 Proxying Semantic Scholar request to:', url.toString());
    console.log('📚 Original request path:', req.path);
    console.log('📚 Extracted path:', path);
    
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        'User-Agent': 'AcademiaOS/2.0',
        'Accept': 'application/json'
      }
    });
    
    // Handle rate limiting response from Semantic Scholar
    if (response.status === 429) {
      rateLimiter.handleRateLimit();
      return res.status(429).json({ 
        error: 'Rate limit exceeded', 
        message: 'Please wait 10+ seconds before searching again.',
        retryAfter: 10
      });
    }
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Semantic Scholar proxy error:', error.message);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// Rate limit status endpoint for client feedback
app.get('/api/semantic-scholar-rate-limit-status', (req, res) => {
  const status = rateLimiter.getRateLimitStatus();
  res.json(status);
});

// ==============================================
// LangFuse API Endpoints (Self-Hosted)
// ==============================================

// LangFuse health check
app.get('/api/langfuse/health', async (req, res) => {
  console.log('🔍 LangFuse health check requested');
  
  try {
    const status = await langFuseService.getStatus();
    
    if (status.configured && status.connected) {
      res.json({ 
        status: 'OK', 
        service: 'LangFuse Self-Hosted',
        ...status
      });
    } else {
      res.status(503).json({ 
        status: 'Unavailable', 
        service: 'LangFuse Self-Hosted',
        ...status
      });
    }
  } catch (error) {
    console.log('❌ LangFuse health check error:', error.message);
    res.status(500).json({ 
      status: 'Error', 
      service: 'LangFuse Self-Hosted',
      error: error.message
    });
  }
});

// Get current model usage
app.get('/api/langfuse/current-model', async (req, res) => {
  console.log('📊 Current model usage requested');
  
  try {
    const timeframe = req.query.timeframe || '1h';
    const usage = await langFuseService.getCurrentModelUsage(timeframe);
    
    res.json({
      data: usage,
      timeframe,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('❌ Current model usage error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch current model usage',
      details: error.message
    });
  }
});

// Get total cost breakdown
app.get('/api/langfuse/total-cost', async (req, res) => {
  console.log('💰 Total cost breakdown requested');
  
  try {
    const timeframe = req.query.timeframe || '24h';
    const costs = await langFuseService.getTotalCostByModel(timeframe);
    
    res.json({
      data: costs,
      timeframe,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('❌ Total cost breakdown error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch cost breakdown',
      details: error.message
    });
  }
});

// Get comprehensive academic statistics
app.get('/api/langfuse/academic-stats', async (req, res) => {
  console.log('📚 Academic statistics requested');
  
  try {
    const timeframe = req.query.timeframe || '30d';
    const stats = await langFuseService.getAcademicStats(timeframe);
    
    res.json(stats);
  } catch (error) {
    console.log('❌ Academic statistics error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate academic statistics',
      details: error.message
    });
  }
});

// Get model metrics (combined usage and cost)
app.get('/api/langfuse/model-metrics', async (req, res) => {
  console.log('📈 Model metrics requested');
  
  try {
    const timeframe = req.query.timeframe || '24h';
    
    // Get both usage and cost data
    const [usage, costs] = await Promise.all([
      langFuseService.getCurrentModelUsage(timeframe),
      langFuseService.getTotalCostByModel(timeframe)
    ]);
    
    // Combine the data
    const metrics = usage.map(usageItem => {
      const costItem = costs.find(c => c.model === usageItem.model);
      return {
        model_name: usageItem.model,
        request_count: usageItem.count,
        total_cost: costItem?.cost || 0,
        avg_latency: 0 // TODO: Add latency metrics
      };
    });
    
    res.json({
      data: metrics,
      timeframe,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('❌ Model metrics error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch model metrics',
      details: error.message
    });
  }
});

// Create academic research session
app.post('/api/langfuse/academic-session', async (req, res) => {
  console.log('📚 Academic session creation requested');
  
  try {
    const sessionData = req.body;
    const trace = langFuseService.createAcademicSession(sessionData);
    
    if (trace) {
      res.json({
        success: true,
        trace_id: trace.id,
        session_id: sessionData.sessionId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'LangFuse not configured'
      });
    }
  } catch (error) {
    console.log('❌ Academic session creation error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create academic session',
      details: error.message
    });
  }
});

// Test LangFuse configuration
app.post('/api/langfuse/test', async (req, res) => {
  console.log('🧪 LangFuse configuration test requested');
  
  try {
    const status = await langFuseService.getStatus();
    
    if (status.configured && status.connected) {
      res.json({
        success: true,
        message: 'LangFuse self-hosted connection successful',
        status
      });
    } else {
      res.json({
        success: false,
        message: 'LangFuse configuration incomplete or unreachable',
        status
      });
    }
  } catch (error) {
    console.log('❌ LangFuse test error:', error.message);
    res.json({
      success: false,
      message: `LangFuse test failed: ${error.message}`
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AcademiaOS AI Observatory running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔄 Helicone API endpoints ready (legacy)`);
  console.log(`🧠 LangFuse API endpoints ready (self-hosted)`);
  console.log(`📈 Available endpoints:`);
  console.log(`   - GET  /api/langfuse/health`);
  console.log(`   - GET  /api/langfuse/current-model`);
  console.log(`   - GET  /api/langfuse/total-cost`);
  console.log(`   - GET  /api/langfuse/academic-stats`);
  console.log(`   - GET  /api/langfuse/model-metrics`);
  console.log(`   - POST /api/langfuse/academic-session`);
  console.log(`   - POST /api/langfuse/test`);
});

module.exports = app;