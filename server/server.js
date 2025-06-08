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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'AcademiaOS Server' });
});



// ==============================================
// Semantic Scholar API Proxy (CORS fix)
// ==============================================

app.get('/api/semantic-scholar/*', async (req, res) => {
  try {
    const path = req.params[0];
    const queryString = req.url.split('?')[1] || '';
    const url = `https://api.semanticscholar.org/${path}${queryString ? `?${queryString}` : ''}`;
    
    console.log('📚 Proxying Semantic Scholar request to:', url);
    console.log('📚 Original request path:', req.path);
    console.log('📚 Extracted path:', path);
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'User-Agent': 'AcademiaOS/2.0',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Semantic Scholar proxy error:', error.message);
    res.status(500).json({ error: 'Proxy request failed' });
  }
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