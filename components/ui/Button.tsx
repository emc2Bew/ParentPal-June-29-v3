import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, radius, dimensions } from '@/tokens/tokens';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.textInverse : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text`],
            styles[`${size}Text`],
            isDisabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: dimensions.touchTarget,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  
  // Sizes
  sm: {
    height: dimensions.buttonHeight.sm,
    paddingHorizontal: spacing.md,
  },
  md: {
    height: dimensions.buttonHeight.md,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    height: dimensions.buttonHeight.lg,
    paddingHorizontal: spacing.xl,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  // Text styles
  text: {
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  primaryText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
  },
  secondaryText: {
    color: colors.textDefault,
    fontSize: typography.fontSize.base,
  },
  outlineText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
  },
  
  // Size-specific text
  smText: {
    fontSize: typography.fontSize.sm,
  },
  mdText: {
    fontSize: typography.fontSize.base,
  },
  lgText: {
    fontSize: typography.fontSize.lg,
  },
  
  disabledText: {
    opacity: 0.7,
  },
});