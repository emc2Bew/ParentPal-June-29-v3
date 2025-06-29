import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email}</Text>
        
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{user?.id}</Text>
        
        <Text style={styles.label}>Email Verified:</Text>
        <Text style={styles.value}>
          {user?.email_confirmed_at ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    marginTop: 60,
  },
  infoContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
  },
});