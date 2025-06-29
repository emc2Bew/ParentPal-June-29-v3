import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional

import psycopg
from google.auth.transport import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build
from flask import Flask, request, jsonify
import jwt
from jwt import PyJWTError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Environment variables
SUPABASE_DB_URL = os.environ.get('SUPABASE_DB_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
GOOGLE_CLIENT_EMAIL = os.environ.get('GOOGLE_CLIENT_EMAIL')
GOOGLE_PRIVATE_KEY = os.environ.get('GOOGLE_PRIVATE_KEY', '').replace('\\n', '\n')
GOOGLE_PROJECT_ID = os.environ.get('GOOGLE_PROJECT_ID')
GMAIL_WATCH_LABEL = os.environ.get('GMAIL_WATCH_LABEL', 'school-events')
SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET')

def verify_google_jwt(token: str) -> bool:
    """Verify Google-signed JWT from Pub/Sub push notification."""
    try:
        # Google's public keys endpoint
        req = requests.Request()
        
        # Decode without verification first to get the header
        unverified_header = jwt.get_unverified_header(token)
        
        # Get Google's public keys
        import requests as http_requests
        response = http_requests.get('https://www.googleapis.com/oauth2/v3/certs')
        keys = response.json()
        
        # Find the key that matches the token's kid
        key = None
        for k in keys['keys']:
            if k['kid'] == unverified_header['kid']:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(k)
                break
        
        if not key:
            logger.error("Unable to find appropriate key")
            return False
        
        # Verify the token
        payload = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=GOOGLE_PROJECT_ID,
            issuer='https://accounts.google.com'
        )
        
        return True
        
    except PyJWTError as e:
        logger.error(f"JWT verification failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during JWT verification: {e}")
        return False

def get_gmail_service():
    """Create Gmail API service using service account credentials."""
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
            scopes=['https://www.googleapis.com/auth/gmail.readonly']
        )
        
        service = build('gmail', 'v1', credentials=credentials)
        return service
        
    except Exception as e:
        logger.error(f"Failed to create Gmail service: {e}")
        raise

def fetch_email_content(service, user_email: str, message_id: str) -> Dict[str, Any]:
    """Fetch full email content using Gmail API."""
    try:
        # Get the message in raw format
        message = service.users().messages().get(
            userId=user_email,
            id=message_id,
            format='raw'
        ).execute()
        
        # Extract headers from the raw message
        import base64
        import email
        
        raw_data = base64.urlsafe_b64decode(message['raw'])
        email_message = email.message_from_bytes(raw_data)
        
        # Extract headers
        headers = {}
        for key, value in email_message.items():
            headers[key.lower()] = value
        
        return {
            'raw_body': message['raw'],
            'headers': headers,
            'message_id': message_id
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch email content: {e}")
        raise

def store_email_in_database(user_email: str, email_data: Dict[str, Any], history_id: str) -> bool:
    """Store email data in the inbound_emails table."""
    try:
        with psycopg.connect(SUPABASE_DB_URL) as conn:
            with conn.cursor() as cur:
                # Find user_id based on email address
                cur.execute(
                    "SELECT id FROM auth.users WHERE email = %s",
                    (user_email,)
                )
                user_result = cur.fetchone()
                
                if not user_result:
                    logger.error(f"User not found for email: {user_email}")
                    return False
                
                user_id = user_result[0]
                
                # Insert email data with conflict handling for idempotency
                cur.execute("""
                    INSERT INTO inbound_emails(
                        id, user_id, raw_body, headers, gmail_history, arrived_at
                    )
                    VALUES(gen_random_uuid(), %s, %s, %s, %s, now())
                    ON CONFLICT (gmail_history) DO NOTHING
                """, (
                    user_id,
                    email_data['raw_body'],
                    json.dumps(email_data['headers']),
                    history_id
                ))
                
                conn.commit()
                logger.info(f"Email stored successfully for user {user_email}, history_id: {history_id}")
                return True
                
    except Exception as e:
        logger.error(f"Database error: {e}")
        return False

@app.route('/handle_pubsub', methods=['POST'])
def handle_pubsub():
    """Handle Gmail Pub/Sub push notifications."""
    try:
        # Get the request data
        envelope = request.get_json()
        
        if not envelope:
            logger.error("No JSON body received")
            return jsonify({'error': 'No JSON body'}), 400
        
        # Extract the Pub/Sub message
        if 'message' not in envelope:
            logger.error("No message in envelope")
            return jsonify({'error': 'No message in envelope'}), 400
        
        pubsub_message = envelope['message']
        
        # Verify JWT if present
        if 'attributes' in pubsub_message and 'jwt' in pubsub_message['attributes']:
            jwt_token = pubsub_message['attributes']['jwt']
            if not verify_google_jwt(jwt_token):
                logger.error("JWT verification failed")
                return jsonify({'error': 'Invalid JWT'}), 400
        
        # Decode the message data
        if 'data' not in pubsub_message:
            logger.error("No data in pubsub message")
            return jsonify({'error': 'No data in message'}), 400
        
        import base64
        message_data = json.loads(base64.b64decode(pubsub_message['data']).decode('utf-8'))
        
        # Extract required fields
        history_id = message_data.get('historyId')
        email_address = message_data.get('emailAddress')
        
        if not history_id or not email_address:
            logger.error(f"Missing required fields: historyId={history_id}, emailAddress={email_address}")
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get Gmail service
        gmail_service = get_gmail_service()
        
        # Get the latest message for this user
        # Note: In a real implementation, you'd use the history API to get specific messages
        # For this example, we'll get the most recent message
        try:
            messages = gmail_service.users().messages().list(
                userId=email_address,
                labelIds=[GMAIL_WATCH_LABEL],
                maxResults=1
            ).execute()
            
            if not messages.get('messages'):
                logger.info("No messages found")
                return '', 204
            
            message_id = messages['messages'][0]['id']
            
            # Fetch email content
            email_data = fetch_email_content(gmail_service, email_address, message_id)
            
            # Store in database
            if store_email_in_database(email_address, email_data, history_id):
                logger.info("Email processed successfully")
                return '', 204
            else:
                logger.error("Failed to store email in database")
                return jsonify({'error': 'Database error'}), 500
                
        except Exception as e:
            logger.error(f"Gmail API error: {e}")
            return jsonify({'error': 'Gmail API error'}), 500
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    # For local development
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)), debug=False)