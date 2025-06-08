import { OpenAIEmbeddings } from "@langchain/openai"

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  openaiEmbeddingsKey?: string;
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

    console.log('🔍 EmbeddingService Debug:', {
      provider: config.provider,
      hasApiKey: !!config.apiKey,
      apiKeyPrefix: config.apiKey?.substring(0, 6),
      hasEmbeddingsKey: !!config.openaiEmbeddingsKey
    });

    // Validate key-provider mismatch
    if (config.provider === 'openai' && config.apiKey?.startsWith('sk-ant')) {
      throw new Error('🔑 Configuration Error: You have "OpenAI" selected as provider but are using an Anthropic API key.\n\n' +
        'SOLUTION: Either:\n' +
        '1. Change provider to "Anthropic" and add OpenAI key in "OpenAI Embeddings Key" field, OR\n' +
        '2. Keep "OpenAI" provider and replace main API key with an OpenAI key (sk-proj-... or sk-...)');
    }

    // For now, we'll use OpenAI embeddings even with Anthropic models
    // since Anthropic doesn't provide embeddings API yet
    // This requires users to have an OpenAI key for embeddings even when using Anthropic for chat
    
    if (config.provider === 'anthropic') {
      // Check for OpenAI embeddings key in unified config or fallback to legacy
      const openAIKey = config.openaiEmbeddingsKey || localStorage.getItem("openAIKey") || "";
      if (!openAIKey) {
        throw new Error('🔑 OpenAI API key required for embeddings when using Anthropic models.\n\n' +
          'SOLUTION: Go to Model Configuration → Show Advanced Options → add your OpenAI API key in "OpenAI Embeddings Key" field.\n\n' +
          'WHY: Anthropic models handle chat but OpenAI handles embeddings (for document similarity search).');
      }
      
      console.log('✅ EmbeddingService: Using OpenAI embeddings with Anthropic chat model');
      
      return new OpenAIEmbeddings({
        openAIApiKey: openAIKey,
      });
    } else {
      // OpenAI provider - should use the same key for both chat and embeddings
      console.log('✅ EmbeddingService: Using OpenAI embeddings with OpenAI chat model');
      
      return new OpenAIEmbeddings({
        openAIApiKey: config.apiKey,
      });
    }
  }

  private static getOpenAIConfiguration() {
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