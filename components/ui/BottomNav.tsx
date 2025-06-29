import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, radius, dimensions, shadows } from '@/tokens/tokens';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export interface BottomNavProps {
  items: NavItem[];
  activeItemId?: string;
  style?: ViewStyle;
  testID?: string;
}

export function BottomNav({
  items,
  activeItemId,
  style,
  testID,
}: BottomNavProps) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {items.map((item) => {
        const isActive = item.id === activeItemId;
        
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, isActive && styles.activeItem]}
            onPress={item.onPress}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isActive }}
            testID={`nav-item-${item.id}`}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              {item.icon}
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: dimensions.navBarHeight,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    ...shadows.lg,
  },
  
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: dimensions.touchTarget,
    paddingHorizontal: spacing.xs,
  },
  
  activeItem: {
    // Additional styling for active state if needed
  },
  
  iconContainer: {
    marginBottom: spacing.xs,
  },
  
  activeIconContainer: {
    // Additional styling for active icon if needed
  },
  
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  activeLabel: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});