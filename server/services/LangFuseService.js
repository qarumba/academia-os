/**
 * LangFuse Service for Self-Hosted Integration
 * Implements metrics API integration and academic workflow tracking
 * 
 * Based on TDD requirements from GitHub issue #26
 */

const { Langfuse } = require('langfuse');
const { CallbackHandler } = require('langfuse-langchain');

class LangFuseService {
  constructor() {
    this.baseUrl = process.env.LANGFUSE_HOST || 'http://localhost:3030';
    this.publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    this.secretKey = process.env.LANGFUSE_SECRET_KEY;
    
    // Initialize LangFuse SDK
    if (this.secretKey && this.publicKey) {
      this.langfuse = new Langfuse({
        secretKey: this.secretKey,
        publicKey: this.publicKey,
        baseUrl: this.baseUrl
      });
      
      console.log('✅ LangFuse Service initialized');
      console.log('📍 Base URL:', this.baseUrl);
      console.log('🔑 Keys configured:', !!this.publicKey, !!this.secretKey);
      
      // Verify connection on startup
      this.verifyConnection();
    } else {
      console.log('⚠️ LangFuse Service: Missing API keys');
      this.langfuse = null;
    }
  }

  /**
   * Verify connection to self-hosted LangFuse instance
   */
  async verifyConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (response.ok) {
        console.log('✅ Self-hosted LangFuse connection verified');
        return true;
      } else {
        console.log('⚠️ Self-hosted LangFuse health check failed:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Cannot connect to self-hosted LangFuse:', error.message);
      return false;
    }
  }

  /**
   * Create LangChain callback handler for tracing
   * @param {Object} metadata - Additional metadata for traces
   * @returns {CallbackHandler} - Configured callback handler
   */
  createCallbackHandler(metadata = {}) {
    if (!this.langfuse) {
      console.log('⚠️ LangFuse not configured, returning null callback handler');
      return null;
    }

    console.log('🔧 Creating LangChain callback handler with metadata:', metadata);
    
    return new CallbackHandler({
      secretKey: this.secretKey,
      publicKey: this.publicKey,
      baseUrl: this.baseUrl,
      metadata: {
        deployment: 'self-hosted',
        server_side: true,
        ...metadata
      }
    });
  }

  /**
   * Query metrics API with authentication
   * @param {Object} query - Metrics query object
   * @returns {Object} - Metrics response
   */
  async queryMetrics(query) {
    if (!this.publicKey || !this.secretKey) {
      console.log('❌ Metrics API: Missing credentials');
      return null;
    }

    const credentials = Buffer.from(`${this.publicKey}:${this.secretKey}`).toString('base64');
    
    try {
      console.log('📊 Querying metrics API:', query.view, query.metrics?.[0]?.measure);
      
      const response = await fetch(`${this.baseUrl}/api/public/metrics`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        console.log('❌ Metrics API error:', response.status, response.statusText);
        return null;
      }

      const result = await response.json();
      console.log('✅ Metrics query successful, data points:', result.data?.length || 0);
      return result;
    } catch (error) {
      console.log('❌ Metrics API request failed:', error.message);
      return null;
    }
  }

  /**
   * Get current model usage from metrics API
   * @param {string} timeframe - Time window (default: '1h')
   * @returns {Array} - Model usage data
   */
  async getCurrentModelUsage(timeframe = '1h') {
    const fromTime = new Date();
    
    // Calculate timeframe
    switch (timeframe) {
      case '1h':
        fromTime.setHours(fromTime.getHours() - 1);
        break;
      case '24h':
        fromTime.setHours(fromTime.getHours() - 24);
        break;
      case '7d':
        fromTime.setDate(fromTime.getDate() - 7);
        break;
      default:
        fromTime.setHours(fromTime.getHours() - 1);
    }

    const query = {
      view: "observations",
      metrics: [{"measure": "count", "aggregation": "count"}],
      dimensions: [{"field": "providedModelName"}],
      fromTimestamp: fromTime.toISOString()
    };

    console.log('📊 Fetching current model usage for timeframe:', timeframe);
    const result = await this.queryMetrics(query);
    
    if (result?.data) {
      const usage = result.data.map(item => ({
        model: item.providedModelName || 'Unknown',
        count: item.count || 0
      }));
      
      console.log('🤖 Current model usage:', usage);
      return usage;
    }
    
    return [];
  }

  /**
   * Get total cost by model from metrics API
   * @param {string} timeframe - Time window (default: '24h')
   * @returns {Array} - Cost breakdown by model
   */
  async getTotalCostByModel(timeframe = '24h') {
    const fromTime = new Date();
    
    // Calculate timeframe
    switch (timeframe) {
      case '1h':
        fromTime.setHours(fromTime.getHours() - 1);
        break;
      case '24h':
        fromTime.setHours(fromTime.getHours() - 24);
        break;
      case '7d':
        fromTime.setDate(fromTime.getDate() - 7);
        break;
      case '30d':
        fromTime.setDate(fromTime.getDate() - 30);
        break;
      default:
        fromTime.setHours(fromTime.getHours() - 24);
    }

    const query = {
      view: "traces",
      metrics: [{"measure": "totalCost", "aggregation": "sum"}],
      dimensions: [{"field": "providedModelName"}],
      fromTimestamp: fromTime.toISOString(),
      toTimestamp: new Date().toISOString()
    };

    console.log('💰 Fetching cost breakdown for timeframe:', timeframe);
    const result = await this.queryMetrics(query);
    
    if (result?.data) {
      const costs = result.data.map(item => ({
        model: item.providedModelName || 'Unknown',
        cost: item.totalCost || 0
      }));
      
      console.log('💰 Cost breakdown by model:', costs);
      return costs;
    }
    
    return [];
  }

  /**
   * Get comprehensive academic stats for institutional reporting
   * @param {string} timeframe - Time window (default: '30d')
   * @returns {Object} - Academic statistics
   */
  async getAcademicStats(timeframe = '30d') {
    console.log('📚 Generating academic statistics for timeframe:', timeframe);
    
    try {
      // Get parallel metrics
      const [modelUsage, costBreakdown] = await Promise.all([
        this.getCurrentModelUsage(timeframe),
        this.getTotalCostByModel(timeframe)
      ]);

      const totalCost = costBreakdown.reduce((sum, item) => sum + item.cost, 0);
      const totalRequests = modelUsage.reduce((sum, item) => sum + item.count, 0);
      
      const stats = {
        timeframe,
        total_research_sessions: totalRequests,
        institutional_cost: totalCost,
        data_privacy_score: 100, // Self-hosted = 100% privacy
        model_usage: modelUsage,
        cost_breakdown: costBreakdown,
        active_models: modelUsage.filter(m => m.count > 0).map(m => m.model),
        generated_at: new Date().toISOString()
      };

      console.log('📊 Academic stats generated:', {
        sessions: stats.total_research_sessions,
        cost: `$${stats.institutional_cost.toFixed(4)}`,
        models: stats.active_models.length
      });

      return stats;
    } catch (error) {
      console.log('❌ Failed to generate academic stats:', error.message);
      return {
        timeframe,
        total_research_sessions: 0,
        institutional_cost: 0,
        data_privacy_score: 100,
        model_usage: [],
        cost_breakdown: [],
        active_models: [],
        error: error.message,
        generated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Create academic research session trace
   * @param {Object} sessionData - Research session metadata
   * @returns {Object} - Created trace object
   */
  createAcademicSession(sessionData) {
    if (!this.langfuse) {
      console.log('⚠️ Cannot create academic session: LangFuse not configured');
      return null;
    }

    const traceData = {
      name: 'academic-research-session',
      userId: sessionData.userId || 'unknown_researcher',
      sessionId: sessionData.sessionId || `session_${Date.now()}`,
      metadata: {
        project: sessionData.project || 'Untitled Project',
        methodology: sessionData.methodology || 'Unknown',
        irb_approval: sessionData.irb_approval || 'Not Specified',
        institution: sessionData.institution || process.env.UNIVERSITY_NAME || 'Unknown Institution',
        data_classification: 'academic_research',
        privacy_level: 'institutional',
        created_by: 'academia_os',
        ...sessionData.metadata
      }
    };

    console.log('📚 Creating academic research session:', traceData.metadata.project);
    
    const trace = this.langfuse.trace(traceData);
    
    console.log('✅ Academic session created with ID:', trace.id);
    return trace;
  }

  /**
   * Check if LangFuse is properly configured and accessible
   * @returns {Object} - Status object
   */
  async getStatus() {
    const status = {
      configured: !!this.langfuse,
      connected: false,
      baseUrl: this.baseUrl,
      hasCredentials: !!(this.publicKey && this.secretKey),
      timestamp: new Date().toISOString()
    };

    if (status.configured) {
      status.connected = await this.verifyConnection();
    }

    console.log('🔍 LangFuse Service Status:', status);
    return status;
  }

  /**
   * Safely flush all pending traces (for shutdown)
   */
  async flush() {
    if (this.langfuse) {
      console.log('🔄 Flushing LangFuse traces...');
      try {
        await this.langfuse.flushAsync();
        console.log('✅ LangFuse traces flushed successfully');
      } catch (error) {
        console.log('⚠️ Error flushing LangFuse traces:', error.message);
      }
    }
  }
}

// Create singleton instance
const langFuseService = new LangFuseService();

module.exports = langFuseService;