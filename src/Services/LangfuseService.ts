import { Langfuse } from "langfuse";

interface LangfuseTrace {
  id: string;
  name: string;
  input?: any;
  output?: any;
  metadata?: any;
  startTime: Date;
  endTime?: Date;
}

interface LangfuseConfig {
  publicKey: string;
  secretKey: string;
  baseUrl?: string;
  userId?: string;
  sessionId?: string;
}

export class LangfuseService {
  private static instance: Langfuse | null = null;
  private static currentTrace: any = null;
  private static currentSpan: any = null;

  private static getLangfuseConfig(): LangfuseConfig | null {
    const modelConfig = localStorage.getItem("modelConfig");
    if (modelConfig) {
      const config = JSON.parse(modelConfig);
      if (config.langfusePublicKey && config.langfuseSecretKey) {
        return {
          publicKey: config.langfusePublicKey,
          secretKey: config.langfuseSecretKey,
          baseUrl: config.langfuseBaseUrl || "https://cloud.langfuse.com",
          userId: config.langfuseUserId,
          sessionId: config.langfuseSessionId
        };
      }
    }
    return null;
  }

  /**
   * Initialize Langfuse client
   */
  static initializeLangfuse(): Langfuse | null {
    const config = this.getLangfuseConfig();
    if (!config) {
      console.warn('Langfuse configuration not found');
      return null;
    }

    try {
      this.instance = new Langfuse({
        publicKey: config.publicKey,
        secretKey: config.secretKey,
        baseUrl: config.baseUrl,
      });
      
      console.log('✅ Langfuse initialized successfully');
      return this.instance;
    } catch (error) {
      console.error('❌ Failed to initialize Langfuse:', error);
      return null;
    }
  }

  /**
   * Get or create Langfuse instance
   */
  static getInstance(): Langfuse | null {
    if (!this.instance) {
      return this.initializeLangfuse();
    }
    return this.instance;
  }

  /**
   * Check if Langfuse is configured
   */
  static isLangfuseConfigured(): boolean {
    const config = this.getLangfuseConfig();
    return !!(config?.publicKey && config?.secretKey);
  }

