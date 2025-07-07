# Cron Job Setup for JAOTHUI Farm Management

This document explains how to set up automated cron jobs for the farm management system.

## Required Cron Jobs

### 1. Recurring Schedule Processing
**Purpose**: Generate new recurring schedule instances
**Frequency**: Every day at 6:00 AM
**Endpoint**: `/api/schedule/process-recurring`

```bash
# Add to crontab (crontab -e)
0 6 * * * curl -X POST "https://your-domain.com/api/schedule/process-recurring" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### 2. Notification Triggers (Optional)
**Purpose**: Send activity reminders and overdue notifications
**Frequency**: Every 30 minutes during work hours (7 AM - 7 PM)
**Endpoint**: `/api/notifications/triggers`

```bash
# Add to crontab (crontab -e)
*/30 7-19 * * * curl -X POST "https://your-domain.com/api/notifications/triggers" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### 3. Cleanup Expired Invitations
**Purpose**: Remove expired farm invitations
**Frequency**: Daily at 1:00 AM
**Endpoint**: `/api/invitations/cleanup`

```bash
# Add to crontab (crontab -e)
0 1 * * * curl -X POST "https://your-domain.com/api/invitations/cleanup" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

## Environment Variables

Make sure to set these environment variables:

```bash
# .env or .env.production
CRON_SECRET=your-secure-random-string-here
```

## Vercel Cron Jobs (Recommended)

If using Vercel, create a `vercel.json` file in the project root:

```json
{
  "crons": [
    {
      "path": "/api/schedule/process-recurring",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/notifications/triggers", 
      "schedule": "*/30 7-19 * * *"
    },
    {
      "path": "/api/invitations/cleanup",
      "schedule": "0 1 * * *"
    }
  ]
}
```

## Testing Cron Jobs

Test the endpoints manually:

```bash
# Test recurring schedule processing
curl -X POST "http://localhost:3000/api/schedule/process-recurring" \
  -H "Authorization: Bearer dev-secret-key" \
  -H "Content-Type: application/json"

# Test notification triggers
curl -X POST "http://localhost:3000/api/notifications/triggers" \
  -H "Authorization: Bearer dev-secret-key" \
  -H "Content-Type: application/json"

# Test invitation cleanup
curl -X POST "http://localhost:3000/api/invitations/cleanup" \
  -H "Authorization: Bearer dev-secret-key" \
  -H "Content-Type: application/json"
```

## Security Notes

1. Always use a strong, random CRON_SECRET
2. Only allow cron job access from trusted IPs if possible
3. Monitor cron job logs for any errors
4. Set up alerts for failed cron jobs

## Monitoring

The cron endpoints return JSON responses with success/error information:

```json
{
  "success": true,
  "message": "Recurring schedules processed successfully",
  "stats": {
    "processedSchedules": 5,
    "createdSchedules": 3,
    "totalRecurringSchedules": 5
  }
}
```

Log these responses for monitoring and debugging.