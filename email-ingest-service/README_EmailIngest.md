# Gmail Email Ingest Service

A Python 3.12 Cloud Run Function that receives Gmail Pub/Sub push notifications and stores raw emails in the `inbound_emails` table.

## Overview

This service handles Gmail push notifications via Google Cloud Pub/Sub, fetches the full email content using the Gmail API, and stores it in a Supabase database for further processing.

## Architecture

```
Gmail → Pub/Sub → Cloud Run Function → Gmail API → Supabase Database
```

## Features

- **JWT Verification**: Validates Google-signed JWT tokens from Pub/Sub
- **Gmail API Integration**: Fetches full email content in raw MIME format
- **Idempotent Processing**: Prevents duplicate email storage using `gmail_history` field
- **Error Handling**: Proper HTTP status codes without stack trace leakage
- **Health Checks**: Built-in health check endpoint for monitoring

## Environment Variables

Set these environment variables in your Cloud Run deployment:

```bash
# Database Configuration
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Cloud Configuration
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[your-private-key]\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-google-cloud-project-id

# Gmail Configuration
GMAIL_WATCH_LABEL=school-events

# Optional: For testing RLS policies
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

## Database Schema

The service expects an existing `inbound_emails` table with this structure:

```sql
CREATE TABLE inbound_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    raw_body TEXT NOT NULL,
    headers JSONB,
    gmail_history TEXT UNIQUE,
    arrived_at TIMESTAMPTZ DEFAULT now()
);
```

## GCP Setup

### 1. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create gmail-ingest-service \
    --display-name="Gmail Ingest Service"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:gmail-ingest-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/gmail.readonly"

# Create and download key
gcloud iam service-accounts keys create gmail-service-key.json \
    --iam-account=gmail-ingest-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 2. Set up Gmail Push Notifications

```bash
# Create Pub/Sub topic
gcloud pubsub topics create gmail-notifications

# Create subscription
gcloud pubsub subscriptions create gmail-notifications-sub \
    --topic=gmail-notifications

# Set up Gmail watch (requires domain-wide delegation)
# This is typically done through the Gmail API in your application
```

### 3. Enable Required APIs

```bash
gcloud services enable gmail.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable run.googleapis.com
```

## Local Development

### Prerequisites

- Python 3.12
- Docker (optional)
- Google Cloud SDK

### Setup

1. **Clone and install dependencies:**
```bash
cd email-ingest-service
pip install -r requirements.txt
```

2. **Set environment variables:**
```bash
export SUPABASE_DB_URL="postgresql://..."
export SUPABASE_SERVICE_ROLE_KEY="your_key"
export GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
export GOOGLE_PROJECT_ID="your-project-id"
export GMAIL_WATCH_LABEL="school-events"
```

3. **Run locally:**
```bash
python main.py
```

The service will start on `http://localhost:8080`

### Testing

Run the test suite:

```bash
# Install test dependencies
pip install pytest pytest-mock

# Run tests
pytest tests/email_ingest_test.py -v

# Run with coverage
pytest tests/email_ingest_test.py --cov=main --cov-report=html
```

## Deployment

### Build and Deploy to Cloud Run

1. **Build Docker image:**
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/gmail-ingest .
docker push gcr.io/YOUR_PROJECT_ID/gmail-ingest
```

2. **Deploy to Cloud Run:**
```bash
gcloud run deploy gmail-ingest-service \
    --image gcr.io/YOUR_PROJECT_ID/gmail-ingest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="SUPABASE_DB_URL=postgresql://...,SUPABASE_SERVICE_ROLE_KEY=...,GOOGLE_CLIENT_EMAIL=...,GOOGLE_PRIVATE_KEY=...,GOOGLE_PROJECT_ID=...,GMAIL_WATCH_LABEL=school-events" \
    --memory 512Mi \
    --cpu 1 \
    --concurrency 100 \
    --timeout 60s
```

3. **Configure Pub/Sub to push to Cloud Run:**
```bash
# Get the Cloud Run service URL
SERVICE_URL=$(gcloud run services describe gmail-ingest-service \
    --region us-central1 --format 'value(status.url)')

# Update the subscription to push to Cloud Run
gcloud pubsub subscriptions modify gmail-notifications-sub \
    --push-endpoint="${SERVICE_URL}/handle_pubsub"
```

## Testing the Deployment

### 1. Health Check

```bash
curl -X GET https://your-service-url/health
```

Expected response:
```json
{
  "status": "healthy"
}
```

### 2. Test Pub/Sub Message Processing

Create a test message:

```bash
# Create test message data
echo '{"historyId":"12345","emailAddress":"test@yourdomain.com"}' | base64

# Publish test message
gcloud pubsub topics publish gmail-notifications \
    --message='eyJoaXN0b3J5SWQiOiIxMjM0NSIsImVtYWlsQWRkcmVzcyI6InRlc3RAeW91cmRvbWFpbi5jb20ifQ=='
```

### 3. Verify Database Storage

Check that the email was stored:

```sql
SELECT id, user_id, gmail_history, arrived_at 
FROM inbound_emails 
ORDER BY arrived_at DESC 
LIMIT 1;
```

## Performance Characteristics

- **Cold Start**: ≤ 500ms in us-central1 region
- **Memory Usage**: ~100MB at runtime
- **Docker Image Size**: ≤ 120MB
- **Concurrent Requests**: Up to 100 per instance

## Error Handling

The service returns appropriate HTTP status codes:

- `204 No Content`: Successful processing
- `400 Bad Request`: Invalid JWT or malformed request
- `500 Internal Server Error`: Unexpected errors (without stack traces)

## Monitoring

### Logs

View logs in Cloud Console:
```bash
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=gmail-ingest-service" --limit 50
```

### Metrics

Key metrics to monitor:
- Request count and latency
- Error rate (4xx/5xx responses)
- Memory and CPU usage
- Cold start frequency

## Security Considerations

- Service account has minimal required permissions
- JWT verification prevents unauthorized requests
- No sensitive data in logs or error responses
- Database credentials stored as environment variables
- RLS policies should be configured on the `inbound_emails` table

## Troubleshooting

### Common Issues

1. **JWT Verification Fails**
   - Check that `GOOGLE_PROJECT_ID` matches the JWT audience
   - Verify the JWT is properly formatted

2. **Gmail API Errors**
   - Ensure service account has Gmail API access
   - Check that domain-wide delegation is configured

3. **Database Connection Issues**
   - Verify `SUPABASE_DB_URL` format and credentials
   - Check network connectivity from Cloud Run

4. **Duplicate Processing**
   - The service is idempotent by design using `gmail_history`
   - Duplicate `historyId` values will not create new records

### Debug Mode

For local debugging, set the Flask debug mode:

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
```

## API Reference

### POST /handle_pubsub

Handles Gmail Pub/Sub push notifications.

**Request Body:**
```json
{
  "message": {
    "data": "base64-encoded-json",
    "attributes": {
      "jwt": "google-signed-jwt-token"
    }
  }
}
```

**Responses:**
- `204`: Success
- `400`: Bad request (invalid JWT, missing fields)
- `500`: Internal server error

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## License

This service is part of the Parent Pal application and follows the same licensing terms.