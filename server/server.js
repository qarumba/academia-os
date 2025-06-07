const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

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
  res.json({ status: 'OK', service: 'AcademiaOS Helicone Proxy' });
});

// Helicone API proxy endpoints
app.post('/api/helicone/requests', async (req, res) => {
  try {
    const { apiKey, limit = 50 } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const response = await fetch(`https://api.helicone.ai/v1/request?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ 
        error: `Helicone API error: ${response.status}`,
        details: errorData 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Helicone proxy error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Test connection endpoint
app.post('/api/helicone/test', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'API key is required' 
      });
    }

    const response = await fetch(`https://api.helicone.ai/v1/request?limit=1`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return res.json({ 
          success: false, 
          message: 'Invalid Helicone API key. Please check your configuration.' 
        });
      } else {
        return res.json({ 
          success: false, 
          message: `Helicone API error: ${response.status} ${response.statusText}` 
        });
      }
    }

    await response.json(); // Validate JSON response
    res.json({ 
      success: true, 
      message: 'Helicone API connection successful' 
    });
  } catch (error) {
    console.error('Helicone test error:', error);
    res.json({ 
      success: false, 
      message: `Connection failed: ${error.message}` 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AcademiaOS Helicone Proxy running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔄 Helicone API endpoints ready`);
});

module.exports = app;