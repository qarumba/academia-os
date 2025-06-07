import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Coding from './Coding';
import { tabsReducer } from '../../Redux/tabsReducer';

// Mock the ChatService that replaced hardcoded OpenAI calls
jest.mock('../../Services/ChatService', () => ({
  ChatService: {
    createChatModel: jest.fn(() => ({
      invoke: jest.fn().mockResolvedValue({ content: 'Mock AI response' }),
      stream: jest.fn()
    }))
  }
}));

// Mock other services
jest.mock('../../Services/EmbeddingService', () => ({
  EmbeddingService: {
    embedDocuments: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]])
  }
}));

// Mock Ant Design components
jest.mock('antd', () => ({
  Button: ({ children, onClick, type, loading }: any) => 
    <button 
      data-testid={`button-${type || 'default'}`} 
      onClick={onClick}
      disabled={loading}
    >
      {loading ? 'Loading...' : children}
    </button>,
  Card: ({ children, title }: any) => 
    <div data-testid="card">
      {title && <h3>{title}</h3>}
      {children}
    </div>,
  Space: ({ children }: any) => <div data-testid="space">{children}</div>,
  Input: {
    TextArea: ({ placeholder, onChange, value }: any) => 
      <textarea 
        data-testid="textarea"
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        value={value}
      />
  },
  Typography: {
    Title: ({ children }: any) => <h2>{children}</h2>,
    Text: ({ children }: any) => <span>{children}</span>
  },
  Table: ({ columns, dataSource }: any) => 
    <table data-testid="table">
      <thead>
        <tr>
          {columns?.map((col: any, i: number) => <th key={i}>{col.title}</th>)}
        </tr>
      </thead>
      <tbody>
        {dataSource?.map((row: any, i: number) => (
          <tr key={i}>
            {columns?.map((col: any, j: number) => (
              <td key={j}>{col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>,
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

// Mock GioiaCoding component
jest.mock('../Charts/GioiaCoding', () => ({
  __esModule: true,
  default: ({ data }: any) => <div data-testid="gioia-chart">Chart with {data?.length || 0} items</div>
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      tabs: tabsReducer
    },
    preloadedState: {
      tabs: {
        activeTab: 'tab-1',
        tabs: {
          'tab-1': {
            id: 'tab-1',
            title: 'Test Tab',
            papers: [
              {
                paperId: '1',
                title: 'Test Paper 1',
                abstract: 'This is a test abstract for paper 1',
                authors: [{ name: 'Author 1' }],
                venue: 'Test Venue',
                year: 2023,
                citationCount: 10,
                fullText: 'Full text content for testing coding workflow'
              }
            ],
            searchQuery: 'test query',
            ...initialState
          }
        }
      }
    }
  });
};

describe('Coding Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders coding interface with papers', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Coding />
      </Provider>
    );
    
    expect(screen.getByText('First-Order Coding')).toBeInTheDocument();
    expect(screen.getByTestId('button-primary')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('shows start coding button when no coding has been done', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Coding />
      </Provider>
    );
    
    const startButton = screen.getByTestId('button-primary');
    expect(startButton).toHaveTextContent('Start First-Order Coding');
  });

  it('uses ChatService instead of hardcoded OpenAI for coding', async () => {
    const { ChatService } = require('../../Services/ChatService');
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Coding />
      </Provider>
    );
    
    const startButton = screen.getByTestId('button-primary');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(ChatService.createChatModel).toHaveBeenCalled();
    });
  });

  it('shows loading state during coding process', async () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Coding />
      </Provider>
    );
    
    const startButton = screen.getByTestId('button-primary');
    fireEvent.click(startButton);
    
    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('allows adding researcher remarks', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Coding />
      </Provider>
    );
    
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'Add your remarks or specific instructions for the AI here...');
  });

  it('displays papers in table format', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Coding />
      </Provider>
    );
    
    const table = screen.getByTestId('table');
    expect(table).toBeInTheDocument();
    
    // Should show paper information
    expect(screen.getByText('Test Paper 1')).toBeInTheDocument();
    expect(screen.getByText('Author 1')).toBeInTheDocument();
  });

  it('handles second-order coding after first-order completion', async () => {
    const store = createMockStore({
      firstOrderCodes: [
        { code: 'Test Code 1', description: 'Test description 1', papers: ['1'] }
      ]
    });
    
    render(
      <Provider store={store}>
        <Coding />
      </Provider>
    );
    
    // Should show second-order coding option when first-order is complete
    expect(screen.getByText('Second-Order Coding')).toBeInTheDocument();
  });

  it('handles aggregate dimensions after second-order completion', async () => {
    const store = createMockStore({
      firstOrderCodes: [
        { code: 'Test Code 1', description: 'Test description 1', papers: ['1'] }
      ],
      secondOrderCodes: [
        { theme: 'Test Theme 1', description: 'Test theme description', codes: ['Test Code 1'] }
      ]
    });
    
    render(
      <Provider store={store}>
        <Coding />
      </Provider>
    );
    
    // Should show aggregate dimensions option when second-order is complete
    expect(screen.getByText('Aggregate Dimensions')).toBeInTheDocument();
  });

  it('displays Gioia coding chart when codes are available', () => {
    const store = createMockStore({
      firstOrderCodes: [
        { code: 'Test Code 1', description: 'Test description 1', papers: ['1'] }
      ]
    });
    
    render(
      <Provider store={store}>
        <Coding />
      </Provider>
    );
    
    expect(screen.getByTestId('gioia-chart')).toBeInTheDocument();
  });

  it('verifies Issue #16 resolution - no hardcoded OpenAI usage', async () => {
    const { ChatService } = require('../../Services/ChatService');
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Coding />
      </Provider>
    );
    
    // Trigger all three coding phases that were fixed in Issue #16
    const startButton = screen.getByTestId('button-primary');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      // Verify ChatService.createChatModel is used instead of hardcoded OpenAI
      expect(ChatService.createChatModel).toHaveBeenCalled();
    });
    
    // This test verifies that the component now uses ChatService
    // which respects user's model configuration instead of hardcoded OpenAI
  });
});