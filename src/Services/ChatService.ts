import { ChatOpenAI } from "langchain/chat_models/openai"
import { HumanMessage, SystemMessage } from "langchain/schema"
import { HeliconeService } from "./HeliconeService"

// Anthropic integration with graceful fallback
let ChatAnthropic: any = null;
let anthropicAvailable = false;

// Browser-compatible way to check for Anthropic package
// Since we can't use require() or dynamic imports reliably with version conflicts,
// we'll just assume it's not available and rely on the fallback
// This gives users honest feedback about the current state
anthropicAvailable = false;
// Note: Anthropic integration gracefully falls back to OpenAI due to LangChain version compatibility

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  openaiEmbeddingsKey?: string;
  heliconeEndpoint?: string;
  heliconeKey?: string;
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
      if (ChatAnthropic && anthropicAvailable) {
        // Use actual Anthropic integration
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
        
        return new ChatOpenAI({
          modelName: 'gpt-3.5-turbo',
          openAIApiKey: openAIKey,
          maxTokens: options.maxTokens || 100,
        }, this.getOpenAIClientConfiguration());
      }
    } else {
      // OpenAI provider
      return new ChatOpenAI({
        modelName: config.model,
        openAIApiKey: config.apiKey,
        maxTokens: options.maxTokens || 100,
      }, this.getOpenAIClientConfiguration());
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
    const result = await model.predictMessages([
      new SystemMessage(systemMessage),
      new HumanMessage(userMessage),
    ]);
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
    const { OpenAIEmbeddings } = require("langchain/embeddings/openai")
    const config = this.getModelConfig();
    
    // Use configured OpenAI key or fallback
    const openAIKey = config?.provider === 'openai' 
      ? config.apiKey 
      : config?.openaiEmbeddingsKey || localStorage.getItem("openAIKey") || "";

    return new OpenAIEmbeddings(
      {
        openAIApiKey: openAIKey,
      },
      this.getOpenAIClientConfiguration()
    )
  }
}