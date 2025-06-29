import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { CheckCircle, Mail } from 'lucide-react-native';

export default function VerifyEmailScreen() {
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  const { refreshUser, user } = useAuth();

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const checkEmailVerification = async () => {
    setChecking(true);
    try {
      const { user: updatedUser, error } = await refreshUser();
      
      if (error) {
        showToast('Error checking verification status', 'error');
      } else if (updatedUser?.email_confirmed_at) {
        showToast('Email verified successfully!', 'success');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1500);
      } else {
        showToast('Email not yet verified', 'info');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setChecking(false);
    }
  };

  // Auto-check every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!checking) {
        const { user: updatedUser } = await refreshUser();
        if (updatedUser?.email_confirmed_at) {
          clearInterval(interval);
          showToast('Email verified successfully!', 'success');
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 1500);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checking, refreshUser]);

  const handleBackToLogin = () => {
    router.push('/screens/Auth/Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={64} color="#3B82F6" />
        </View>

        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to your email address. Please click the link to verify your account.
        </Text>

        <View style={styles.infoBox}>
          <CheckCircle size={20} color="#10B981" />
          <Text style={styles.infoText}>
            We're automatically checking your verification status
          </Text>
        </View>

        <Button
          title={checking ? "Checking..." : "Check Verification Status"}
          onPress={checkEmailVerification}
          loading={checking}
          style={styles.checkButton}
        />

        <Button
          title="Back to Login"
          onPress={handleBackToLogin}
          variant="outline"
          style={styles.backButton}
        />
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#065F46',
    flex: 1,
  },
  checkButton: {
    width: '100%',
    marginBottom: 16,
  },
  backButton: {
    width: '100%',
  },
});