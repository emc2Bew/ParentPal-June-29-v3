import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react-native';

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

const MainParent: React.FC = () => {
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
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#2C2C2C]">School Events</h1>
            <Calendar className="w-6 h-6 text-[#666666]" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date} className="mb-8">
            {/* Date Header */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[#2C2C2C] mb-1">
                {formatDate(date)}
              </h2>
              <p className="text-sm text-[#666666]">{date.split(' ')[0]}</p>
            </div>

            {/* Events for this date */}
            <div className="space-y-3">
              {dayEvents.map((event, index) => (
                <div
                  key={`${date}-${index}`}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 transition-all duration-200 hover:shadow-md relative overflow-hidden"
                >
                  {/* Status indicator bar */}
                  <div
                    className="absolute left-0 top-0 w-1 h-full"
                    style={{
                      backgroundColor: getProgressBarColor(event.status)
                    }}
                  />

                  {/* Event content */}
                  <div className="ml-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-[#666666]" />
                          <span className="text-sm font-medium text-[#666666]">
                            {event.time}
                          </span>
                        </div>
                        <h3 className="text-base font-medium text-[#2C2C2C] leading-tight mb-2">
                          {event.title}
                        </h3>
                      </div>
                      
                      {/* Status badge */}
                      <div className="ml-3 flex-shrink-0">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{
                            backgroundColor: getProgressBarColor(event.status)
                          }}
                        >
                          {getStatusLabel(event.status)}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-[#666666]">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Summary footer */}
        <div className="mt-12 p-4 bg-white rounded-xl shadow-sm border border-gray-50">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">
              End of Term Summary
            </h3>
            <p className="text-sm text-[#666666] mb-3">
              {events.length} events scheduled
            </p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-[#F5F1E8] rounded-lg">
                <div className="text-2xl font-bold text-[#4A7C59]">
                  {events.filter(e => e.location).length}
                </div>
                <div className="text-xs text-[#666666] mt-1">
                  With Locations
                </div>
              </div>
              <div className="p-3 bg-[#F5F1E8] rounded-lg">
                <div className="text-2xl font-bold text-[#E8833A]">
                  {events.filter(e => e.time === 'All Day').length}
                </div>
                <div className="text-xs text-[#666666] mt-1">
                  All Day Events
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainParent;