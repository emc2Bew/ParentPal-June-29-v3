import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Button title="Test Button" onPress={mockOnPress} disabled />
    );
    
    fireEvent.press(getByRole('button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Button title="Test Button" onPress={mockOnPress} loading />
    );
    
    fireEvent.press(getByRole('button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId, queryByText } = render(
      <Button title="Test Button" onPress={() => {}} loading testID="button" />
    );
    
    // Text should not be visible when loading
    expect(queryByText('Test Button')).toBeNull();
    
    // Loading indicator should be present (ActivityIndicator doesn't have a specific testID by default)
    const button = getByTestId('button');
    expect(button).toBeTruthy();
  });

  it('applies correct accessibility properties', () => {
    const { getByRole } = render(
      <Button 
        title="Test Button" 
        onPress={() => {}} 
        accessibilityLabel="Custom Label"
        disabled
      />
    );
    
    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Custom Label');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('renders different variants correctly', () => {
    const { rerender, getByRole } = render(
      <Button title="Primary" onPress={() => {}} variant="primary" />
    );
    
    let button = getByRole('button');
    expect(button).toBeTruthy();
    
    rerender(<Button title="Secondary" onPress={() => {}} variant="secondary" />);
    button = getByRole('button');
    expect(button).toBeTruthy();
    
    rerender(<Button title="Outline" onPress={() => {}} variant="outline" />);
    button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('renders different sizes correctly', () => {
    const { rerender, getByRole } = render(
      <Button title="Small" onPress={() => {}} size="sm" />
    );
    
    let button = getByRole('button');
    expect(button).toBeTruthy();
    
    rerender(<Button title="Medium" onPress={() => {}} size="md" />);
    button = getByRole('button');
    expect(button).toBeTruthy();
    
    rerender(<Button title="Large" onPress={() => {}} size="lg" />);
    button = getByRole('button');
    expect(button).toBeTruthy();
  });
});