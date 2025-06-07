import { OpenAIEmbeddings } from "@langchain/openai"
import { HeliconeService } from "./HeliconeService"

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  openaiEmbeddingsKey?: string;
  heliconeKey?: string;
}

export class EmbeddingService {
  static getModelConfig(): ModelConfig | null {
    const modelConfig = localStorage.getItem("modelConfig");
    if (modelConfig) {
      return JSON.parse(modelConfig);
    }
    return null;
  }

  static async createEmbeddings() {
    const config = this.getModelConfig();
    if (!config) {
      throw new Error('No model configuration found');
    }

    // For now, we'll use OpenAI embeddings even with Anthropic models
    // since Anthropic doesn't provide embeddings API yet
    // This requires users to have an OpenAI key for embeddings even when using Anthropic for chat
    
    if (config.provider === 'anthropic') {
      // Check for OpenAI embeddings key in unified config or fallback to legacy
      const openAIKey = config.openaiEmbeddingsKey || localStorage.getItem("openAIKey") || "";
      if (!openAIKey) {
        throw new Error('OpenAI API key required for embeddings when using Anthropic models. Please add an OpenAI key in advanced settings or use OpenAI models for full functionality.');
      }
      
      const clientConfig = this.getOpenAIConfiguration();
      return new OpenAIEmbeddings({
        openAIApiKey: openAIKey,
        ...clientConfig,
      });
    } else {
      // OpenAI provider
      const clientConfig = this.getOpenAIConfiguration();
      return new OpenAIEmbeddings({
        openAIApiKey: config.apiKey,
        ...clientConfig,
      });
    }
  }

  private static getOpenAIConfiguration() {
    // Get Helicone configuration for OpenAI (embeddings always use OpenAI)
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

  static async embedQuery(text: string): Promise<number[]> {
    const embeddings = await this.createEmbeddings();
    return embeddings.embedQuery(text);
  }

  static async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings = await this.createEmbeddings();
    return embeddings.embedDocuments(texts);
  }
}