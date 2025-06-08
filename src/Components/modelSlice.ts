interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  openaiEmbeddingsKey?: string;
  email?: string;
  adobePDFOCR_client_id?: string;
  adobePDFOCR_client_secret?: string;
}

interface ModelState {
  config: ModelConfig | null;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ModelState = {
  config: null,
  isConfigured: false,
  isLoading: false,
  error: null,
};

// Action Types
const SET_MODEL_CONFIG = 'model/setModelConfig';
const CLEAR_MODEL_CONFIG = 'model/clearModelConfig';
const SET_LOADING = 'model/setLoading';
const SET_ERROR = 'model/setError';
const LOAD_CONFIG_FROM_STORAGE = 'model/loadConfigFromStorage';

// Action Creators
export const setModelConfig = (config: ModelConfig) => ({
  type: SET_MODEL_CONFIG,
  payload: config,
});

export const clearModelConfig = () => ({
  type: CLEAR_MODEL_CONFIG,
});

export const setLoading = (loading: boolean) => ({
  type: SET_LOADING,
  payload: loading,
});

export const setError = (error: string) => ({
  type: SET_ERROR,
  payload: error,
});

export const loadConfigFromStorage = () => ({
  type: LOAD_CONFIG_FROM_STORAGE,
});

// Reducer
const modelReducer = (state = initialState, action: any): ModelState => {
  switch (action.type) {
    case SET_MODEL_CONFIG:
      // Validate that required fields are present
      const isValidConfig = !!(action.payload.provider && 
                              action.payload.model && 
                              action.payload.apiKey &&
                              // If Anthropic, require OpenAI embeddings key
                              (action.payload.provider !== 'anthropic' || action.payload.openaiEmbeddingsKey));
      
      return {
        ...state,
        config: action.payload,
        isConfigured: isValidConfig,
        error: null,
      };
    case CLEAR_MODEL_CONFIG:
      return {
        ...state,
        config: null,
        isConfigured: false,
      };
    case SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case LOAD_CONFIG_FROM_STORAGE:
      const savedConfig = localStorage.getItem('modelConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          // Validate that required fields are present
          const isValidConfig = !!(parsedConfig.provider && 
                                  parsedConfig.model && 
                                  parsedConfig.apiKey &&
                                  // If Anthropic, require OpenAI embeddings key
                                  (parsedConfig.provider !== 'anthropic' || parsedConfig.openaiEmbeddingsKey));
          
          // Only log validation in development mode and when there are issues
          if (process.env.NODE_ENV === 'development' && !isValidConfig) {
            console.log('modelSlice validation:', {
              provider: parsedConfig.provider,
              model: parsedConfig.model,
              hasApiKey: !!parsedConfig.apiKey,
              hasOpenAIKey: !!parsedConfig.openaiEmbeddingsKey,
              isValidConfig
            });
          }
          
          return {
            ...state,
            config: parsedConfig,
            isConfigured: isValidConfig,
          };
        } catch (error) {
          console.error('Failed to parse modelConfig from localStorage:', error);
          return state;
        }
      }
      return state;
    default:
      return state;
  }
};

export default modelReducer;

// Selectors
export const selectModelConfig = (state: { model: ModelState }) => state.model.config;
export const selectIsModelConfigured = (state: { model: ModelState }) => state.model.isConfigured;
export const selectModelLoading = (state: { model: ModelState }) => state.model.isLoading;
export const selectModelError = (state: { model: ModelState }) => state.model.error;
