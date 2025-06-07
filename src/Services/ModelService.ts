interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  openaiEmbeddingsKey?: string;
}

export class ModelService {
  /**
   * Check if any AI model is configured (OpenAI or Anthropic)
   */
  static isModelConfigured(): boolean {
    const modelConfig = localStorage.getItem("modelConfig");
    if (modelConfig) {
      try {
        const config: ModelConfig = JSON.parse(modelConfig);
        return !!(config.provider && config.model && config.apiKey);
      } catch {
        return false;
      }
    }
    
    // Fallback to legacy OpenAI key
    const legacyKey = localStorage.getItem("openAIKey");
    return !!(legacyKey && legacyKey.length > 0);
  }

  /**
   * Get the configured model config
   */
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

  /**
   * Check if OpenAI key is available (either as primary or embeddings key)
   */
  static hasOpenAIKey(): boolean {
    const config = this.getModelConfig();
    if (config) {
      if (config.provider === 'openai') {
        return !!(config.apiKey);
      } else if (config.provider === 'anthropic') {
        return !!(config.openaiEmbeddingsKey);
      }
    }
    
    // Fallback to legacy key
    return !!(localStorage.getItem("openAIKey"));
  }
}