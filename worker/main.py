import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import time

import psycopg
from google.auth.transport import requests
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
GOOGLE_CLIENT_EMAIL = os.environ.get('GOOGLE_CLIENT_EMAIL')
GOOGLE_PRIVATE_KEY = os.environ.get('GOOGLE_PRIVATE_KEY', '').replace('\\n', '\n')
GOOGLE_PROJECT_ID = os.environ.get('GOOGLE_PROJECT_ID')
EXPO_ACCESS_TOKEN = os.environ.get('EXPO_ACCESS_TOKEN')

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
push_client = PushClient()

def get_service_account_credentials():
    """Create service account credentials for Google Calendar API."""
    try:
        credentials_info = {
            "type": "service_account",
            "project_id": GOOGLE_PROJECT_ID,
            "private_key_id": "",
            "private_key": GOOGLE_PRIVATE_KEY,
            "client_email": GOOGLE_CLIENT_EMAIL,
            "client_id": "",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
        }
        
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        
        return credentials
        
    except Exception as e:
        logger.error(f"Failed to create service account credentials: {e}")
        raise

def get_user_calendar_service(refresh_token: str):
    """Create Calendar API service using user's OAuth token."""
    try:
        # Create credentials from refresh token
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.environ.get('GOOGLE_CLIENT_ID'),
            client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        
        # Refresh the token
        credentials.refresh(requests.Request())
        
        service = build('calendar', 'v3', credentials=credentials)
        return service
        
    except Exception as e:
        logger.error(f"Failed to create user calendar service: {e}")
        raise

def create_calendar_event(service, event_data: Dict[str, Any]) -> Optional[str]:
    """Create or update a Google Calendar event."""
    try:
        # Convert event data to Google Calendar format
        calendar_event = {
            'summary': event_data['title'],
            'description': event_data.get('description', ''),
            'start': {
                'dateTime': event_data['start_time'].isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': event_data['end_time'].isoformat(),
                'timeZone': 'UTC',
            },
            'location': event_data.get('location', ''),
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 24 * 60},  # 24 hours
                    {'method': 'popup', 'minutes': 3 * 60},   # 3 hours
                    {'method': 'popup', 'minutes': 30},       # 30 minutes
                ],
            },
        }
        
        # Check if event already exists (using external_id)
        if event_data.get('google_calendar_id'):
            # Update existing event
            updated_event = service.events().update(
                calendarId='primary',
                eventId=event_data['google_calendar_id'],
                body=calendar_event
            ).execute()
            
            logger.info(f"Updated calendar event: {updated_event['id']}")
            return updated_event['id']
        else:
            # Create new event
            created_event = service.events().insert(
                calendarId='primary',
                body=calendar_event
            ).execute()
            
            logger.info(f"Created calendar event: {created_event['id']}")
            return created_event['id']
            
    except HttpError as e:
        logger.error(f"Google Calendar API error: {e}")
        return None
    except Exception as e:
        logger.error(f"Failed to create/update calendar event: {e}")
        return None

def create_reminder_notifications(event_id: str, event_start_time: datetime) -> bool:
    """Create reminder entries for an event."""
    try:
        # Calculate notification times
        reminder_times = [
            event_start_time - timedelta(hours=24),   # 24 hours before
            event_start_time - timedelta(hours=3),    # 3 hours before
            event_start_time - timedelta(minutes=30), # 30 minutes before
        ]
        
        reminder_types = ['24_hours', '3_hours', '30_minutes']
        
        for reminder_time, reminder_type in zip(reminder_times, reminder_types):
            # Skip if reminder time is in the past
            if reminder_time <= datetime.utcnow():
                continue
                
            # Insert reminder with conflict handling for idempotency
            response = supabase.table('reminders').upsert({
                'event_id': event_id,
                'reminder_type': reminder_type,
                'notify_at_ts': reminder_time.isoformat(),
                'status': 'pending',
                'retry_count': 0
            }, on_conflict='event_id,reminder_type').execute()
            
            logger.info(f"Created reminder for event {event_id}: {reminder_type}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to create reminders for event {event_id}: {e}")
        return False

def process_events():
    """Main function to process pending events."""
    try:
        # Query pending events
        response = supabase.table('events').select(
            'id, title, description, start_time, end_time, location, user_id, google_calendar_id'
        ).eq('status', 'pending').execute()
        
        events = response.data
        logger.info(f"Processing {len(events)} pending events")
        
        for event in events:
            try:
                # Get user's Google refresh token
                user_response = supabase.table('auth.users').select(
                    'google_refresh_token'
                ).eq('id', event['user_id']).execute()
                
                if not user_response.data or not user_response.data[0].get('google_refresh_token'):
                    logger.warning(f"No Google refresh token for user {event['user_id']}")
                    continue
                
                refresh_token = user_response.data[0]['google_refresh_token']
                
                # Create calendar service for user
                calendar_service = get_user_calendar_service(refresh_token)
                
                # Convert string timestamps to datetime objects
                event['start_time'] = datetime.fromisoformat(event['start_time'].replace('Z', '+00:00'))
                event['end_time'] = datetime.fromisoformat(event['end_time'].replace('Z', '+00:00'))
                
                # Create/update Google Calendar event
                calendar_event_id = create_calendar_event(calendar_service, event)
                
                if calendar_event_id:
                    # Update event with calendar ID and mark as synced
                    supabase.table('events').update({
                        'google_calendar_id': calendar_event_id,
                        'status': 'synced',
                        'synced_at': datetime.utcnow().isoformat()
                    }).eq('id', event['id']).execute()
                    
                    # Create reminder notifications
                    create_reminder_notifications(event['id'], event['start_time'])
                    
                    logger.info(f"Successfully processed event {event['id']}")
                else:
                    logger.error(f"Failed to create calendar event for {event['id']}")
                    
            except Exception as e:
                logger.error(f"Error processing event {event['id']}: {e}")
                continue
        
        logger.info("Completed processing events")
        
    except Exception as e:
        logger.error(f"Error in process_events: {e}")
        raise

