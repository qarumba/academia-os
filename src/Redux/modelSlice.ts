import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
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

const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setModelConfig: (state, action: PayloadAction<ModelConfig>) => {
      state.config = action.payload;
      state.isConfigured = true;
      state.error = null;
    },
    clearModelConfig: (state) => {
      state.config = null;
      state.isConfigured = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    loadConfigFromStorage: (state) => {
      const savedConfig = localStorage.getItem('modelConfig');
      if (savedConfig) {
        state.config = JSON.parse(savedConfig);
        state.isConfigured = true;
      }
    },
  },
});

export const {
  setModelConfig,
  clearModelConfig,
  setLoading,
  setError,
  loadConfigFromStorage,
} = modelSlice.actions;

export default modelSlice.reducer;

// Selectors
export const selectModelConfig = (state: { model: ModelState }) => state.model.config;
export const selectIsModelConfigured = (state: { model: ModelState }) => state.model.isConfigured;
export const selectModelLoading = (state: { model: ModelState }) => state.model.isLoading;
export const selectModelError = (state: { model: ModelState }) => state.model.error;
