import { OpenAIEmbeddings } from "langchain/embeddings/openai"

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  openaiEmbeddingsKey?: string;
  heliconeEndpoint?: string;
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
      
      return new OpenAIEmbeddings({
        openAIApiKey: openAIKey,
      }, this.getOpenAIConfiguration());
    } else {
      // OpenAI provider
      return new OpenAIEmbeddings({
        openAIApiKey: config.apiKey,
      }, this.getOpenAIConfiguration());
    }
  }

  private static getOpenAIConfiguration() {
    const config = this.getModelConfig();
    const heliconeEndpoint = config?.heliconeEndpoint || localStorage.getItem("heliconeEndpoint") || "";
    const heliconeKey = config?.heliconeKey || localStorage.getItem("heliconeKey") || "";

    // Temporarily disable Helicone proxy due to CORS issues in browser
    // TODO: Implement server-side Helicone integration or async logging
    const useHelicone = false; // Set to true when server-side implementation is ready

    if (useHelicone && heliconeEndpoint && heliconeKey) {
      return {
        basePath: heliconeEndpoint,
        baseOptions: {
          headers: {
            "Helicone-Auth": `Bearer ${heliconeKey}`,
          },
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