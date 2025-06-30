import { View, Text, StyleSheet } from 'react-native';
import { Calendar, MapPin, Clock } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import  MainParent from '@/components/ui/MainParent'

interface Event {
  time: string;
  title: string;
  date: string;
  location: string;
  status: string;
}

// ollama is broken and run locally to get data parse
// FIX ollama 

const events: Event[] = [
  {"time": "9:00 AM", "title": "Year 6 Outward Bound - 4 nights/5 days", "date": "Monday 30th June", "location": "", "status": "upcoming"},
  {"time": "9:00 AM", "title": "Reception End of Year Performance Dress rehearsal", "date": "Tuesday 1st July", "location": "Wallbank Hall", "status": "upcoming"},
  {"time": "All Day", "title": "Reception Teddy Bears' Picnic", "date": "Thursday 3rd July", "location": "Playground", "status": "upcoming"},
  {"time": "All Day", "title": "Nursery's Teddy Bears' Picnic", "date": "Friday 4th July", "location": "Playground", "status": "upcoming"},
  {"time": "All Day", "title": "Last Swimming Day", "date": "Friday 4th July", "location": "", "status": "upcoming"},
  {"time": "3:45 PM", "title": "Year 5 Open Art Studio", "date": "Friday 4th July", "location": "", "status": "upcoming"},
  {"time": "9:00 AM", "title": "Year 3 and 4 Maths Show", "date": "Monday 7th July", "location": "Wallbank Hall", "status": "upcoming"},
  {"time": "2:00 PM", "title": "Year 6 leavers' assembly with Bishop Rose", "date": "Monday 7th July", "location": "", "status": "upcoming"},
  {"time": "9:00 AM", "title": "Reception End of Year Performance", "date": "Tuesday 8th July", "location": "Wallbank Hall", "status": "upcoming"},
  {"time": "10:00 AM", "title": "Year 6 Kenwood Trip", "date": "Tuesday 8th July", "location": "", "status": "upcoming"},
  {"time": "9:45 AM", "title": "Year 3 Trip to The Young V & A Museum", "date": "Tuesday 8th July", "location": "", "status": "upcoming"},
  {"time": "9:00 AM", "title": "Junior Choir performance", "date": "Wednesday 9th July", "location": "Dining Hall", "status": "upcoming"},
  {"time": "9:30 AM", "title": "Summer Concert Rehearsals", "date": "Wednesday 9th July", "location": "", "status": "upcoming"},
  {"time": "2:00 PM", "title": "Summer Concert", "date": "Wednesday 9th July", "location": "Wallbank Hall", "status": "upcoming"},
  {"time": "2:00 PM", "title": "Year 6 Prize Giving", "date": "Thursday 10th July", "location": "Wallbank Hall", "status": "upcoming"},
  {"time": "12:00 PM", "title": "TERM ENDS - half day", "date": "Friday 11th July", "location": "", "status": "upcoming"}
];



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