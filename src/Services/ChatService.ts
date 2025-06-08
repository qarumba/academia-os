import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

// LangFuse integration
let CallbackHandler: any = null;
let langfuseAvailable = false;

// Anthropic integration with LangChain v0.3
let ChatAnthropic: any = null;
let anthropicAvailable = false;

// Initialize Anthropic support with proper async import
const initializeAnthropic = async () => {
  try {
    const { ChatAnthropic: AnthropicClass } = await import('@langchain/anthropic');
    ChatAnthropic = AnthropicClass;
    anthropicAvailable = true;
    console.log('✅ Anthropic integration initialized successfully');
    return true;
  } catch (error: any) {
    console.warn('❌ Anthropic package initialization failed:', error?.message || error);
    anthropicAvailable = false;
    return false;
  }
};

// Initialize LangFuse callback handler support
const initializeLangFuse = async () => {
  try {
    const { CallbackHandler: LangFuseCallbackHandler } = await import('langfuse-langchain');
    CallbackHandler = LangFuseCallbackHandler;
    langfuseAvailable = true;
    console.log('✅ LangFuse callback handler initialized successfully');
    return true;
  } catch (error: any) {
    console.warn('❌ LangFuse callback handler initialization failed:', error?.message || error);
    langfuseAvailable = false;
    return false;
  }
};

// Initialize both integrations immediately (but async)
initializeAnthropic();
initializeLangFuse();

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  openaiEmbeddingsKey?: string;
  // LangFuse configuration
  langfuseEnabled?: boolean;
  langfusePublicKey?: string;
  langfuseSecretKey?: string;
  langfuseHost?: string;
}

export class ChatService {
  // LangFuse callback handler instance
  private static langfuseHandler: any = null;

