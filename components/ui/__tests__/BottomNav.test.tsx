import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BottomNav } from '../BottomNav';

const mockItems = [
  {
    id: 'home',
    label: 'Home',
    icon: <Text>🏠</Text>,
    onPress: jest.fn(),
  },
  {
    id: 'search',
    label: 'Search',
    icon: <Text>🔍</Text>,
    onPress: jest.fn(),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <Text>👤</Text>,
    onPress: jest.fn(),
  },
];

describe('BottomNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all navigation items', () => {
    const { getByText } = render(
      <BottomNav items={mockItems} />
    );
    
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Search')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('renders icons for each item', () => {
    const { getByText } = render(
      <BottomNav items={mockItems} />
    );
    
    expect(getByText('🏠')).toBeTruthy();
    expect(getByText('🔍')).toBeTruthy();
    expect(getByText('👤')).toBeTruthy();
  });

  it('calls onPress when item is pressed', () => {
    const { getByTestId } = render(
      <BottomNav items={mockItems} />
    );
    
    fireEvent.press(getByTestId('nav-item-home'));
    expect(mockItems[0].onPress).toHaveBeenCalledTimes(1);
    
    fireEvent.press(getByTestId('nav-item-search'));
    expect(mockItems[1].onPress).toHaveBeenCalledTimes(1);
  });

  it('highlights active item', () => {
    const { getByTestId } = render(
      <BottomNav items={mockItems} activeItemId="home" />
    );
    
    const homeItem = getByTestId('nav-item-home');
    expect(homeItem.props.accessibilityState.selected).toBe(true);
    
    const searchItem = getByTestId('nav-item-search');
    expect(searchItem.props.accessibilityState.selected).toBe(false);
  });

  it('applies correct accessibility properties', () => {
    const { getByTestId } = render(
      <BottomNav items={mockItems} activeItemId="home" />
    );
    
    const homeItem = getByTestId('nav-item-home');
    expect(homeItem.props.accessibilityRole).toBe('tab');
    expect(homeItem.props.accessibilityLabel).toBe('Home');
    expect(homeItem.props.accessibilityState.selected).toBe(true);
  });

  it('renders with testID', () => {
    const { getByTestId } = render(
      <BottomNav items={mockItems} testID="bottom-nav" />
    );
    
    expect(getByTestId('bottom-nav')).toBeTruthy();
  });

  it('handles empty items array', () => {
    const { getByTestId } = render(
      <BottomNav items={[]} testID="bottom-nav" />
    );
    
    expect(getByTestId('bottom-nav')).toBeTruthy();
  });
});