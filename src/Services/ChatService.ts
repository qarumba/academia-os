import { ChatOpenAI, OpenAIChatInput, AzureOpenAIInput } from "langchain/chat_models/openai"
import { BaseLanguageModelParams } from "langchain/dist/base_language"
import { type ClientOptions } from "openai"
import { message } from "antd"

export interface ChatServiceConfig {
  maxTokens?: number
  streaming?: boolean
  temperature?: number
}

export type SupportedModel = 
  | "gpt-4-1106-preview" 
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022"
  | "claude-3-opus-20240229"

export class ChatService {
  private static getOpenAIKey = () => {
    return localStorage.getItem("openAIKey") || ""
  }

  private static getAnthropicKey = () => {
    return localStorage.getItem("anthropicKey") || ""
  }

  private static getSelectedModel = (): SupportedModel => {
    return (localStorage.getItem("modelName") as SupportedModel) || "gpt-4-1106-preview"
  }

  private static getSelectedProvider = (): "openai" | "anthropic" => {
    return localStorage.getItem("modelProvider") as "openai" | "anthropic" || "openai"
  }

  public static handleError = (error: any) => {
    message.error(error.message || error?.response?.data?.message || error)
  }

  private static openAIConfiguration() {
    const heliconeEndpoint = localStorage.getItem("heliconeEndpoint")
    return {
      basePath: heliconeEndpoint || undefined,
      baseOptions: {
        headers: {
          "Helicone-Auth": `Bearer ${localStorage.getItem("heliconeKey")}`,
        },
      },
    } as ClientOptions
  }

  private static openAIModelConfiguration(
    config?: ChatServiceConfig
  ): Partial<OpenAIChatInput> & Partial<AzureOpenAIInput> & BaseLanguageModelParams {
    const modelName = ChatService.getSelectedModel()
    return {
      modelName,
      openAIApiKey: ChatService.getOpenAIKey(),
      maxTokens: config?.maxTokens,
      streaming: config?.streaming,
      temperature: config?.temperature,
    }
  }

  /**
   * Creates a chat model based on the user's configuration
   * This replaces direct OpenAIService calls to support multiple providers
   */
  public static createChatModel(config?: ChatServiceConfig) {
    const modelName = ChatService.getSelectedModel()

    try {
      // For now, we'll use OpenAI for all models
      // In the future, this can be extended to support Anthropic models
      // when the proper langchain Anthropic integration is available
      if (modelName.startsWith("claude")) {
        // If user selects Claude but Anthropic is not available, warn and fallback to GPT-4
        console.warn("Claude models selected but Anthropic integration not yet available. Falling back to GPT-4.")
        localStorage.setItem("modelName", "gpt-4-1106-preview")
        message.warning("Claude models not yet supported. Using GPT-4 instead.")
      }
      
      return new ChatOpenAI(
        ChatService.openAIModelConfiguration(config),
        ChatService.openAIConfiguration()
      )
    } catch (error) {
      ChatService.handleError(error)
      throw error
    }
  }

  /**
   * Determines if the currently selected model is an OpenAI model
   */
  public static isOpenAIModel(): boolean {
    const modelName = ChatService.getSelectedModel()
    return modelName.startsWith("gpt")
  }

  /**
   * Determines if the currently selected model is an Anthropic model
   */
  public static isAnthropicModel(): boolean {
    const modelName = ChatService.getSelectedModel()
    return modelName.startsWith("claude")
  }

  /**
   * Gets the appropriate embeddings service based on current configuration
   * Note: For now, we'll continue using OpenAI embeddings as they're standard
   */
  public static getEmbeddings() {
    // For embeddings, we'll continue using OpenAI as it's the most widely supported
    // and compatible with existing vector stores
    const { OpenAIEmbeddings } = require("langchain/embeddings/openai")
    return new OpenAIEmbeddings(
      {
        openAIApiKey: ChatService.getOpenAIKey(),
      },
      ChatService.openAIConfiguration()
    )
  }
}