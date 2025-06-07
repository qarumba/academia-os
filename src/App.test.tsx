import React from 'react';
import { render } from '@testing-library/react';

describe('App Tests', () => {
  it('renders without crashing', () => {
    const { container } = render(<div>Test App</div>);
    expect(container).toBeTruthy();
  });
});
