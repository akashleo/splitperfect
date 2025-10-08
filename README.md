# SplitPerfect 🧾

AI-powered expense sharing and bill splitting web application. Upload receipts, parse them with AI, and automatically split costs among group members.

## 🌟 Features

- **Google OAuth Authentication** - Secure login with Google
- **Room Management** - Create and join expense groups with secret codes
- **AI Bill Parsing** - Upload receipt images and extract items automatically using OCR + LLM
- **Smart Expense Splitting** - Assign items to specific members with flexible sharing
- **Debt Simplification** - Minimize transactions needed to settle up
- **Visual Reports** - Charts and graphs showing expense distribution
- **PDF Export** - Download settlement reports
- **Mobile-First PWA** - Responsive design with offline support

## 🏗️ Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Fast build tool
- **Tailwind CSS** + **ShadCN UI** - Modern styling
- **Zustand** - State management
- **React Query** - Data fetching & caching
- **React Router** - Navigation
- **Recharts** - Data visualization
- **PWA** - Progressive Web App support

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **JWT** - Authentication
- **AWS S3** - Image storage
- **OpenAI GPT-4o-mini** - Bill parsing
- **Tesseract/Google Vision** - OCR

## 📁 Project Structure

```
splitperfect/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # Utilities and API client
│   │   ├── store/           # Zustand stores
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                  # FastAPI backend
│   ├── core/                # Config and security
│   ├── models/              # Database models
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── alembic/             # Database migrations
│   ├── main.py              # App entry point
│   └── requirements.txt
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 14+
- **Google Cloud** account (for OAuth)
- **OpenAI** API key
- **AWS** account (for S3)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Create PostgreSQL database**
   ```bash
   createdb splitperfect
   ```

6. **Run migrations**
   ```bash
   alembic upgrade head
   ```

7. **Start the server**
   ```bash
   uvicorn main:app --reload
   ```

   Backend will run at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Google Client ID
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will run at `http://localhost:3000`

## 🔑 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000`
   - Your production domain
6. Copy Client ID and Secret to `.env` files

### AWS S3 Setup

1. Create an S3 bucket
2. Configure CORS policy:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
3. Create IAM user with S3 access
4. Add credentials to backend `.env`

### OpenAI Setup

1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to backend `.env`

## 📊 Database Schema

```
users
├── id (PK)
├── name
├── email
├── avatar
├── google_id
└── created_at

rooms
├── id (PK)
├── name
├── secret
├── created_by (FK → users)
└── created_at

memberships
├── id (PK)
├── user_id (FK → users)
├── room_id (FK → rooms)
└── joined_at

bills
├── id (PK)
├── room_id (FK → rooms)
├── uploaded_by (FK → users)
├── image_url
├── total_amount
└── created_at

bill_items
├── id (PK)
├── bill_id (FK → bills)
├── description
├── quantity
├── unit_price
├── amount
├── shared_by (JSON array of user_ids)
└── created_at
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/google` - Google OAuth login
- `GET /auth/me` - Get current user

### Rooms
- `POST /rooms` - Create room
- `POST /rooms/join` - Join room with secret
- `GET /rooms` - Get user's rooms
- `GET /rooms/{id}` - Get room details
- `GET /rooms/{id}/summary` - Get expense summary
- `DELETE /rooms/{id}` - Delete room

### Bills
- `POST /bills/upload` - Upload bill image
- `POST /bills/parse` - Parse bill with AI
- `POST /bills/items` - Save bill items
- `GET /bills/room/{room_id}` - Get room bills
- `GET /bills/{id}` - Get bill details
- `DELETE /bills/{id}` - Delete bill

## 🚢 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Backend (Render/Fly.io)

**Using Render:**
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy

**Using Docker:**
```bash
docker build -t splitperfect-backend .
docker run -p 8000:8000 --env-file .env splitperfect-backend
```

### Database (Neon/Supabase)

1. Create PostgreSQL database
2. Copy connection string
3. Update `DATABASE_URL` in backend `.env`
4. Run migrations

## 🧪 Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm run test
```

## 📱 PWA Installation

Users can install SplitPerfect as a mobile app:
1. Open in mobile browser
2. Tap "Add to Home Screen"
3. Use like a native app

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use this project for learning or production.

## 🙏 Acknowledgments

- ShadCN UI for beautiful components
- FastAPI for excellent Python framework
- OpenAI for powerful LLM capabilities

## 📞 Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ for hassle-free expense sharing**
