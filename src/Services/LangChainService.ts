import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from 'langchain/chat_models/base';

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
}

class LangChainService {
  private static instance: LangChainService;
  private currentModel: BaseChatModel | null = null;
  private config: ModelConfig | null = null;

  private constructor() {}

  static getInstance(): LangChainService {
    if (!LangChainService.instance) {
      LangChainService.instance = new LangChainService();
    }
    return LangChainService.instance;
  }

  /**
   * Initialize or update the model based on configuration
   */
  initializeModel(config: ModelConfig): BaseChatModel {
    this.config = config;

    if (config.provider === 'anthropic') {
      this.currentModel = new ChatAnthropic({
        anthropicApiKey: config.apiKey,
        modelName: config.model,
        temperature: 0.7,
        maxTokens: 4096,
      });
    } else if (config.provider === 'openai') {
      this.currentModel = new ChatOpenAI({
        openAIApiKey: config.apiKey,
        modelName: config.model,
        temperature: 0.7,
        maxTokens: 4096,
      });
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }

    return this.currentModel;
  }

  /**
   * Get the current model instance
   */
  getModel(): BaseChatModel {
    if (!this.currentModel) {
      // Try to load from localStorage
      const savedConfig = localStorage.getItem('modelConfig');
      if (savedConfig) {
        const config: ModelConfig = JSON.parse(savedConfig);
        return this.initializeModel(config);
      }
      throw new Error('No model configured. Please configure a model first.');
    }
    return this.currentModel;
  }

  /**
   * Check if a model is configured
   */
  isModelConfigured(): boolean {
    return this.currentModel !== null || localStorage.getItem('modelConfig') !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): ModelConfig | null {
    if (this.config) {
      return this.config;
    }
    const savedConfig = localStorage.getItem('modelConfig');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    return null;
  }

  /**
   * Create a chain for academic paper analysis
   */
  async createAcademicAnalysisChain() {
    const model = this.getModel();
    // You can add specific prompts and chains for academic analysis here
    // This is where you'd integrate with existing Academia OS functionality
    return model;
  }

  /**
   * Create a chain for theory development
   */
  async createTheoryDevelopmentChain() {
    const model = this.getModel();
    // Specific chain for theory development tasks
    return model;
  }

  /**
   * Create a chain for literature review
   */
  async createLiteratureReviewChain() {
    const model = this.getModel();
    // Specific chain for literature review tasks
    return model;
  }
}

export default LangChainService;

// Export convenience functions
export const getLangChainService = () => LangChainService.getInstance();
export const getConfiguredModel = () => getLangChainService().getModel();
export const isModelConfigured = () => getLangChainService().isModelConfigured();
