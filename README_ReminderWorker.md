# Reminder Worker Service

A Python 3.12 service that processes school events, creates Google Calendar entries, and schedules push notifications for parents.

## Overview

The Reminder Worker handles the complete lifecycle of event reminders:

1. **Event Processing**: Syncs pending events to Google Calendar
2. **Reminder Scheduling**: Creates notification reminders (24h, 3h, 30min before events)
3. **Push Notifications**: Sends timely notifications to parents via Expo

## Architecture

```
Events Table → Worker → Google Calendar API
     ↓              ↓
Reminders Table → Push Notifications → Expo
```

## Features

- **Google Calendar Integration**: Creates/updates calendar events using user OAuth tokens
- **Smart Scheduling**: Automatically schedules 3 reminder notifications per event
- **Push Notifications**: Sends notifications via Expo Push API
- **Idempotent Processing**: Safe to run multiple times without duplicates
- **Retry Logic**: Failed notifications retry up to 5 times with exponential backoff
- **Error Handling**: Comprehensive error handling with detailed logging

## Environment Variables

Set these environment variables in your deployment:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Calendar API
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[your-private-key]\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLIENT_ID=your-oauth-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-oauth-client-secret

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your_expo_access_token
```

## Database Schema

The worker expects these tables to exist:

### Events Table
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'pending',
    google_calendar_id TEXT,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Reminders Table
```sql
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    reminder_type TEXT NOT NULL, -- '24_hours', '3_hours', '30_minutes'
    notify_at_ts TIMESTAMPTZ NOT NULL,
    sent_at_ts TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, reminder_type)
);
```

### User Extensions
```sql
-- Add these columns to auth.users table
ALTER TABLE auth.users ADD COLUMN google_refresh_token TEXT;
ALTER TABLE auth.users ADD COLUMN expo_push_token TEXT;
```

## Local Development

### Prerequisites

- Python 3.12
- Docker (optional)
- Google Cloud Project with Calendar API enabled
- Expo account with push notification access

### Setup

1. **Clone and install dependencies:**
```bash
cd worker
pip install -r requirements.txt
```

2. **Set environment variables:**
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_key"
export GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
export GOOGLE_PROJECT_ID="your-project-id"
export GOOGLE_CLIENT_ID="your-client-id.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export EXPO_ACCESS_TOKEN="your_expo_token"
```

3. **Run locally:**
```bash
python main.py
```

### Testing

Run the comprehensive test suite:

```bash
# Install test dependencies
pip install pytest pytest-mock

# Run tests
pytest tests/reminder_worker_test.py -v

# Run with coverage
pytest tests/reminder_worker_test.py --cov=main --cov-report=html
```

## Deployment

### Docker Deployment

1. **Build Docker image:**
```bash
docker build -t reminder-worker .
```

2. **Run container:**
```bash
docker run -e SUPABASE_URL="..." -e SUPABASE_SERVICE_ROLE_KEY="..." reminder-worker
```

### Supabase Edge Functions

1. **Deploy as Edge Function:**
```bash
supabase functions deploy reminder-worker --project-ref your-project-ref
```

2. **Set environment variables:**
```bash
supabase secrets set --project-ref your-project-ref \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your_key" \
  GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com" \
  GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..." \
  GOOGLE_PROJECT_ID="your-project-id" \
  GOOGLE_CLIENT_ID="your-client-id.googleusercontent.com" \
  GOOGLE_CLIENT_SECRET="your-client-secret" \
  EXPO_ACCESS_TOKEN="your_expo_token"
```

3. **Set up cron schedule:**
```bash
# The cron.yaml file configures automatic execution every minute
supabase functions deploy reminder-worker --project-ref your-project-ref --cron-schedule "* * * * *"
```

## Google Cloud Setup

### 1. Enable APIs

```bash
gcloud services enable calendar-readonly.googleapis.com
gcloud services enable calendar.googleapis.com
```

### 2. Create Service Account

