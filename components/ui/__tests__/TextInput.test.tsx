import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextInput } from '../TextInput';

describe('TextInput', () => {
  it('renders correctly with label', () => {
    const { getByText, getByDisplayValue } = render(
      <TextInput 
        label="Email" 
        value="test@example.com" 
        onChangeText={() => {}} 
      />
    );
    
    expect(getByText('Email')).toBeTruthy();
    expect(getByDisplayValue('test@example.com')).toBeTruthy();
  });

  it('shows required indicator when required', () => {
    const { getByText } = render(
      <TextInput 
        label="Email" 
        value="" 
        onChangeText={() => {}} 
        required 
      />
    );
    
    expect(getByText('*')).toBeTruthy();
  });

  it('displays error message', () => {
    const { getByText } = render(
      <TextInput 
        label="Email" 
        value="" 
        onChangeText={() => {}} 
        error="Email is required" 
      />
    );
    
    expect(getByText('Email is required')).toBeTruthy();
  });

  it('displays helper text when no error', () => {
    const { getByText } = render(
      <TextInput 
        label="Email" 
        value="" 
        onChangeText={() => {}} 
        helperText="Enter your email address" 
      />
    );
    
    expect(getByText('Enter your email address')).toBeTruthy();
  });

  it('prioritizes error over helper text', () => {
    const { getByText, queryByText } = render(
      <TextInput 
        label="Email" 
        value="" 
        onChangeText={() => {}} 
        error="Email is required"
        helperText="Enter your email address" 
      />
    );
    
    expect(getByText('Email is required')).toBeTruthy();
    expect(queryByText('Enter your email address')).toBeNull();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <TextInput 
        label="Email" 
        value="test" 
        onChangeText={mockOnChangeText} 
      />
    );
    
    const input = getByDisplayValue('test');
    fireEvent.changeText(input, 'test@example.com');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('test@example.com');
  });

  it('handles focus and blur events', () => {
    const mockOnFocus = jest.fn();
    const mockOnBlur = jest.fn();
    
    const { getByDisplayValue } = render(
      <TextInput 
        label="Email" 
        value="test" 
        onChangeText={() => {}}
        onFocus={mockOnFocus}
        onBlur={mockOnBlur}
      />
    );
    
    const input = getByDisplayValue('test');
    
    fireEvent(input, 'focus');
    expect(mockOnFocus).toHaveBeenCalled();
    
    fireEvent(input, 'blur');
    expect(mockOnBlur).toHaveBeenCalled();
  });

  it('applies correct accessibility properties', () => {
    const { getByLabelText } = render(
      <TextInput 
        label="Email Address" 
        value="" 
        onChangeText={() => {}} 
      />
    );
    
    const input = getByLabelText('Email Address');
    expect(input).toBeTruthy();
  });

  it('handles disabled state', () => {
    const { getByDisplayValue } = render(
      <TextInput 
        label="Email" 
        value="test" 
        onChangeText={() => {}}
        editable={false}
      />
    );
    
    const input = getByDisplayValue('test');
    expect(input.props.editable).toBe(false);
  });
});