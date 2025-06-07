import React from 'react';
import { render, screen } from '@testing-library/react';
import { SearchLoadingState } from './SearchLoadingState';

// Mock Ant Design components
jest.mock('antd', () => ({
  Skeleton: {
    Avatar: ({ children }: { children: React.ReactNode }) => <div data-testid="skeleton-avatar">{children}</div>,
    Button: ({ children }: { children: React.ReactNode }) => <div data-testid="skeleton-button">{children}</div>,
    Input: ({ children }: { children: React.ReactNode }) => <div data-testid="skeleton-input">{children}</div>
  },
  Space: ({ children }: { children: React.ReactNode }) => <div data-testid="space">{children}</div>,
  Typography: {
    Text: ({ children }: { children: React.ReactNode }) => <span data-testid="text">{children}</span>
  }
}));

describe('SearchLoadingState', () => {
  it('renders searching stage correctly', () => {
    render(<SearchLoadingState stage="searching" />);
    
    expect(screen.getByText('🔍 Searching Semantic Scholar...')).toBeInTheDocument();
    expect(screen.getByText('Querying academic papers from the Semantic Scholar database')).toBeInTheDocument();
  });

  it('renders processing stage correctly', () => {
    render(<SearchLoadingState stage="processing" />);
    
    expect(screen.getByText('⚡ Processing Results...')).toBeInTheDocument();
    expect(screen.getByText('Analyzing paper abstracts and metadata')).toBeInTheDocument();
  });

  it('renders ranking stage correctly', () => {
    render(<SearchLoadingState stage="ranking" />);
    
    expect(screen.getByText('🎯 Ranking by Relevance...')).toBeInTheDocument();
    expect(screen.getByText('Using AI to rank papers by relevance to your research question')).toBeInTheDocument();
  });

  it('displays skeleton loading elements for all stages', () => {
    render(<SearchLoadingState stage="searching" />);
    
    // Check that skeleton elements are present
    expect(screen.getAllByTestId('skeleton-avatar')).toHaveLength(3);
    expect(screen.getAllByTestId('skeleton-button')).toHaveLength(3);
    expect(screen.getAllByTestId('skeleton-input')).toHaveLength(3);
  });

  it('handles unknown stage gracefully', () => {
    // @ts-ignore - Testing invalid stage
    render(<SearchLoadingState stage="unknown" />);
    
    // Should still render something (default to searching)
    expect(screen.getByTestId('space')).toBeInTheDocument();
  });

  it('displays progress indication for each stage', () => {
    const stages = ['searching', 'processing', 'ranking'] as const;
    
    stages.forEach(stage => {
      const { rerender } = render(<SearchLoadingState stage={stage} />);
      
      // Each stage should show some kind of progress/status text
      expect(screen.getByTestId('text')).toBeInTheDocument();
      
      rerender(<div />); // Clear for next iteration
    });
  });

  it('provides appropriate loading context for each stage', () => {
    // Test searching stage context
    render(<SearchLoadingState stage="searching" />);
    expect(screen.getByText(/Semantic Scholar database/)).toBeInTheDocument();
    
    // Test processing stage context
    const { rerender } = render(<SearchLoadingState stage="processing" />);
    expect(screen.getByText(/paper abstracts and metadata/)).toBeInTheDocument();
    
    // Test ranking stage context
    rerender(<SearchLoadingState stage="ranking" />);
    expect(screen.getByText(/AI to rank papers/)).toBeInTheDocument();
  });
});