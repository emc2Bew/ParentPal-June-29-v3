import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, shadows } from '@/tokens/tokens';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
  style?: ViewStyle;
  testID?: string;
}

export function Card({
  children,
  variant = 'default',
  padding = 'lg',
  style,
  testID,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        { padding: spacing[padding] },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  
  default: {
    backgroundColor: colors.surface,
  },
  
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});