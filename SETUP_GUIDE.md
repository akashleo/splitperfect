# SplitPerfect Setup Guide

Complete step-by-step guide to get SplitPerfect running locally.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] PostgreSQL 14+ installed
- [ ] Git installed
- [ ] Google Cloud account
- [ ] OpenAI account
- [ ] AWS account (optional, for production)

## Part 1: Google OAuth Setup

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "SplitPerfect" → Create
4. Wait for project creation

### 1.2 Enable Google+ API

1. In the project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click and enable it

### 1.3 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External
   - App name: SplitPerfect
   - User support email: your email
   - Developer contact: your email
   - Save and continue through all steps
4. Back to Create OAuth client ID:
   - Application type: Web application
   - Name: SplitPerfect Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5173`
   - Authorized redirect URIs:
     - `http://localhost:3000`
     - `http://localhost:3000/auth/callback`
5. Click Create
6. **Copy Client ID and Client Secret** - you'll need these!

## Part 2: OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Click "Create new secret key"
5. Name it "SplitPerfect"
6. **Copy the API key** - you won't see it again!

## Part 3: Database Setup

### 3.1 Install PostgreSQL

**Windows:**
- Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- Run installer, remember the password you set

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 3.2 Create Database

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE splitperfect;

# Create user (optional)
CREATE USER splitperfect_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE splitperfect TO splitperfect_user;

# Exit
\q
```

## Part 4: Backend Setup

### 4.1 Navigate to Backend

```bash
cd backend
```

### 4.2 Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 4.3 Install Dependencies

```bash
pip install -r requirements.txt
```

### 4.4 Configure Environment

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` file with your credentials:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/splitperfect

# JWT Secret - Generate a random string
SECRET_KEY=your-super-secret-key-change-this-to-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Google OAuth - Paste from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# AWS S3 - Leave blank for now, we'll use local storage for testing
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
S3_BUCKET_NAME=splitperfect-bills

# OpenAI - Paste your API key
OPENAI_API_KEY=sk-your-openai-api-key

# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Environment
ENVIRONMENT=development
```

### 4.5 Initialize Database

```bash
# Run migrations
alembic upgrade head
```

### 4.6 Start Backend Server

```bash
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Test it: Open `http://localhost:8000/docs` in your browser

## Part 5: Frontend Setup

### 5.1 Open New Terminal

Keep backend running, open a new terminal window.

### 5.2 Navigate to Frontend

```bash
cd frontend
```

### 5.3 Install Dependencies

```bash
npm install
```

This will take a few minutes...

### 5.4 Configure Environment

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` file:

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Important:** Use the same Google Client ID from Part 1!

### 5.5 Start Frontend Server

```bash
npm run dev
```

You should see:
```
  VITE v5.0.11  ready in 500 ms

  ➜  Local:   http://localhost:3000/
```

## Part 6: Test the Application

1. Open `http://localhost:3000` in your browser
2. You should see the SplitPerfect login page
3. Click "Sign in with Google"
4. Complete Google authentication
5. You should be redirected to the home page!

## Part 7: Test Core Features

### 7.1 Create a Room

1. Click "Create Room"
2. Enter a name like "Test Room"
3. Click Create
4. Copy the secret code

### 7.2 Join Room (Optional - Test with Another Browser)

1. Open incognito/private window
2. Login with different Google account
3. Click "Join Room"
4. Paste the secret code
5. You should join the room!

### 7.3 Upload a Bill

For testing without real OCR/LLM (to save API costs):

**Option A: Mock the AI services** (Recommended for testing)

Edit `backend/routes/bills.py` and temporarily add a mock response:

```python
# In the parse_bill endpoint, replace the OCR/LLM calls with:
return ParsedBillResponse(
    items=[
        ParsedBillItem(
            description="Test Item 1",
            quantity=2,
            unit_price=10.00,
            total=20.00
        ),
        ParsedBillItem(
            description="Test Item 2",
            quantity=1,
            unit_price=15.50,
            total=15.50
        )
    ],
    total_amount=35.50,
    merchant_name="Test Store",
    date="2024-01-15"
)
```

**Option B: Use real AI** (Costs API credits)

1. Upload any receipt image
2. Wait for AI to parse it
3. Review and edit items
4. Save the bill

## Troubleshooting

### Backend won't start

**Error: `ModuleNotFoundError`**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Error: `Connection refused` (Database)**
```bash
# Check PostgreSQL is running
# Windows: Check Services
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Verify DATABASE_URL in .env is correct
```

**Error: `ImportError: google.auth`**
```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2
```

### Frontend won't start

**Error: `Cannot find module`**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: Port 3000 already in use**
```bash
# Kill the process or use different port
# Edit vite.config.ts and change port to 3001
```

### Google Login not working

1. Verify `GOOGLE_CLIENT_ID` matches in both `.env` files
2. Check authorized origins in Google Cloud Console
3. Clear browser cache and cookies
4. Try incognito mode

### Database migration errors

```bash
# Reset database
alembic downgrade base
alembic upgrade head

# Or recreate database
dropdb splitperfect
createdb splitperfect
alembic upgrade head
```

## Next Steps

### For Development

1. Read the API docs at `http://localhost:8000/docs`
2. Explore the code structure
3. Make changes and see hot reload in action
4. Add new features!

### For Production Deployment

See the main README.md for deployment instructions to:
- Vercel (Frontend)
- Render/Fly.io (Backend)
- Neon/Supabase (Database)

## Quick Reference

### Start Development

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Stop Servers

- Press `Ctrl+C` in each terminal

### Database Commands

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1

# Reset database
alembic downgrade base
alembic upgrade head
```

## Support

If you encounter issues:
1. Check this guide carefully
2. Review error messages
3. Check the main README.md
4. Open a GitHub issue with:
   - Error message
   - Steps to reproduce
   - Your OS and versions

Happy coding! 🚀
