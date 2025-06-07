import { ChatService } from './ChatService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock antd message
jest.mock('antd', () => ({
  message: {
    warning: jest.fn(),
    error: jest.fn()
  }
}));

describe('ChatService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
  });

  describe('getSelectedModel', () => {
    it('returns stored model name from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('gpt-4');
      
      const result = ChatService.getSelectedModel();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('modelName');
      expect(result).toBe('gpt-4');
    });

    it('returns default model when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = ChatService.getSelectedModel();
      
      expect(result).toBe('gpt-4o');
    });
  });

  describe('isAnthropicAvailable', () => {
    it('returns true when Anthropic API key is available', () => {
      localStorageMock.getItem.mockReturnValue('test-anthropic-key');
      
      const result = ChatService.isAnthropicAvailable();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('anthropicKey');
      expect(result).toBe(true);
    });

    it('returns false when Anthropic API key is not available', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = ChatService.isAnthropicAvailable();
      
      expect(result).toBe(false);
    });
  });

  describe('createChatModel', () => {
    beforeEach(() => {
      // Mock required localStorage values
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'openAIKey': return 'test-openai-key';
          case 'anthropicKey': return 'test-anthropic-key';
          case 'heliconeKey': return 'test-helicone-key';
          case 'modelName': return 'gpt-4';
          default: return null;
        }
      });
    });

    it('creates ChatOpenAI model with proper configuration', () => {
      const result = ChatService.createChatModel();
      
      expect(result).toBeDefined();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('modelName');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('openAIKey');
    });

    it('handles custom configuration parameters', () => {
      const customConfig = {
        temperature: 0.5,
        maxTokens: 1000
      };
      
      const result = ChatService.createChatModel(customConfig);
      
      expect(result).toBeDefined();
    });

    it('shows warning for Claude models and falls back to OpenAI', () => {
      const { message } = require('antd');
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'modelName': return 'claude-4-sonnet';
          case 'openAIKey': return 'test-openai-key';
          default: return null;
        }
      });
      
      const result = ChatService.createChatModel();
      
      expect(message.warning).toHaveBeenCalledWith(
        'Claude models not yet supported in this workflow. Using GPT-4 instead.'
      );
      expect(result).toBeDefined();
    });
  });

  describe('openAIModelConfiguration', () => {
    it('returns default configuration', () => {
      const config = ChatService.openAIModelConfiguration();
      
      expect(config).toEqual({
        modelName: 'gpt-4',
        temperature: 0.1,
        maxTokens: 4000
      });
    });

    it('applies custom configuration overrides', () => {
      const customConfig = {
        temperature: 0.8,
        maxTokens: 2000
      };
      
      const config = ChatService.openAIModelConfiguration(customConfig);
      
      expect(config).toEqual({
        modelName: 'gpt-4',
        temperature: 0.8,
        maxTokens: 2000
      });
    });
  });

  describe('openAIConfiguration', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'openAIKey': return 'test-openai-key';
          case 'heliconeKey': return 'test-helicone-key';
          default: return null;
        }
      });
    });

    it('returns configuration with Helicone when key is available', () => {
      const config = ChatService.openAIConfiguration();
      
      expect(config).toEqual({
        openAIApiKey: 'test-openai-key',
        configuration: {
          baseURL: 'https://oai.hconeai.com/v1',
          defaultHeaders: {
            'Helicone-Auth': 'Bearer test-helicone-key'
          }
        }
      });
    });

    it('returns basic configuration when Helicone key is not available', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'openAIKey': return 'test-openai-key';
          case 'heliconeKey': return null;
          default: return null;
        }
      });
      
      const config = ChatService.openAIConfiguration();
      
      expect(config).toEqual({
        openAIApiKey: 'test-openai-key'
      });
    });
  });
});