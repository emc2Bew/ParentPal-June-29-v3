import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('renders with testID', () => {
    const { getByTestId } = render(
      <Card testID="test-card">
        <Text>Content</Text>
      </Card>
    );
    
    expect(getByTestId('test-card')).toBeTruthy();
  });

  it('applies different variants', () => {
    const { rerender, getByTestId } = render(
      <Card variant="default" testID="card">
        <Text>Content</Text>
      </Card>
    );
    
    let card = getByTestId('card');
    expect(card).toBeTruthy();
    
    rerender(
      <Card variant="elevated" testID="card">
        <Text>Content</Text>
      </Card>
    );
    card = getByTestId('card');
    expect(card).toBeTruthy();
    
    rerender(
      <Card variant="outlined" testID="card">
        <Text>Content</Text>
      </Card>
    );
    card = getByTestId('card');
    expect(card).toBeTruthy();
  });

  it('applies custom padding', () => {
    const { getByTestId } = render(
      <Card padding="xl" testID="card">
        <Text>Content</Text>
      </Card>
    );
    
    const card = getByTestId('card');
    expect(card).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <Card style={customStyle} testID="card">
        <Text>Content</Text>
      </Card>
    );
    
    const card = getByTestId('card');
    expect(card).toBeTruthy();
  });
});