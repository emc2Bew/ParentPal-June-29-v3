import { View, Text, StyleSheet } from 'react-native';
import { Calendar, MapPin, Clock } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import  MainParent from '@ui/components/ui/MainParent'


export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
   <View style={styles.container}>
  <Text style={styles.title}>Welcome Home!</Text>
  {(user?.email === 'parent007@gmail.com' ||
    user?.email === 'emc2.bew.1@gmail.com') && <MainParent />}
  <Text style={styles.subtitle}>Logged in as: {user?.email}</Text>
  {/* <Text style={styles.subtitle}>
    Logged in as: {user?.email}
  </Text>
  <Button
    title="Sign Out"
    onPress={handleSignOut}
    variant="outline"
    style={styles.signOutButton}
  /> */}
</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  signOutButton: {
    marginTop: 16,
  },
});