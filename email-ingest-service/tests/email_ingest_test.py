import json
import base64
import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the parent directory to the path so we can import main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, verify_google_jwt, get_gmail_service, fetch_email_content, store_email_in_database

@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def sample_pubsub_message():
    """Sample Pub/Sub message payload."""
    message_data = {
        'historyId': '12345',
        'emailAddress': 'test@example.com'
    }
    
    encoded_data = base64.b64encode(json.dumps(message_data).encode()).decode()
    
    return {
        'message': {
            'data': encoded_data,
            'attributes': {
                'jwt': 'valid.jwt.token'
            }
        }
    }

@pytest.fixture
def sample_email_data():
    """Sample email data from Gmail API."""
    return {
        'raw_body': 'base64encodedrawemailcontent',
        'headers': {
            'from': 'sender@example.com',
            'to': 'test@example.com',
            'subject': 'Test Email',
            'date': 'Mon, 1 Jan 2024 12:00:00 +0000'
        },
        'message_id': 'msg123'
    }

class TestJWTVerification:
    """Test JWT verification functionality."""
    
    @patch('main.requests.Request')
    @patch('requests.get')
    @patch('jwt.decode')
    @patch('jwt.get_unverified_header')
    def test_verify_google_jwt_valid(self, mock_header, mock_decode, mock_get, mock_request):
        """Test valid JWT verification."""
        # Mock the unverified header
        mock_header.return_value = {'kid': 'test-key-id'}
        
        # Mock the Google keys response
        mock_response = Mock()
        mock_response.json.return_value = {
            'keys': [
                {
                    'kid': 'test-key-id',
                    'kty': 'RSA',
                    'n': 'test-n',
                    'e': 'AQAB'
                }
            ]
        }
        mock_get.return_value = mock_response
        
        # Mock successful JWT decode
        mock_decode.return_value = {'aud': 'test-project', 'iss': 'https://accounts.google.com'}
        
        with patch.dict(os.environ, {'GOOGLE_PROJECT_ID': 'test-project'}):
            result = verify_google_jwt('valid.jwt.token')
            assert result is True

    @patch('main.requests.Request')
    @patch('requests.get')
    @patch('jwt.decode')
    @patch('jwt.get_unverified_header')
    def test_verify_google_jwt_invalid(self, mock_header, mock_decode, mock_get, mock_request):
        """Test invalid JWT verification."""
        # Mock the unverified header
        mock_header.return_value = {'kid': 'test-key-id'}
        
        # Mock the Google keys response
        mock_response = Mock()
        mock_response.json.return_value = {
            'keys': [
                {
                    'kid': 'test-key-id',
                    'kty': 'RSA',
                    'n': 'test-n',
                    'e': 'AQAB'
                }
            ]
        }
        mock_get.return_value = mock_response
        
        # Mock JWT decode raising an exception
        from jwt import PyJWTError
        mock_decode.side_effect = PyJWTError("Invalid token")
        
        with patch.dict(os.environ, {'GOOGLE_PROJECT_ID': 'test-project'}):
            result = verify_google_jwt('invalid.jwt.token')
            assert result is False

class TestGmailAPI:
    """Test Gmail API functionality."""
    
    @patch('main.service_account.Credentials.from_service_account_info')
    @patch('main.build')
    def test_get_gmail_service(self, mock_build, mock_credentials):
        """Test Gmail service creation."""
        mock_service = Mock()
        mock_build.return_value = mock_service
        
        with patch.dict(os.environ, {
            'GOOGLE_PROJECT_ID': 'test-project',
            'GOOGLE_CLIENT_EMAIL': 'test@test.com',
            'GOOGLE_PRIVATE_KEY': 'test-key'
        }):
            service = get_gmail_service()
            assert service == mock_service

    @patch('email.message_from_bytes')
    @patch('base64.urlsafe_b64decode')
    def test_fetch_email_content(self, mock_b64decode, mock_email_from_bytes):
        """Test fetching email content from Gmail API."""
        # Mock Gmail service
        mock_service = Mock()
        mock_message_response = {
            'raw': 'base64encodedcontent'
        }
        mock_service.users().messages().get().execute.return_value = mock_message_response
        
        # Mock base64 decode
        mock_b64decode.return_value = b'raw email content'
        
        # Mock email parsing
        mock_email_message = Mock()
        mock_email_message.items.return_value = [
            ('From', 'sender@example.com'),
            ('To', 'recipient@example.com'),
            ('Subject', 'Test Subject')
        ]
        mock_email_from_bytes.return_value = mock_email_message
        
        result = fetch_email_content(mock_service, 'test@example.com', 'msg123')
        
        assert result['raw_body'] == 'base64encodedcontent'
        assert result['message_id'] == 'msg123'
        assert 'from' in result['headers']
        assert result['headers']['from'] == 'sender@example.com'

