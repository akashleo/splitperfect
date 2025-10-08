# SplitPerfect Quick Start

Get SplitPerfect running in 5 minutes!

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL running locally

## 1. Clone & Setup (2 minutes)

```bash
cd splitperfect

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Frontend setup (in new terminal)
cd frontend
npm install
cp .env.example .env
```

## 2. Configure (1 minute)

### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth Client ID (Web application)
4. Add `http://localhost:3000` to authorized origins
5. Copy Client ID

### Update .env Files

**backend/.env:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/splitperfect
SECRET_KEY=change-this-to-random-string
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
OPENAI_API_KEY=sk-your-key  # Get from openai.com
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## 3. Database (30 seconds)

```bash
# Create database
createdb splitperfect

# Run migrations
cd backend
alembic upgrade head
```

## 4. Run (30 seconds)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 5. Open & Test (30 seconds)

1. Open http://localhost:3000
2. Click "Sign in with Google"
3. Create a room
4. Upload a bill (or use mock data)
5. Done! 🎉

## Troubleshooting

**Database error?**
```bash
# Check PostgreSQL is running
# Mac: brew services start postgresql
# Windows: Check Services app
```

**Module not found?**
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

**Google login fails?**
- Verify Client ID matches in both .env files
- Check authorized origins in Google Console

## Next Steps

- Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup
- Check [README.md](README.md) for features
- See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details

## Development Workflow

```bash
# Start both servers
npm run dev          # Frontend (terminal 1)
uvicorn main:app --reload  # Backend (terminal 2)

# Make changes → See hot reload
# API docs: http://localhost:8000/docs
```

Happy coding! 🚀
