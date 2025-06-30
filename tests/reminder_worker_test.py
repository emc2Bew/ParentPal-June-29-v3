import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import sys
import os

# Add the parent directory to the path so we can import main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from worker.main import (
    process_events,
    process_push_notifications,
    create_calendar_event,
    create_reminder_notifications,
    send_push_notification,
    get_user_calendar_service
)

@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    with patch('worker.main.supabase') as mock:
        yield mock

@pytest.fixture
def mock_push_client():
    """Mock Expo push client."""
    with patch('worker.main.push_client') as mock:
        yield mock

@pytest.fixture
def sample_event():
    """Sample event data."""
    return {
        'id': 'event-123',
        'title': 'School Meeting',
        'description': 'Parent-teacher conference',
        'start_time': datetime.utcnow() + timedelta(hours=25),
        'end_time': datetime.utcnow() + timedelta(hours=26),
        'location': 'School Library',
        'user_id': 'user-456',
        'google_calendar_id': None
    }

@pytest.fixture
def sample_reminder():
    """Sample reminder data."""
    return {
        'id': 'reminder-789',
        'event_id': 'event-123',
        'reminder_type': '24_hours',
        'retry_count': 0,
        'events': {
            'title': 'School Meeting',
            'start_time': (datetime.utcnow() + timedelta(hours=25)).isoformat(),
            'user_id': 'user-456'
        }
    }

class TestCalendarIntegration:
    """Test Google Calendar integration."""
    
    @patch('worker.main.build')
    @patch('worker.main.Credentials')
    @patch('worker.main.requests.Request')
    def test_get_user_calendar_service(self, mock_request, mock_credentials, mock_build):
        """Test creating user calendar service."""
        mock_creds = Mock()
        mock_credentials.return_value = mock_creds
        mock_service = Mock()
        mock_build.return_value = mock_service
        
        with patch.dict(os.environ, {
            'GOOGLE_CLIENT_ID': 'test-client-id',
            'GOOGLE_CLIENT_SECRET': 'test-client-secret'
        }):
            service = get_user_calendar_service('test-refresh-token')
            
            assert service == mock_service
            mock_creds.refresh.assert_called_once()

    def test_create_calendar_event_new(self):
        """Test creating a new calendar event."""
        mock_service = Mock()
        mock_events = Mock()
        mock_service.events.return_value = mock_events
        mock_insert = Mock()
        mock_events.insert.return_value = mock_insert
        mock_insert.execute.return_value = {'id': 'cal-event-123'}
        
        event_data = {
            'title': 'Test Event',
            'description': 'Test Description',
            'start_time': datetime.utcnow(),
            'end_time': datetime.utcnow() + timedelta(hours=1),
            'location': 'Test Location'
        }
        
        result = create_calendar_event(mock_service, event_data)
        
        assert result == 'cal-event-123'
        mock_events.insert.assert_called_once()

    def test_create_calendar_event_update(self):
        """Test updating an existing calendar event."""
        mock_service = Mock()
        mock_events = Mock()
        mock_service.events.return_value = mock_events
        mock_update = Mock()
        mock_events.update.return_value = mock_update
        mock_update.execute.return_value = {'id': 'cal-event-123'}
        
        event_data = {
            'title': 'Updated Event',
            'description': 'Updated Description',
            'start_time': datetime.utcnow(),
            'end_time': datetime.utcnow() + timedelta(hours=1),
            'location': 'Updated Location',
            'google_calendar_id': 'existing-cal-event-123'
        }
        
        result = create_calendar_event(mock_service, event_data)
        
        assert result == 'cal-event-123'
        mock_events.update.assert_called_once()

class TestReminderCreation:
    """Test reminder creation functionality."""
    
    @patch('worker.main.supabase')
    def test_create_reminder_notifications(self, mock_supabase):
        """Test creating reminder notifications."""
        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_upsert = Mock()
        mock_table.upsert.return_value = mock_upsert
        mock_upsert.execute.return_value = Mock()
        
        event_start_time = datetime.utcnow() + timedelta(hours=25)
        result = create_reminder_notifications('event-123', event_start_time)
        
        assert result is True
        # Should create 3 reminders (24h, 3h, 30min)
        assert mock_table.upsert.call_count == 3

    @patch('worker.main.supabase')
    def test_create_reminder_notifications_past_time(self, mock_supabase):
        """Test creating reminders when some times are in the past."""
        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_upsert = Mock()
        mock_table.upsert.return_value = mock_upsert
        mock_upsert.execute.return_value = Mock()
        
        # Event starts in 2 hours (only 30min reminder should be created)
        event_start_time = datetime.utcnow() + timedelta(hours=2)
        result = create_reminder_notifications('event-123', event_start_time)
        
        assert result is True
        # Should only create 1 reminder (30min)
        assert mock_table.upsert.call_count == 1