  /**
   * Start a new trace for a workflow
   */
  static startTrace(name: string, input?: any, metadata?: any): any {
    const langfuse = this.getInstance();
    if (!langfuse) return null;

    try {
      const config = this.getLangfuseConfig();
      this.currentTrace = langfuse.trace({
        name,
        input,
        metadata: {
          ...metadata,
          userId: config?.userId,
          sessionId: config?.sessionId,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`🔍 Started Langfuse trace: ${name}`);
      return this.currentTrace;
    } catch (error) {
      console.error('Failed to start Langfuse trace:', error);
      return null;
    }
  }

  /**
   * End the current trace
   */
  static endTrace(output?: any, metadata?: any): void {
    if (this.currentTrace) {
      try {
        this.currentTrace.update({
          output,
          metadata: {
            ...metadata,
            endTime: new Date().toISOString(),
          },
        });
        
        console.log('✅ Ended Langfuse trace');
        this.currentTrace = null;
      } catch (error) {
        console.error('Failed to end Langfuse trace:', error);
      }
    }
  }

  /**
   * Start a span within the current trace
   */
  static startSpan(name: string, input?: any, metadata?: any): any {
    if (!this.currentTrace) {
      console.warn('No active trace to create span');
      return null;
    }

    try {
      this.currentSpan = this.currentTrace.span({
        name,
        input,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`🔍 Started Langfuse span: ${name}`);
      return this.currentSpan;
    } catch (error) {
      console.error('Failed to start Langfuse span:', error);
      return null;
    }
  }

  /**
   * End the current span
   */
  static endSpan(output?: any, metadata?: any): void {
    if (this.currentSpan) {
      try {
        this.currentSpan.update({
          output,
          metadata: {
            ...metadata,
            endTime: new Date().toISOString(),
          },
        });
        
        console.log('✅ Ended Langfuse span');
        this.currentSpan = null;
      } catch (error) {
        console.error('Failed to end Langfuse span:', error);
      }
    }
  }

  /**
   * Log a generation (LLM call) within the current trace
   */
  static logGeneration(
    name: string,
    input: any,
    output: any,
    metadata?: any,
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      totalCost?: number;
    }
  ): any {
    const trace = this.currentTrace;
    if (!trace) {
      console.warn('No active trace to log generation');
      return null;
    }

    try {
      const generation = trace.generation({
        name,
        input,
        output,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
        usage,
      });

      console.log(`📝 Logged Langfuse generation: ${name}`);
      return generation;
    } catch (error) {
      console.error('Failed to log Langfuse generation:', error);
      return null;
    }
  }

  /**
   * Create a simple event log
   */
  static logEvent(name: string, input?: any, output?: any, metadata?: any): void {
    const langfuse = this.getInstance();
    if (!langfuse) return;

    try {
      langfuse.event({
        name,
        input,
        output,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`📅 Logged Langfuse event: ${name}`);
    } catch (error) {
      console.error('Failed to log Langfuse event:', error);
    }
  }

  /**
   * Flush pending observations to Langfuse
   */
  static async flush(): Promise<void> {
    const langfuse = this.getInstance();
    if (!langfuse) return;

    try {
      await langfuse.flushAsync();
      console.log('🚀 Flushed Langfuse observations');
    } catch (error) {
      console.error('Failed to flush Langfuse observations:', error);
    }
  }

  /**
   * Shutdown Langfuse client
   */
  static async shutdown(): Promise<void> {
    const langfuse = this.getInstance();
    if (!langfuse) return;

    try {
      await langfuse.shutdownAsync();
      this.instance = null;
      this.currentTrace = null;
      this.currentSpan = null;
      console.log('🔄 Shutdown Langfuse client');
    } catch (error) {
      console.error('Failed to shutdown Langfuse client:', error);
    }
  }

  /**
   * Get Langfuse configuration for LangChain integration
   */
  static getLangChainConfig(): any {
    const config = this.getLangfuseConfig();
    if (!config) return null;

    return {
      publicKey: config.publicKey,
      secretKey: config.secretKey,
      baseUrl: config.baseUrl,
      userId: config.userId,
      sessionId: config.sessionId,
    };
  }

  /**
   * Test Langfuse connection
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    const config = this.getLangfuseConfig();
    if (!config) {
      return { success: false, message: 'No Langfuse configuration found' };
    }

    try {
      const testLangfuse = new Langfuse({
        publicKey: config.publicKey,
        secretKey: config.secretKey,
        baseUrl: config.baseUrl,
      });

      // Create a test event to verify connection
      testLangfuse.event({
        name: "connection_test",
        input: { test: true },
        metadata: { timestamp: new Date().toISOString() },
      });

      await testLangfuse.flushAsync();
      await testLangfuse.shutdownAsync();

      return { success: true, message: 'Langfuse connection successful' };
    } catch (error: any) {
      return { 
        success: false, 
        message: `Langfuse connection failed: ${error.message}` 
      };
    }
  }

  /**
   * Create a dataset for research tracking
   */
  static async createDataset(name: string, description?: string): Promise<any> {
    const langfuse = this.getInstance();
    if (!langfuse) return null;

    try {
      const dataset = await langfuse.createDataset({
        name,
        description,
        metadata: {
          createdAt: new Date().toISOString(),
          project: "academia-os"
        }
      });

      console.log(`📊 Created Langfuse dataset: ${name}`);
      return dataset;
    } catch (error) {
      console.error('Failed to create Langfuse dataset:', error);
      return null;
    }
  }

  /**
   * Score an observation (for evaluation)
   */
  static scoreObservation(
    observationId: string,
    name: string,
    value: number,
    comment?: string
  ): void {
    const langfuse = this.getInstance();
    if (!langfuse) return;

    try {
      langfuse.score({
        traceId: observationId,
        name,
        value,
        comment,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`⭐ Scored observation: ${name} = ${value}`);
    } catch (error) {
      console.error('Failed to score observation:', error);
    }
  }
}