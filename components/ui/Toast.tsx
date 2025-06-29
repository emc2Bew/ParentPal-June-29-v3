import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AlertTriangle, CheckCircle, X } from 'lucide-react-native';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type, visible, onHide }: ToastProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onHide());
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, onHide]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#10B981" />;
      case 'error':
        return <AlertTriangle size={20} color="#EF4444" />;
      default:
        return <AlertTriangle size={20} color="#3B82F6" />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        styles[type],
        { opacity }
      ]}
    >
      {getIcon()}
      <Text style={[styles.message, styles[`${type}Text`]]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  success: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  error: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  info: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  message: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  successText: {
    color: '#065F46',
  },
  errorText: {
    color: '#991B1B',
  },
  infoText: {
    color: '#1E40AF',
  },
});