```bash
# Create service account for server-to-server operations
gcloud iam service-accounts create reminder-worker \
    --display-name="Reminder Worker Service"

# Create and download key
gcloud iam service-accounts keys create reminder-service-key.json \
    --iam-account=reminder-worker@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. OAuth Setup for User Calendar Access

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Create OAuth 2.0 Client ID for your application
4. Add authorized redirect URIs for your app
5. Download client configuration

## Expo Push Notifications Setup

### 1. Get Access Token

1. Install Expo CLI: `npm install -g @expo/cli`
2. Login: `expo login`
3. Generate token: `expo whoami --json` (use the access token)

### 2. Register Push Tokens

In your mobile app, register for push notifications:

```typescript
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status === 'granted') {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Save token to user profile
    await supabase
      .from('auth.users')
      .update({ expo_push_token: token })
      .eq('id', user.id);
  }
}
```

## Workflow Details

### Event Processing Flow

1. **Query Pending Events**
   ```sql
   SELECT * FROM events WHERE status = 'pending'
   ```

2. **For Each Event:**
   - Get user's Google refresh token
   - Create/refresh OAuth credentials
   - Create/update Google Calendar event
   - Store calendar event ID
   - Create reminder notifications
   - Mark event as 'synced'

3. **Reminder Creation:**
   - 24 hours before event
   - 3 hours before event
   - 30 minutes before event

### Push Notification Flow

1. **Query Due Reminders**
   ```sql
   SELECT * FROM reminders 
   WHERE notify_at_ts <= NOW() 
   AND sent_at_ts IS NULL 
   AND retry_count < 5
   ```

2. **For Each Reminder:**
   - Get user's Expo push token
   - Send push notification
   - Mark as sent or increment retry count
   - Handle failures with exponential backoff

## Performance Characteristics

- **Processing Time**: ~100ms per event
- **Memory Usage**: ~50MB at runtime
- **Batch Size**: Processes all pending items per run
- **Retry Logic**: Up to 5 attempts with exponential backoff

## Error Handling

### Common Error Scenarios

1. **Google API Errors**
   - Invalid/expired refresh tokens
   - Calendar API rate limits
   - Network connectivity issues

2. **Push Notification Errors**
   - Invalid/expired push tokens
   - Expo service unavailable
   - Device not registered

3. **Database Errors**
   - Connection timeouts
   - Constraint violations
   - Transaction conflicts

### Error Recovery

- **Automatic Retry**: Failed operations retry up to 5 times
- **Exponential Backoff**: Increasing delays between retries
- **Error Logging**: Detailed error messages for debugging
- **Graceful Degradation**: Continues processing other items on individual failures

## Monitoring

### Key Metrics

- Events processed per minute
- Reminders created/sent
- Push notification success rate
- Error rates by type
- Processing latency

### Logging

The service provides structured logging:

```python
logger.info(f"Processing {len(events)} pending events")
logger.error(f"Failed to create calendar event for {event['id']}: {error}")
logger.warning(f"No Google refresh token for user {user_id}")
```

### Health Checks

Monitor these endpoints/metrics:

- Database connectivity
- Google Calendar API availability
- Expo Push API availability
- Processing queue length

## Security Considerations

- **OAuth Tokens**: Securely stored and refreshed automatically
- **Service Account**: Minimal required permissions
- **Environment Variables**: Sensitive data stored as secrets
- **Database Access**: Uses service role key with RLS policies
- **API Rate Limits**: Respects Google Calendar and Expo rate limits

## Troubleshooting

### Common Issues

1. **Events Not Syncing**
   - Check user has valid Google refresh token
   - Verify Google Calendar API permissions
   - Check service account credentials

2. **Push Notifications Not Sending**
   - Verify user has valid Expo push token
   - Check Expo access token validity
   - Verify device registration

3. **Database Connection Issues**
   - Check Supabase service role key
   - Verify network connectivity
   - Check RLS policies

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## API Reference

### Main Functions

#### `process_events()`
Processes all pending events and syncs them to Google Calendar.

**Returns:** None
**Side Effects:** Updates events table, creates reminders

#### `process_push_notifications()`
Sends push notifications for due reminders.

**Returns:** None
**Side Effects:** Updates reminders table, sends push notifications

#### `create_calendar_event(service, event_data)`
Creates or updates a Google Calendar event.

**Parameters:**
- `service`: Google Calendar API service instance
- `event_data`: Event data dictionary

**Returns:** Calendar event ID or None

#### `send_push_notification(push_token, title, body, data)`
Sends a push notification via Expo.

**Parameters:**
- `push_token`: Expo push token
- `title`: Notification title
- `body`: Notification body
- `data`: Additional data payload

**Returns:** Boolean success status

## License

This service is part of the Parent Pal application and follows the same licensing terms.