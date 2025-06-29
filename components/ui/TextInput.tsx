import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { colors, typography, spacing, radius, dimensions } from '@/tokens/tokens';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  required?: boolean;
  testID?: string;
}

export function TextInput({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  labelStyle,
  required = false,
  testID,
  onFocus,
  onBlur,
  ...props
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <RNTextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          props.editable === false && styles.inputDisabled,
          inputStyle,
        ]}
        placeholderTextColor={colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        accessibilityLabel={label}
        accessibilityState={{
          disabled: props.editable === false,
        }}
        {...props}
      />
      
      {(error || helperText) && (
        <Text style={[styles.helperText, hasError && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  
  required: {
    color: colors.error,
  },
  
  input: {
    height: dimensions.inputHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  
  inputFocused: {
    borderColor: colors.borderFocus,
    borderWidth: 2,
  },
  
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  
  inputDisabled: {
    backgroundColor: colors.gray100,
    color: colors.textMuted,
  },
  
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  
  errorText: {
    color: colors.error,
  },
});