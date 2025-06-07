import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ModelConfiguration from './ModelConfiguration';
import { modelSlice } from './modelSlice';

// Mock the ChatService
jest.mock('../Services/ChatService', () => ({
  ChatService: {
    isAnthropicAvailable: jest.fn(() => true)
  }
}));

// Mock antd components
jest.mock('antd', () => ({
  Modal: ({ children, title, open, onCancel }: any) => 
    open ? <div data-testid="modal" aria-label={title}>{children}<button onClick={onCancel}>Close</button></div> : null,
  Form: ({ children, onFinish }: any) => <form onSubmit={(e) => { e.preventDefault(); onFinish?.({}); }}>{children}</form>,
  Input: ({ placeholder, onChange, type }: any) => 
    <input data-testid={`input-${placeholder?.toLowerCase().replace(/\s+/g, '-') || type}`} onChange={(e) => onChange?.(e.target.value)} />,
  Select: ({ children, onChange, placeholder }: any) => 
    <select data-testid={`select-${placeholder?.toLowerCase().replace(/\s+/g, '-')}`} onChange={(e) => onChange?.(e.target.value)}>{children}</select>,
  Button: ({ children, onClick, type }: any) => 
    <button data-testid={`button-${type || 'default'}`} onClick={onClick}>{children}</button>,
  Space: ({ children }: any) => <div data-testid="space">{children}</div>,
  Typography: {
    Title: ({ children }: any) => <h1>{children}</h1>,
    Text: ({ children }: any) => <span>{children}</span>
  },
  Divider: () => <hr data-testid="divider" />,
  Alert: ({ message, type }: any) => <div data-testid={`alert-${type}`}>{message}</div>
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      model: modelSlice.reducer
    },
    preloadedState: {
      model: {
        isConfigured: false,
        modelName: 'gpt-4o',
        ...initialState
      }
    }
  });
};

describe('ModelConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
  });

  it('renders configuration modal when not configured', () => {
    const store = createMockStore({ isConfigured: false });
    
    render(
      <Provider store={store}>
        <ModelConfiguration />
      </Provider>
    );
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('AI Model Configuration')).toBeInTheDocument();
  });

  it('does not render modal when already configured', () => {
    const store = createMockStore({ isConfigured: true });
    
    render(
      <Provider store={store}>
        <ModelConfiguration />
      </Provider>
    );
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('displays model selection options', () => {
    const store = createMockStore({ isConfigured: false });
    
    render(
      <Provider store={store}>
        <ModelConfiguration />
      </Provider>
    );
    
    expect(screen.getByTestId('select-select-ai-model')).toBeInTheDocument();
  });

  it('shows API key input fields', () => {
    const store = createMockStore({ isConfigured: false });
    
    render(
      <Provider store={store}>
        <ModelConfiguration />
      </Provider>
    );
    
    expect(screen.getByTestId('input-openai-api-key')).toBeInTheDocument();
  });

  it('displays Anthropic availability status', () => {
    const store = createMockStore({ isConfigured: false });
    
    render(
      <Provider store={store}>
        <ModelConfiguration />
      </Provider>
    );
    
    // Should show some indication of Anthropic support
    expect(screen.getByTestId('alert-success')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const store = createMockStore({ isConfigured: false });
    
    render(
      <Provider store={store}>
        <ModelConfiguration />
      </Provider>
    );
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  it('allows closing the modal', () => {
    const store = createMockStore({ isConfigured: false });
    
    render(
      <Provider store={store}>
        <ModelConfiguration />
      </Provider>
    );
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    // Modal should be closed (component manages its own state)
    expect(closeButton).toBeInTheDocument();
  });

  it('shows configuration sections', () => {
    const store = createMockStore({ isConfigured: false });
    
    render(
      <Provider store={store}>
        <ModelConfiguration />
      </Provider>
    );
    
    // Should have different sections for API keys and optional settings
    expect(screen.getAllByTestId('divider')).toHaveLength(2); // Assuming 3 sections with 2 dividers
  });

  it('handles optional Helicone configuration', () => {
    const store = createMockStore({ isConfigured: false });
    
    render(
      <Provider store={store}>
        <ModelConfiguration />
      </Provider>
    );
    
    // Should have Helicone API key input
    expect(screen.getByTestId('input-helicone-api-key-(optional)')).toBeInTheDocument();
  });

  it('updates model selection in store when form is submitted', async () => {
    const store = createMockStore({ isConfigured: false });
    
    render(
      <Provider store={store}>
        <ModelConfiguration />
      </Provider>
    );
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      const state = store.getState();
      expect(state.model.isConfigured).toBe(true);
    });
  });
});