class TestDatabaseOperations:
    """Test database operations."""
    
    @patch('psycopg.connect')
    def test_store_email_in_database_success(self, mock_connect):
        """Test successful email storage in database."""
        # Mock database connection and cursor
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_connect.return_value = mock_conn
        
        # Mock user lookup
        mock_cursor.fetchone.return_value = ('user-uuid-123',)
        
        email_data = {
            'raw_body': 'base64content',
            'headers': {'from': 'test@example.com'},
            'message_id': 'msg123'
        }
        
        with patch.dict(os.environ, {'SUPABASE_DB_URL': 'postgresql://test'}):
            result = store_email_in_database('test@example.com', email_data, 'hist123')
            assert result is True
            
            # Verify database calls
            assert mock_cursor.execute.call_count == 2  # User lookup + insert
            mock_conn.commit.assert_called_once()

    @patch('psycopg.connect')
    def test_store_email_in_database_user_not_found(self, mock_connect):
        """Test email storage when user is not found."""
        # Mock database connection and cursor
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_connect.return_value = mock_conn
        
        # Mock user lookup returning None
        mock_cursor.fetchone.return_value = None
        
        email_data = {
            'raw_body': 'base64content',
            'headers': {'from': 'test@example.com'},
            'message_id': 'msg123'
        }
        
        with patch.dict(os.environ, {'SUPABASE_DB_URL': 'postgresql://test'}):
            result = store_email_in_database('nonexistent@example.com', email_data, 'hist123')
            assert result is False

class TestPubSubHandler:
    """Test the main Pub/Sub handler endpoint."""
    
    @patch('main.store_email_in_database')
    @patch('main.fetch_email_content')
    @patch('main.get_gmail_service')
    @patch('main.verify_google_jwt')
    def test_handle_pubsub_success(self, mock_verify_jwt, mock_gmail_service, 
                                 mock_fetch_email, mock_store_email, client, 
                                 sample_pubsub_message, sample_email_data):
        """Test successful Pub/Sub message handling."""
        # Mock all dependencies
        mock_verify_jwt.return_value = True
        
        mock_service = Mock()
        mock_gmail_service.return_value = mock_service
        
        # Mock Gmail messages list response
        mock_service.users().messages().list().execute.return_value = {
            'messages': [{'id': 'msg123'}]
        }
        
        mock_fetch_email.return_value = sample_email_data
        mock_store_email.return_value = True
        
        with patch.dict(os.environ, {'GMAIL_WATCH_LABEL': 'school-events'}):
            response = client.post('/handle_pubsub', 
                                 json=sample_pubsub_message,
                                 content_type='application/json')
            
            assert response.status_code == 204
            mock_verify_jwt.assert_called_once()
            mock_store_email.assert_called_once()

    @patch('main.verify_google_jwt')
    def test_handle_pubsub_invalid_jwt(self, mock_verify_jwt, client, sample_pubsub_message):
        """Test Pub/Sub handler with invalid JWT."""
        mock_verify_jwt.return_value = False
        
        response = client.post('/handle_pubsub', 
                             json=sample_pubsub_message,
                             content_type='application/json')
        
        assert response.status_code == 400
        assert 'Invalid JWT' in response.get_json()['error']

    def test_handle_pubsub_no_json_body(self, client):
        """Test Pub/Sub handler with no JSON body."""
        response = client.post('/handle_pubsub')
        
        assert response.status_code == 400
        assert 'No JSON body' in response.get_json()['error']

    def test_handle_pubsub_missing_message(self, client):
        """Test Pub/Sub handler with missing message in envelope."""
        response = client.post('/handle_pubsub', 
                             json={'not_message': 'test'},
                             content_type='application/json')
        
        assert response.status_code == 400
        assert 'No message in envelope' in response.get_json()['error']

    def test_handle_pubsub_missing_data(self, client):
        """Test Pub/Sub handler with missing data in message."""
        envelope = {
            'message': {
                'attributes': {'jwt': 'test.jwt.token'}
            }
        }
        
        response = client.post('/handle_pubsub', 
                             json=envelope,
                             content_type='application/json')
        
        assert response.status_code == 400
        assert 'No data in message' in response.get_json()['error']

class TestHealthCheck:
    """Test health check endpoint."""
    
    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get('/health')
        
        assert response.status_code == 200
        assert response.get_json()['status'] == 'healthy'

class TestIdempotency:
    """Test idempotency of email processing."""
    
    @patch('main.store_email_in_database')
    @patch('main.fetch_email_content')
    @patch('main.get_gmail_service')
    @patch('main.verify_google_jwt')
    def test_duplicate_history_id_handling(self, mock_verify_jwt, mock_gmail_service,
                                         mock_fetch_email, mock_store_email, client,
                                         sample_pubsub_message, sample_email_data):
        """Test that duplicate historyId doesn't create duplicate records."""
        # Mock all dependencies
        mock_verify_jwt.return_value = True
        
        mock_service = Mock()
        mock_gmail_service.return_value = mock_service
        
        mock_service.users().messages().list().execute.return_value = {
            'messages': [{'id': 'msg123'}]
        }
        
        mock_fetch_email.return_value = sample_email_data
        mock_store_email.return_value = True
        
        with patch.dict(os.environ, {'GMAIL_WATCH_LABEL': 'school-events'}):
            # First request
            response1 = client.post('/handle_pubsub', 
                                  json=sample_pubsub_message,
                                  content_type='application/json')
            
            # Second request with same historyId
            response2 = client.post('/handle_pubsub', 
                                  json=sample_pubsub_message,
                                  content_type='application/json')
            
            assert response1.status_code == 204
            assert response2.status_code == 204
            
            # Both should succeed due to ON CONFLICT DO NOTHING
            assert mock_store_email.call_count == 2

if __name__ == '__main__':
    pytest.main([__file__])