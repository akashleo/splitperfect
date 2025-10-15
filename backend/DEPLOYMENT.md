# SplitPerfect Backend - Deployment Guide

This document provides comprehensive instructions for deploying the SplitPerfect FastAPI backend to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Options](#deployment-options)
4. [Database Setup](#database-setup)
5. [Security Checklist](#security-checklist)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

- **PostgreSQL Database** (v12 or higher)
- **AWS S3 Bucket** (for bill image storage)
- **OpenAI API Key** (for LLM-based bill parsing)
- **Google OAuth Credentials** (for authentication)
- **Domain/Subdomain** (for production deployment)
- **SSL Certificate** (recommended: Let's Encrypt)

### System Requirements

- Python 3.11+
- Tesseract OCR
- 512MB RAM minimum (1GB+ recommended)
- 10GB disk space

---

## Environment Configuration

### 1. Create Production Environment File

Copy `.env.example` to `.env` and configure all variables:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

#### Database Configuration
```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

**Production Example (Managed PostgreSQL):**
```env
DATABASE_URL=postgresql://user:pass@db.example.com:5432/splitperfect_prod
```

#### JWT Configuration
```env
SECRET_KEY=<generate-strong-random-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
```

**Generate a secure secret key:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Google OAuth
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback
```

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

#### AWS S3 Configuration
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=splitperfect-bills-prod
```

**S3 Bucket Setup:**
1. Create bucket in AWS Console
2. Enable versioning (recommended)
3. Configure CORS policy:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```
4. Set appropriate bucket policy for private access

#### OpenAI Configuration
```env
OPENAI_API_KEY=sk-your-api-key
```

#### Application URLs
```env
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
ENVIRONMENT=production
```

#### Optional: Google Cloud Vision
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

---

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Build Docker Image

```bash
cd backend
docker build -t splitperfect-backend:latest .
```

#### Run Container

```bash
docker run -d \
  --name splitperfect-api \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  splitperfect-backend:latest
```

#### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: splitperfect-api
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - db
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:15-alpine
    container_name: splitperfect-db
    environment:
      POSTGRES_DB: splitperfect
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy:**
```bash
docker-compose up -d
```

---

### Option 2: Cloud Platform Deployment

#### AWS Elastic Beanstalk

1. **Install EB CLI:**
```bash
pip install awsebcli
```

2. **Initialize EB:**
```bash
eb init -p python-3.11 splitperfect-backend
```

3. **Create environment:**
```bash
eb create splitperfect-prod --database.engine postgres
```

4. **Set environment variables:**
```bash
eb setenv SECRET_KEY=xxx OPENAI_API_KEY=xxx ...
```

5. **Deploy:**
```bash
eb deploy
```

#### Google Cloud Run

1. **Build and push image:**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/splitperfect-backend
```

2. **Deploy:**
```bash
gcloud run deploy splitperfect-api \
  --image gcr.io/PROJECT_ID/splitperfect-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=xxx,SECRET_KEY=xxx
```

#### Heroku

1. **Create app:**
```bash
heroku create splitperfect-api
```

2. **Add PostgreSQL:**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

3. **Set environment variables:**
```bash
heroku config:set SECRET_KEY=xxx OPENAI_API_KEY=xxx
```

4. **Deploy:**
```bash
git push heroku main
```

#### DigitalOcean App Platform

1. Create new app from GitHub repository
2. Select Python environment
3. Set build command: `pip install -r requirements.txt`
4. Set run command: `uvicorn main:app --host 0.0.0.0 --port 8000`
5. Add environment variables in dashboard
6. Deploy

---

### Option 3: VPS Deployment (Ubuntu/Debian)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.11 python3.11-venv python3-pip \
  postgresql postgresql-contrib nginx tesseract-ocr \
  tesseract-ocr-eng supervisor

# Create application user
sudo useradd -m -s /bin/bash splitperfect
```

#### 2. Application Setup

```bash
# Switch to app user
sudo su - splitperfect

# Clone repository
git clone https://github.com/yourusername/splitperfect.git
cd splitperfect/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Edit with production values
```

#### 3. Database Setup

```bash
# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE splitperfect_prod;
CREATE USER splitperfect_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE splitperfect_prod TO splitperfect_user;
\q
```

#### 4. Run Migrations

```bash
cd /home/splitperfect/splitperfect/backend
source venv/bin/activate
alembic upgrade head
```

#### 5. Configure Supervisor

Create `/etc/supervisor/conf.d/splitperfect.conf`:

```ini
[program:splitperfect]
directory=/home/splitperfect/splitperfect/backend
command=/home/splitperfect/splitperfect/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
user=splitperfect
autostart=true
autorestart=true
stderr_logfile=/var/log/splitperfect/err.log
stdout_logfile=/var/log/splitperfect/out.log
environment=PATH="/home/splitperfect/splitperfect/backend/venv/bin"
```

```bash
# Create log directory
sudo mkdir -p /var/log/splitperfect
sudo chown splitperfect:splitperfect /var/log/splitperfect

# Reload supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start splitperfect
```

#### 6. Configure Nginx

Create `/etc/nginx/sites-available/splitperfect`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase upload size for bill images
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/splitperfect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. Setup SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
```

---

## Database Setup

### Initial Migration

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations
alembic upgrade head
```

### Backup Strategy

#### Automated Daily Backups

Create `/usr/local/bin/backup-splitperfect-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/splitperfect"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="splitperfect_prod"
DB_USER="splitperfect_user"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/db-backups/
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-splitperfect-db.sh

# Add to crontab
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-splitperfect-db.sh
```

### Database Restore

```bash
# Restore from backup
gunzip -c backup_20240115_020000.sql.gz | psql -U splitperfect_user splitperfect_prod
```

---

## Security Checklist

### Pre-Deployment Security

- [ ] Generate strong `SECRET_KEY` (32+ characters)
- [ ] Use environment variables for all secrets (never commit to git)
- [ ] Enable HTTPS/SSL for all endpoints
- [ ] Configure CORS to allow only trusted domains
- [ ] Set `ENVIRONMENT=production` in `.env`
- [ ] Disable debug mode and auto-reload
- [ ] Use strong database passwords
- [ ] Restrict database access to application IP only
- [ ] Enable AWS S3 bucket encryption
- [ ] Configure S3 bucket policy for private access
- [ ] Set up API rate limiting
- [ ] Enable database connection pooling
- [ ] Configure firewall rules (UFW/Security Groups)

### Firewall Configuration (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Application Security Headers

Add to Nginx configuration:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### Rate Limiting

Install and configure in `main.py`:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/endpoint")
@limiter.limit("10/minute")
async def endpoint():
    pass
```

---

## Monitoring & Logging

### Application Logging

Configure structured logging in `main.py`:

```python
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('logs/app.log', maxBytes=10485760, backupCount=5),
        logging.StreamHandler()
    ]
)
```

### Health Check Endpoints

The application includes:
- `GET /` - Basic health check
- `GET /health` - Detailed health status

### Monitoring Tools

#### Option 1: Prometheus + Grafana

Install `prometheus-fastapi-instrumentator`:

```bash
pip install prometheus-fastapi-instrumentator
```

Add to `main.py`:

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

#### Option 2: Sentry Error Tracking

```bash
pip install sentry-sdk[fastapi]
```

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment="production",
    traces_sample_rate=1.0,
)
```

#### Option 3: Cloud Provider Monitoring

- **AWS CloudWatch** - Automatic with Elastic Beanstalk
- **Google Cloud Monitoring** - Automatic with Cloud Run
- **Heroku Metrics** - Available in dashboard

### Log Aggregation

Consider using:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Datadog**
- **Papertrail**
- **Loggly**

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Symptom:** `sqlalchemy.exc.OperationalError: could not connect to server`

**Solutions:**
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
- Check database server is running: `sudo systemctl status postgresql`
- Verify network connectivity: `telnet db-host 5432`
- Check firewall rules allow database port
- Verify database credentials

#### 2. Migration Failures

**Symptom:** `alembic.util.exc.CommandError`

**Solutions:**
```bash
# Check current migration version
alembic current

# View migration history
alembic history

# Downgrade if needed
alembic downgrade -1

# Re-run upgrade
alembic upgrade head
```

#### 3. OCR Not Working

**Symptom:** `TesseractNotFoundError`

**Solutions:**
```bash
# Install Tesseract
sudo apt install tesseract-ocr tesseract-ocr-eng

# Verify installation
tesseract --version

# Check path in code
which tesseract
```

#### 4. S3 Upload Failures

**Symptom:** `botocore.exceptions.ClientError`

**Solutions:**
- Verify AWS credentials are correct
- Check S3 bucket exists and region matches
- Verify IAM permissions for S3 operations
- Check bucket CORS configuration

#### 5. High Memory Usage

**Solutions:**
- Reduce number of Uvicorn workers
- Enable database connection pooling
- Implement caching (Redis)
- Monitor with `htop` or cloud metrics

#### 6. SSL Certificate Issues

**Solutions:**
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run
```

### Performance Optimization

#### 1. Enable Database Connection Pooling

In `database.py`:

```python
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

#### 2. Add Caching Layer

```bash
pip install redis
```

```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis), prefix="splitperfect-cache")
```

#### 3. Optimize Uvicorn Workers

```bash
# Calculate optimal workers: (2 x CPU cores) + 1
uvicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Logs Location

- **Supervisor logs:** `/var/log/splitperfect/`
- **Nginx logs:** `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- **Application logs:** `./logs/app.log`
- **System logs:** `journalctl -u splitperfect`

### Getting Help

- Check application logs first
- Review Nginx error logs
- Test API endpoints with curl or Postman
- Verify all environment variables are set
- Check database connectivity
- Review cloud provider logs/metrics

---

## Post-Deployment Checklist

- [ ] Verify all API endpoints are accessible
- [ ] Test authentication flow (Google OAuth)
- [ ] Upload test bill image and verify OCR/LLM processing
- [ ] Check database migrations applied successfully
- [ ] Verify S3 bucket integration working
- [ ] Test CORS configuration with frontend
- [ ] Monitor application logs for errors
- [ ] Set up automated backups
- [ ] Configure monitoring/alerting
- [ ] Document production URLs and credentials (securely)
- [ ] Set up SSL certificate auto-renewal
- [ ] Test health check endpoints
- [ ] Verify rate limiting is working
- [ ] Load test critical endpoints

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check application health

**Weekly:**
- Review performance metrics
- Check disk space usage
- Verify backups are running

**Monthly:**
- Update dependencies (security patches)
- Review and rotate logs
- Test backup restoration
- Review access logs for anomalies

### Updating the Application

```bash
# Pull latest code
cd /home/splitperfect/splitperfect/backend
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Update dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Restart application
sudo supervisorctl restart splitperfect
```

---

## Support & Resources

- **API Documentation:** `https://api.yourdomain.com/docs`
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **AWS S3 Docs:** https://docs.aws.amazon.com/s3/
- **OpenAI API Docs:** https://platform.openai.com/docs/

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0