class TestPushNotifications:
    """Test push notification functionality."""
    
    @patch('worker.main.push_client')
    def test_send_push_notification_success(self, mock_push_client):
        """Test successful push notification."""
        mock_response = Mock()
        mock_response.push_ticket_errors = []
        mock_push_client.publish.return_value = mock_response
        
        result = send_push_notification(
            push_token='ExponentPushToken[test]',
            title='Test Title',
            body='Test Body',
            data={'test': 'data'}
        )
        
        assert result is True
        mock_push_client.publish.assert_called_once()

    @patch('worker.main.push_client')
    def test_send_push_notification_error(self, mock_push_client):
        """Test push notification with errors."""
        mock_response = Mock()
        mock_response.push_ticket_errors = ['Device not registered']
        mock_push_client.publish.return_value = mock_response
        
        result = send_push_notification(
            push_token='ExponentPushToken[invalid]',
            title='Test Title',
            body='Test Body'
        )
        
        assert result is False

class TestEventProcessing:
    """Test event processing workflow."""
    
    @patch('worker.main.get_user_calendar_service')
    @patch('worker.main.create_calendar_event')
    @patch('worker.main.create_reminder_notifications')
    def test_process_events_success(self, mock_create_reminders, mock_create_calendar, 
                                  mock_get_service, mock_supabase, sample_event):
        """Test successful event processing."""
        # Mock Supabase responses
        mock_events_table = Mock()
        mock_users_table = Mock()
        mock_supabase.table.side_effect = lambda table: {
            'events': mock_events_table,
            'auth.users': mock_users_table
        }[table]
        
        # Mock events query
        mock_select = Mock()
        mock_events_table.select.return_value = mock_select
        mock_eq = Mock()
        mock_select.eq.return_value = mock_eq
        mock_eq.execute.return_value = Mock(data=[{
            **sample_event,
            'start_time': sample_event['start_time'].isoformat(),
            'end_time': sample_event['end_time'].isoformat()
        }])
        
        # Mock user query
        mock_user_select = Mock()
        mock_users_table.select.return_value = mock_user_select
        mock_user_eq = Mock()
        mock_user_select.eq.return_value = mock_user_eq
        mock_user_eq.execute.return_value = Mock(data=[{
            'google_refresh_token': 'test-refresh-token'
        }])
        
        # Mock update
        mock_update = Mock()
        mock_events_table.update.return_value = mock_update
        mock_update_eq = Mock()
        mock_update.eq.return_value = mock_update_eq
        mock_update_eq.execute.return_value = Mock()
        
        # Mock calendar service and event creation
        mock_service = Mock()
        mock_get_service.return_value = mock_service
        mock_create_calendar.return_value = 'cal-event-123'
        mock_create_reminders.return_value = True
        
        # Run the function
        process_events()
        
        # Verify calls
        mock_get_service.assert_called_once_with('test-refresh-token')
        mock_create_calendar.assert_called_once()
        mock_create_reminders.assert_called_once()
        mock_events_table.update.assert_called_once()

    def test_process_events_no_google_token(self, mock_supabase, sample_event):
        """Test event processing when user has no Google token."""
        # Mock Supabase responses
        mock_events_table = Mock()
        mock_users_table = Mock()
        mock_supabase.table.side_effect = lambda table: {
            'events': mock_events_table,
            'auth.users': mock_users_table
        }[table]
        
        # Mock events query
        mock_select = Mock()
        mock_events_table.select.return_value = mock_select
        mock_eq = Mock()
        mock_select.eq.return_value = mock_eq
        mock_eq.execute.return_value = Mock(data=[sample_event])
        
        # Mock user query - no refresh token
        mock_user_select = Mock()
        mock_users_table.select.return_value = mock_user_select
        mock_user_eq = Mock()
        mock_user_select.eq.return_value = mock_user_eq
        mock_user_eq.execute.return_value = Mock(data=[{
            'google_refresh_token': None
        }])
        
        # Should not raise exception, just skip the event
        process_events()

