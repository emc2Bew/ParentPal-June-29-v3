import { View, Text, StyleSheet } from 'react-native';
import { Calendar, MapPin, Clock } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import  MainParent from '@ui/components/ui/MainParent'

interface Event {
  time: string;
  title: string;
  date: string;
  location: string;
  status: string;
}

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

const MainParent1: React.FC = () => {
  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'updated':
        return '#F4A261';
      case 'cancelled':
        return '#E76F51';
      case 'upcoming':
      case 'new':
      default:
        return '#4A7C59';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'updated':
        return 'Updated';
      case 'cancelled':
        return 'Cancelled';
      case 'upcoming':
        return 'Upcoming';
      case 'new':
        return 'New';
      default:
        return 'Upcoming';
    }
  };

  const formatDate = (dateString: string) => {
    // Extract just the day and month from the date string
    const parts = dateString.split(' ');
    return `${parts[1]} ${parts[2]}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>School Events</Text>
            <Calendar size={24} color="#666666" />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <View key={date} style={styles.dateSection}>
            {/* Date Header */}
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>
                {formatDate(date)}
              </Text>
              <Text style={styles.dateSubtitle}>{date.split(' ')[0]}</Text>
            </View>

            {/* Events for this date */}
            <View style={styles.eventsContainer}>
              {dayEvents.map((event, index) => (
                <View
                  key={`${date}-${index}`}
                  style={styles.eventCard}
                >
                  {/* Status indicator bar */}
                  <View
                    style={[
                      styles.statusBar,
                      { backgroundColor: getProgressBarColor(event.status) }
                    ]}
                  />

                  {/* Event content */}
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventInfo}>
                        <View style={styles.timeRow}>
                          <Clock size={16} color="#666666" />
                          <Text style={styles.timeText}>
                            {event.time}
                          </Text>
                        </View>
                        <Text style={styles.eventTitle}>
                          {event.title}
                        </Text>
                      </View>
                      
                      {/* Status badge */}
                      <View style={styles.statusBadgeContainer}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getProgressBarColor(event.status) }
                          ]}
                        >
                          <Text style={styles.statusBadgeText}>
                            {getStatusLabel(event.status)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Location */}
                    {event.location ? (
                      <View style={styles.locationRow}>
                        <MapPin size={16} color="#666666" />
                        <Text style={styles.locationText}>{event.location}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Summary footer */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              End of Term Summary
            </Text>
            <Text style={styles.summarySubtitle}>
              {events.length} events scheduled
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {events.filter(e => e.location).length}
                </Text>
                <Text style={styles.statLabel}>
                  With Locations
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#E8833A' }]}>
                  {events.filter(e => e.time === 'All Day').length}
                </Text>
                <Text style={styles.statLabel}>
                  All Day Events
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};



export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
   <View style={styles.container}>
  <Text style={styles.title}>Welcome Home!</Text>
  {(user?.email === 'parent007@gmail.com' ||
    user?.email === 'emc2.bew.1@gmail.com') && <MainParent1 />}
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