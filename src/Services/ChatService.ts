import { ChatOpenAI } from "langchain/chat_models/openai"
import { HumanMessage, SystemMessage } from "langchain/schema"

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
      // Check if user has OpenAI embeddings key for chat operations
      const openAIKey = config.openaiEmbeddingsKey || localStorage.getItem("openAIKey") || "";
      if (!openAIKey) {
        throw new Error('Custom columns require OpenAI models. Please switch to OpenAI or add an OpenAI key for advanced features.');
      }
      
      // Use OpenAI key for chat operations when using Anthropic
      return new ChatOpenAI({
        modelName: 'gpt-3.5-turbo', // Use a simple OpenAI model for custom columns
        openAIApiKey: openAIKey,
        maxTokens: options.maxTokens || 100,
      }, this.getOpenAIClientConfiguration());
    } else {
      // OpenAI provider
      return new ChatOpenAI({
        modelName: config.model,
        openAIApiKey: config.apiKey,
        maxTokens: options.maxTokens || 100,
      }, this.getOpenAIClientConfiguration());
    }
  }

  private static getOpenAIClientConfiguration() {
    const config = this.getModelConfig();
    const heliconeEndpoint = config?.heliconeEndpoint || localStorage.getItem("heliconeEndpoint") || "";
    const heliconeKey = config?.heliconeKey || localStorage.getItem("heliconeKey") || "";

    // Use async Helicone integration (headers only, no proxy)
    // This allows monitoring via Helicone API while avoiding CORS issues
    const useHelicone = heliconeKey ? true : false;

    if (useHelicone) {
      return {
        baseOptions: {
          headers: {
            "Helicone-Auth": `Bearer ${heliconeKey}`,
            "Helicone-Cache-Enabled": "true",
          },
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
}