class TestPushNotificationProcessing:
    """Test push notification processing workflow."""
    
    @patch('worker.main.send_push_notification')
    def test_process_push_notifications_success(self, mock_send_push, mock_supabase, sample_reminder):
        """Test successful push notification processing."""
        # Mock Supabase responses
        mock_reminders_table = Mock()
        mock_users_table = Mock()
        mock_supabase.table.side_effect = lambda table: {
            'reminders': mock_reminders_table,
            'auth.users': mock_users_table
        }[table]
        
        # Mock reminders query
        mock_select = Mock()
        mock_reminders_table.select.return_value = mock_select
        mock_lte = Mock()
        mock_select.lte.return_value = mock_lte
        mock_is = Mock()
        mock_lte.is_.return_value = mock_is
        mock_lt = Mock()
        mock_is.lt.return_value = mock_lt
        mock_lt.execute.return_value = Mock(data=[sample_reminder])
        
        # Mock user query
        mock_user_select = Mock()
        mock_users_table.select.return_value = mock_user_select
        mock_user_eq = Mock()
        mock_user_select.eq.return_value = mock_user_eq
        mock_user_eq.execute.return_value = Mock(data=[{
            'expo_push_token': 'ExponentPushToken[test]'
        }])
        
        # Mock update
        mock_update = Mock()
        mock_reminders_table.update.return_value = mock_update
        mock_update_eq = Mock()
        mock_update.eq.return_value = mock_update_eq
        mock_update_eq.execute.return_value = Mock()
        
        # Mock successful push
        mock_send_push.return_value = True
        
        # Run the function
        process_push_notifications()
        
        # Verify calls
        mock_send_push.assert_called_once()
        mock_reminders_table.update.assert_called_once()

    @patch('worker.main.send_push_notification')
    def test_process_push_notifications_retry(self, mock_send_push, mock_supabase, sample_reminder):
        """Test push notification retry logic."""
        # Mock Supabase responses
        mock_reminders_table = Mock()
        mock_users_table = Mock()
        mock_supabase.table.side_effect = lambda table: {
            'reminders': mock_reminders_table,
            'auth.users': mock_users_table
        }[table]
        
        # Mock reminders query
        mock_select = Mock()
        mock_reminders_table.select.return_value = mock_select
        mock_lte = Mock()
        mock_select.lte.return_value = mock_lte
        mock_is = Mock()
        mock_lte.is_.return_value = mock_is
        mock_lt = Mock()
        mock_is.lt.return_value = mock_lt
        mock_lt.execute.return_value = Mock(data=[sample_reminder])
        
        # Mock user query
        mock_user_select = Mock()
        mock_users_table.select.return_value = mock_user_select
        mock_user_eq = Mock()
        mock_user_select.eq.return_value = mock_user_eq
        mock_user_eq.execute.return_value = Mock(data=[{
            'expo_push_token': 'ExponentPushToken[test]'
        }])
        
        # Mock update
        mock_update = Mock()
        mock_reminders_table.update.return_value = mock_update
        mock_update_eq = Mock()
        mock_update.eq.return_value = mock_update_eq
        mock_update_eq.execute.return_value = Mock()
        
        # Mock failed push
        mock_send_push.return_value = False
        
        # Run the function
        process_push_notifications()
        
        # Verify retry count was incremented
        mock_reminders_table.update.assert_called_once()
        update_call = mock_reminders_table.update.call_args[0][0]
        assert update_call['retry_count'] == 1
        assert update_call['status'] == 'pending'

class TestIdempotency:
    """Test idempotency of operations."""
    
    @patch('worker.main.supabase')
    def test_reminder_creation_idempotent(self, mock_supabase):
        """Test that reminder creation is idempotent."""
        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_upsert = Mock()
        mock_table.upsert.return_value = mock_upsert
        mock_upsert.execute.return_value = Mock()
        
        event_start_time = datetime.utcnow() + timedelta(hours=25)
        
        # Create reminders twice
        create_reminder_notifications('event-123', event_start_time)
        create_reminder_notifications('event-123', event_start_time)
        
        # Should use upsert with conflict resolution
        assert mock_table.upsert.call_count == 6  # 3 reminders × 2 calls
        for call in mock_table.upsert.call_args_list:
            assert call[1]['on_conflict'] == 'event_id,reminder_type'

if __name__ == '__main__':
    pytest.main([__file__])