def send_push_notification(push_token: str, title: str, body: str, data: Dict = None) -> bool:
    """Send a push notification using Expo."""
    try:
        message = PushMessage(
            to=push_token,
            title=title,
            body=body,
            data=data or {},
            sound='default',
            badge=1
        )
        
        response = push_client.publish(message)
        
        # Check for errors
        if response.push_ticket_errors:
            for error in response.push_ticket_errors:
                logger.error(f"Push notification error: {error}")
                return False
        
        logger.info(f"Push notification sent successfully to {push_token}")
        return True
        
    except DeviceNotRegisteredError:
        logger.warning(f"Device not registered: {push_token}")
        return False
    except PushServerError as e:
        logger.error(f"Push server error: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
        return False

def process_push_notifications():
    """Process pending push notifications."""
    try:
        # Query pending reminders
        current_time = datetime.utcnow().isoformat()
        
        response = supabase.table('reminders').select(
            'id, event_id, reminder_type, retry_count, events(title, start_time, user_id)'
        ).lte('notify_at_ts', current_time).is_('sent_at_ts', 'null').lt('retry_count', 5).execute()
        
        reminders = response.data
        logger.info(f"Processing {len(reminders)} pending reminders")
        
        for reminder in reminders:
            try:
                event = reminder['events']
                user_id = event['user_id']
                
                # Get user's push token
                user_response = supabase.table('auth.users').select(
                    'expo_push_token'
                ).eq('id', user_id).execute()
                
                if not user_response.data or not user_response.data[0].get('expo_push_token'):
                    logger.warning(f"No push token for user {user_id}")
                    # Mark as failed
                    supabase.table('reminders').update({
                        'status': 'failed',
                        'error_message': 'No push token available'
                    }).eq('id', reminder['id']).execute()
                    continue
                
                push_token = user_response.data[0]['expo_push_token']
                
                # Create notification content
                reminder_type_map = {
                    '24_hours': '24 hours',
                    '3_hours': '3 hours',
                    '30_minutes': '30 minutes'
                }
                
                time_text = reminder_type_map.get(reminder['reminder_type'], reminder['reminder_type'])
                title = f"Upcoming Event: {event['title']}"
                body = f"Your event starts in {time_text}"
                
                # Send push notification
                success = send_push_notification(
                    push_token=push_token,
                    title=title,
                    body=body,
                    data={
                        'event_id': reminder['event_id'],
                        'reminder_type': reminder['reminder_type']
                    }
                )
                
                if success:
                    # Mark as sent
                    supabase.table('reminders').update({
                        'status': 'sent',
                        'sent_at_ts': datetime.utcnow().isoformat()
                    }).eq('id', reminder['id']).execute()
                    
                    logger.info(f"Sent reminder {reminder['id']} for event {reminder['event_id']}")
                else:
                    # Increment retry count
                    new_retry_count = reminder['retry_count'] + 1
                    status = 'failed' if new_retry_count >= 5 else 'pending'
                    
                    supabase.table('reminders').update({
                        'retry_count': new_retry_count,
                        'status': status,
                        'error_message': 'Push notification failed' if status == 'failed' else None
                    }).eq('id', reminder['id']).execute()
                    
                    logger.warning(f"Failed to send reminder {reminder['id']}, retry count: {new_retry_count}")
                
            except Exception as e:
                logger.error(f"Error processing reminder {reminder['id']}: {e}")
                
                # Increment retry count on error
                new_retry_count = reminder.get('retry_count', 0) + 1
                status = 'failed' if new_retry_count >= 5 else 'pending'
                
                supabase.table('reminders').update({
                    'retry_count': new_retry_count,
                    'status': status,
                    'error_message': str(e) if status == 'failed' else None
                }).eq('id', reminder['id']).execute()
                
                continue
        
        logger.info("Completed processing push notifications")
        
    except Exception as e:
        logger.error(f"Error in process_push_notifications: {e}")
        raise

def main():
    """Main entry point for the worker."""
    try:
        logger.info("Starting reminder worker")
        
        # Process events first
        process_events()
        
        # Then process push notifications
        process_push_notifications()
        
        logger.info("Reminder worker completed successfully")
        
    except Exception as e:
        logger.error(f"Reminder worker failed: {e}")
        raise

if __name__ == '__main__':
    main()

  #we couuld receive real time to supabase but essentially sub/pub shoudl trigger it to the database and we read it from there