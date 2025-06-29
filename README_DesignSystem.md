# Design System Documentation

This document outlines how to use the design system tokens and components in the Parent Pal application.

## Overview

The design system provides a consistent set of design tokens, components, and patterns to ensure visual consistency and maintainability across the application.

## Design Tokens

Design tokens are the foundation of our design system. They define colors, typography, spacing, and other design properties that should be used consistently throughout the application.

### Importing Tokens

```typescript
import { colors, typography, spacing, radius, shadows } from '@/tokens/tokens';
```

### Color Palette

#### Primary Colors
- `colors.primary` - #4A7C59 (Main brand color)
- `colors.accent` - #F5C344 (Secondary brand color)
- `colors.surface` - #FFFFFF (Background surfaces)
- `colors.textDefault` - #2C2C2C (Primary text)
- `colors.error` - #D94F4F (Error states)

#### Extended Colors
- `colors.primaryLight` - #6B9B7A
- `colors.primaryDark` - #3A5F46
- `colors.success` - #10B981
- `colors.warning` - #F59E0B
- `colors.info` - #3B82F6

#### Neutral Colors
- `colors.gray50` through `colors.gray900` (Complete gray scale)
- `colors.textPrimary` - #2C2C2C
- `colors.textSecondary` - #6B7280
- `colors.textMuted` - #9CA3AF

### Typography

#### Font Sizes
```typescript
typography.fontSize.xs    // 12px
typography.fontSize.sm    // 14px
typography.fontSize.base  // 16px
typography.fontSize.lg    // 18px
typography.fontSize.xl    // 20px
typography.fontSize['2xl'] // 24px
```

#### Font Weights
```typescript
typography.fontWeight.normal    // '400'
typography.fontWeight.medium    // '500'
typography.fontWeight.semibold  // '600'
typography.fontWeight.bold      // '700'
```

#### Predefined Text Styles
```typescript
typography.heading1  // 24px, bold, 1.2 line height
typography.heading2  // 20px, semibold, 1.2 line height
typography.body      // 16px, medium, 1.5 line height
typography.caption   // 14px, normal, 1.5 line height
```

### Spacing

Use consistent spacing values throughout the application:

```typescript
spacing.xs   // 4px
spacing.sm   // 8px
spacing.md   // 12px
spacing.lg   // 16px
spacing.xl   // 24px
spacing['2xl'] // 32px
spacing['3xl'] // 48px
spacing['4xl'] // 64px
```

### Border Radius

```typescript
radius.sm   // 6px
radius.md   // 12px
radius.lg   // 24px
radius.full // 9999px (fully rounded)
```

### Shadows

Pre-defined shadow styles for elevation:

```typescript
shadows.sm  // Subtle shadow
shadows.md  // Medium shadow
shadows.lg  // Strong shadow
```

## Components

### Button

A versatile button component with multiple variants and states.

```typescript
import { Button } from '@/components/ui/Button';

<Button
  title="Click me"
  onPress={() => {}}
  variant="primary" // 'primary' | 'secondary' | 'outline'
  size="md"        // 'sm' | 'md' | 'lg'
  disabled={false}
  loading={false}
/>
```

#### Variants
- **Primary**: Main call-to-action buttons
- **Secondary**: Secondary actions
- **Outline**: Tertiary actions or button groups

#### Accessibility
- Minimum 44pt touch target
- Screen reader support
- Proper focus states

### TextInput

A form input component with label, error states, and helper text.

```typescript
import { TextInput } from '@/components/ui/TextInput';

<TextInput
  label="Email Address"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  helperText="We'll never share your email"
  required
/>
```

#### Features
- Label with optional required indicator
- Error state with custom error messages
- Helper text for additional context
- Focus states with visual feedback
- Full accessibility support

### Card

A container component for grouping related content.

```typescript
import { Card } from '@/components/ui/Card';

<Card
  variant="elevated" // 'default' | 'elevated' | 'outlined'
  padding="lg"       // Any spacing token key
>
  <Text>Card content goes here</Text>
</Card>
```

