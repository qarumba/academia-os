import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { HeliconeService } from "./HeliconeService"
import { LangfuseService } from "./LangfuseService"

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

// Initialize immediately (but async)
initializeAnthropic();

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  openaiEmbeddingsKey?: string;
  heliconeEndpoint?: string;
  heliconeKey?: string;
  langfusePublicKey?: string;
  langfuseSecretKey?: string;
  langfuseBaseUrl?: string;
  langfuseUserId?: string;
}

export class ChatService {
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
        const heliconeConfig = HeliconeService.getHeliconeConfigForProvider('anthropic');
        
        const anthropicConfig: any = {
          model: config.model,
          anthropicApiKey: config.apiKey,
          maxTokens: options.maxTokens || 1000,
        };

        // Add Helicone headers if configured
        if (heliconeConfig) {
          anthropicConfig.clientOptions = {
            defaultHeaders: heliconeConfig.headers,
          };
        }

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

  private static getOpenAIClientConfiguration() {
    const config = this.getModelConfig();
    
    // Get Helicone configuration for OpenAI (even when using Anthropic primary, OpenAI is used for embeddings)
    const heliconeConfig = HeliconeService.getHeliconeConfigForProvider('openai');

    if (heliconeConfig) {
      return {
        baseOptions: {
          headers: heliconeConfig.headers,
        },
      };
    }

    // Return default OpenAI configuration
    return {};
  }

  static async simpleChat(systemMessage: string, userMessage: string, options: { maxTokens?: number } = {}) {
    const model = await this.createChatModel(options);
    
    // Start Langfuse tracing if configured
    const trace = LangfuseService.isLangfuseConfigured() 
      ? LangfuseService.startTrace("simple_chat", { systemMessage, userMessage })
      : null;

    try {
      const messages = [
        new SystemMessage(systemMessage),
        new HumanMessage(userMessage),
      ];
      
      const result = await model.predictMessages(messages);
      const response = result?.content as string;

      // Log generation to Langfuse
      if (trace) {
        const config = this.getModelConfig();
        LangfuseService.logGeneration(
          "chat_completion",
          { messages: messages.map(m => ({ role: m._getType(), content: m.content })) },
          { content: response },
          { 
            model: config?.model,
            provider: config?.provider,
            maxTokens: options.maxTokens 
          }
        );
        LangfuseService.endTrace({ response });
      }

      return response;
    } catch (error) {
      // End trace with error
      if (trace) {
        LangfuseService.endTrace(null, { error: error instanceof Error ? error.message : String(error) });
      }
      throw error;
    }
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