  static getModelConfig(): ModelConfig | null {
    const modelConfig = localStorage.getItem("modelConfig");
    if (modelConfig) {
      try {
        return JSON.parse(modelConfig);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Initialize LangFuse callback handler with current config
  static initializeLangFuseHandler(): any {
    const config = this.getModelConfig();
    
    if (!config?.langfuseEnabled || !config.langfusePublicKey || !config.langfuseSecretKey) {
      console.log('⚠️ LangFuse not enabled or missing credentials');
      this.langfuseHandler = null;
      return null;
    }

    if (!CallbackHandler || !langfuseAvailable) {
      console.log('⚠️ LangFuse CallbackHandler not available');
      return null;
    }

    try {
      this.langfuseHandler = new CallbackHandler({
        secretKey: config.langfuseSecretKey,
        publicKey: config.langfusePublicKey,
        baseUrl: config.langfuseHost || 'http://localhost:3030',
        flushAt: 1, // Send traces immediately for real-time feedback
        metadata: {
          client_side: true,
          deployment: 'academia_os'
        }
      });

      console.log('✅ LangFuse callback handler initialized for tracing');
      return this.langfuseHandler;
    } catch (error: any) {
      console.warn('❌ Failed to create LangFuse callback handler:', error.message);
      this.langfuseHandler = null;
      return null;
    }
  }

  // Get active LangFuse callback handlers array
  static getLangFuseCallbacks(): any[] {
    // Refresh handler if config changed
    if (!this.langfuseHandler) {
      this.initializeLangFuseHandler();
    }

    return this.langfuseHandler ? [this.langfuseHandler] : [];
  }

  static async createChatModel(options: { maxTokens?: number } = {}) {
    const config = this.getModelConfig();
    if (!config) {
      throw new Error('No model configuration found. Please configure your AI model.');
    }

    if (config.provider === 'anthropic') {
      // If Anthropic not ready, try to initialize it
      if (!ChatAnthropic && !anthropicAvailable) {
        console.log('🔄 Attempting to initialize Anthropic...');
        await initializeAnthropic();
      }
      
      console.log('🔍 Anthropic Debug:', { ChatAnthropic: !!ChatAnthropic, anthropicAvailable, hasClass: ChatAnthropic?.name });
      if (ChatAnthropic && anthropicAvailable) {
        // Use actual Anthropic integration
        console.log('✅ Using native Anthropic model:', config.model);
        const anthropicConfig: any = {
          model: config.model,
          anthropicApiKey: config.apiKey,
          maxTokens: options.maxTokens || 1000,
        };

        return new ChatAnthropic(anthropicConfig);
      } else {
        // Fallback to OpenAI with debug message
        if (process.env.NODE_ENV === 'development') {
          console.log('ChatService: Using OpenAI fallback for Anthropic model');
        }
        const openAIKey = config.openaiEmbeddingsKey || localStorage.getItem("openAIKey") || "";
        if (!openAIKey) {
          throw new Error('Anthropic integration unavailable and no OpenAI fallback key configured.');
        }
        
        const clientConfig = this.getOpenAIClientConfiguration();
        return new ChatOpenAI({
          modelName: 'gpt-3.5-turbo',
          openAIApiKey: openAIKey,
          maxTokens: options.maxTokens || 100,
          ...clientConfig,
        });
      }
    } else {
      // OpenAI provider
      const clientConfig = this.getOpenAIClientConfiguration();
      return new ChatOpenAI({
        modelName: config.model,
        openAIApiKey: config.apiKey,
        maxTokens: options.maxTokens || 100,
        ...clientConfig,
      });
    }
  }

  // Add method to check if Anthropic is actually available
  static async isAnthropicAvailable(): Promise<boolean> {
    return anthropicAvailable;
  }

  // Add method to check if LangFuse is available and configured
  static isLangFuseAvailable(): boolean {
    const config = this.getModelConfig();
    return langfuseAvailable && 
           !!config?.langfuseEnabled && 
           !!config?.langfusePublicKey && 
           !!config?.langfuseSecretKey;
  }

  // Add method to get LangFuse status for debugging
  static getLangFuseStatus() {
    const config = this.getModelConfig();
    return {
      packageAvailable: langfuseAvailable,
      callbackHandlerLoaded: !!CallbackHandler,
      configEnabled: !!config?.langfuseEnabled,
      hasCredentials: !!(config?.langfusePublicKey && config?.langfuseSecretKey),
      handlerInitialized: !!this.langfuseHandler,
      baseUrl: config?.langfuseHost || 'http://localhost:3030'
    };
  }


  private static getOpenAIClientConfiguration() {
    // Return default OpenAI configuration
    return {};
  }

  static async simpleChat(systemMessage: string, userMessage: string, options: { maxTokens?: number } = {}) {
    const model = await this.createChatModel(options);
    
    // Get LangFuse callbacks for tracing
    const callbacks = this.getLangFuseCallbacks();
    
    console.log('🧠 ChatService: Starting chat with LangFuse tracing:', callbacks.length > 0);
    
    const result = await model.predictMessages([
      new SystemMessage(systemMessage),
      new HumanMessage(userMessage),
    ], { callbacks });
    
    console.log('✅ ChatService: Chat completed, response length:', result?.content?.length);
    
    return result?.content as string;
  }

  public static handleError = (error: any) => {
    console.error('Chat Service Error:', error.message || error?.response?.data?.message || error)
    throw error; // Re-throw so components can handle with their own message display
  }

  // Add compatibility method for embeddings (used by existing code)
  public static getEmbeddings() {
    // For embeddings, we'll continue using OpenAI as it's the most widely supported
    // and compatible with existing vector stores
    const config = this.getModelConfig();
    
    // Use configured OpenAI key or fallback
    const openAIKey = config?.provider === 'openai' 
      ? config.apiKey 
      : config?.openaiEmbeddingsKey || localStorage.getItem("openAIKey") || "";

    const clientConfig = this.getOpenAIClientConfiguration();
    return new OpenAIEmbeddings({
      openAIApiKey: openAIKey,
      ...clientConfig,
    })
  }
}