#### Variants
- **Default**: Basic card with background color
- **Elevated**: Card with shadow for visual hierarchy
- **Outlined**: Card with border outline

### BottomNav

A tab navigation component for bottom navigation bars.

```typescript
import { BottomNav } from '@/components/ui/BottomNav';

const navItems = [
  {
    id: 'home',
    label: 'Home',
    icon: <HomeIcon />,
    onPress: () => navigate('Home'),
  },
  // ... more items
];

<BottomNav
  items={navItems}
  activeItemId="home"
/>
```

#### Features
- Support for 3-5 navigation items
- Active state indication
- Flexible icon support
- Full accessibility support
- Minimum touch targets

## Usage Guidelines

### Color Usage

#### Do
- Use `colors.primary` for main call-to-action elements
- Use `colors.accent` for highlights and secondary actions
- Use semantic colors (`colors.error`, `colors.success`) for status indicators
- Maintain sufficient contrast ratios for accessibility

#### Don't
- Don't use hard-coded hex values in components
- Don't use colors outside the defined palette
- Don't use primary colors for large background areas

### Typography Usage

#### Do
- Use predefined text styles (`typography.heading1`, `typography.body`, etc.)
- Maintain consistent line heights and font weights
- Use appropriate font sizes for hierarchy

#### Don't
- Don't use arbitrary font sizes
- Don't mix too many font weights in a single interface
- Don't use font sizes smaller than 12px for body text

### Spacing Usage

#### Do
- Use consistent spacing tokens for margins and padding
- Follow the 8px grid system
- Use larger spacing for better touch targets on mobile

#### Don't
- Don't use arbitrary spacing values
- Don't create cramped interfaces with insufficient spacing
- Don't use inconsistent spacing between similar elements

## Accessibility

All components follow accessibility best practices:

- **Touch Targets**: Minimum 44pt touch targets for interactive elements
- **Color Contrast**: WCAG AA compliant color combinations
- **Screen Readers**: Proper ARIA labels and roles
- **Keyboard Navigation**: Full keyboard support where applicable
- **Focus Management**: Clear focus indicators and logical tab order

## Testing

Components include comprehensive test coverage:

```bash
# Run all component tests
npm test

# Run tests for specific component
npm test Button.test.tsx

# Run tests in watch mode
npm test -- --watch
```

## Storybook

View and interact with components in Storybook:

```bash
# Start Storybook
npm run storybook
```

Storybook provides:
- Interactive component playground
- Documentation for each component
- Visual testing for different states
- Dark mode toggle for testing themes

## Best Practices

### Component Development
1. Always import design tokens instead of hard-coding values
2. Follow the established naming conventions
3. Include proper TypeScript types
4. Add comprehensive tests for new components
5. Document components in Storybook

### Design Token Usage
1. Use semantic color names when possible
2. Prefer spacing tokens over arbitrary values
3. Use consistent border radius values
4. Apply shadows consistently for elevation

### Accessibility
1. Always include proper ARIA labels
2. Ensure sufficient color contrast
3. Test with screen readers
4. Provide keyboard navigation support
5. Use semantic HTML elements

## Migration Guide

When updating existing components to use the design system:

1. **Replace hard-coded colors** with design tokens:
   ```typescript
   // Before
   backgroundColor: '#4A7C59'
   
   // After
   backgroundColor: colors.primary
   ```

2. **Update spacing values** to use tokens:
   ```typescript
   // Before
   padding: 16
   
   // After
   padding: spacing.lg
   ```

3. **Use predefined text styles**:
   ```typescript
   // Before
   fontSize: 24,
   fontWeight: '700',
   
   // After
   ...typography.heading1
   ```

4. **Add accessibility properties**:
   ```typescript
   // Add proper accessibility roles and labels
   accessibilityRole="button"
   accessibilityLabel="Submit form"
   ```

## Contributing

When contributing to the design system:

1. Follow the established patterns and conventions
2. Add tests for new components or token changes
3. Update Storybook documentation
4. Ensure accessibility compliance
5. Get design approval for new tokens or components

## Resources

- [React Native Accessibility Guide](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility/overview/introduction/)