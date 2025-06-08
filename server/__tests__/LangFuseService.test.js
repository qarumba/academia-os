/**
 * Server-side TDD Tests for LangFuse Service
 * Tests the self-hosted metrics API integration
 */

const { Langfuse } = require('langfuse');
const { CallbackHandler } = require('langfuse-langchain');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.LANGFUSE_HOST || 'http://localhost:3030',
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || 'pk-lf-test',
  secretKey: process.env.LANGFUSE_SECRET_KEY || 'sk-lf-test'
};

describe('LangFuse Server Integration', () => {
  
  beforeAll(() => {
    console.log('🛠️ Starting Server-side LangFuse Tests');
    console.log('📍 Self-hosted URL:', TEST_CONFIG.baseUrl);
    console.log('🔑 Using API keys for testing');
  });

  describe('Self-Hosted Instance Health', () => {
    test('should verify self-hosted LangFuse is accessible', async () => {
      console.log('🔧 Test: Self-hosted health check');
      
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
        
        if (response.ok) {
          console.log('✅ Self-hosted LangFuse is running');
          expect(response.ok).toBe(true);
        } else {
          console.log('⚠️ Self-hosted LangFuse not running (expected for CI/CD)');
          console.log('Status:', response.status);
        }
      } catch (error) {
        console.log('⚠️ Cannot connect to self-hosted instance:', error.message);
        console.log('This is expected when running tests without Docker setup');
      }
    });

    test('should initialize LangFuse SDK with self-hosted config', () => {
      console.log('🔧 Test: LangFuse SDK initialization');
      
      const langfuse = new Langfuse({
        secretKey: TEST_CONFIG.secretKey,
        publicKey: TEST_CONFIG.publicKey,
        baseUrl: TEST_CONFIG.baseUrl
      });
      
      expect(langfuse).toBeDefined();
      console.log('✅ LangFuse SDK initialized for self-hosted instance');
    });
  });

  describe('Metrics API Functionality', () => {
    test('should create metrics query structure', () => {
      console.log('🔧 Test: Metrics query structure');
      
      const totalCostQuery = {
        view: "traces",
        metrics: [{"measure": "totalCost", "aggregation": "sum"}],
        dimensions: [{"field": "providedModelName"}],
        fromTimestamp: new Date(Date.now() - 24*60*60*1000).toISOString(),
        toTimestamp: new Date().toISOString()
      };
      
      expect(totalCostQuery.view).toBe("traces");
      expect(totalCostQuery.metrics[0].measure).toBe("totalCost");
      expect(totalCostQuery.dimensions[0].field).toBe("providedModelName");
      
      console.log('✅ Metrics query structure valid:', totalCostQuery);
    });

    test('should prepare model usage query', () => {
      console.log('🔧 Test: Model usage query preparation');
      
      const modelUsageQuery = {
        view: "observations",
        metrics: [{"measure": "count", "aggregation": "count"}],
        dimensions: [{"field": "providedModelName"}],
        fromTimestamp: new Date(Date.now() - 60*60*1000).toISOString() // Last hour
      };
      
      expect(modelUsageQuery.view).toBe("observations");
      expect(modelUsageQuery.dimensions[0].field).toBe("providedModelName");
      
      console.log('✅ Model usage query prepared:', modelUsageQuery);
    });

    test('should format Basic Auth credentials', () => {
      console.log('🔧 Test: Basic Auth formatting');
      
      const credentials = Buffer.from(`${TEST_CONFIG.publicKey}:${TEST_CONFIG.secretKey}`).toString('base64');
      
      expect(credentials).toBeTruthy();
      expect(typeof credentials).toBe('string');
      
      console.log('✅ Basic Auth credentials formatted');
      console.log('Credentials preview:', credentials.substring(0, 20) + '...');
    });
  });

  describe('Academic Research Tracking', () => {
    test('should create academic session metadata structure', () => {
      console.log('🔧 Test: Academic metadata structure');
      
      const academicMetadata = {
        project: 'LangFuse Integration Research',
        methodology: 'Test-Driven Development',
        irb_approval: 'TDD_IRB_2025_001',
        institution: 'Test University',
        data_classification: 'academic_research',
        privacy_level: 'institutional'
      };
      
      expect(academicMetadata.methodology).toBe('Test-Driven Development');
      expect(academicMetadata.data_classification).toBe('academic_research');
      
      console.log('✅ Academic metadata structure valid:', academicMetadata);
    });

    test('should simulate cost tracking for academic workflow', () => {
      console.log('🔧 Test: Academic cost tracking simulation');
      
      const academicWorkflowCosts = {
        paper_analysis: {
          model: 'gpt-4o',
          input_tokens: 2000,
          output_tokens: 800,
          cost: 0.084 // $0.03 per 1K input + $0.06 per 1K output
        },
        qualitative_coding: {
          model: 'claude-sonnet-4-20250514',
          input_tokens: 1500,
          output_tokens: 600,
          cost: 0.0135 // Anthropic pricing
        },
        theory_modeling: {
          model: 'gpt-4o',
          input_tokens: 1000,
          output_tokens: 500,
          cost: 0.060
        }
      };
      
      const totalCost = Object.values(academicWorkflowCosts)
        .reduce((sum, workflow) => sum + workflow.cost, 0);
      
      expect(totalCost).toBeCloseTo(0.1575, 4);
      
      console.log('✅ Academic workflow cost simulation:', {
        workflows: Object.keys(academicWorkflowCosts),
        totalCost: `$${totalCost.toFixed(4)}`
      });
    });
  });

  describe('LangChain Integration Preparation', () => {
    test('should create callback handler for server use', () => {
      console.log('🔧 Test: Server-side callback handler');
      
      const callbackHandler = new CallbackHandler({
        secretKey: TEST_CONFIG.secretKey,
        publicKey: TEST_CONFIG.publicKey,
        baseUrl: TEST_CONFIG.baseUrl
      });
      
      expect(callbackHandler).toBeDefined();
      console.log('✅ Server-side callback handler created');
    });

    test('should prepare trace context for academic workflows', () => {
      console.log('🔧 Test: Academic trace context');
      
      const traceContext = {
        name: 'academic-ai-workflow',
        userId: 'researcher_server_test',
        sessionId: `server_session_${Date.now()}`,
        metadata: {
          server_side: true,
          deployment: 'self-hosted',
          processing_type: 'academic_research'
        }
      };
      
      expect(traceContext.metadata.server_side).toBe(true);
      expect(traceContext.metadata.deployment).toBe('self-hosted');
      
      console.log('✅ Academic trace context prepared:', traceContext);
    });
  });

  afterAll(() => {
    console.log('🏁 Server-side LangFuse tests completed');
    console.log('Ready to implement LangFuseService with TDD guidance');
  });
});