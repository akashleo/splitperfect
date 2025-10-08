# SplitPerfect Backend

FastAPI backend for SplitPerfect expense sharing application.

## Setup

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Initialize database**
   ```bash
   # Create PostgreSQL database
   createdb splitperfect
   
   # Run migrations
   alembic upgrade head
   ```

5. **Run server**
   ```bash
   uvicorn main:app --reload
   ```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Project Structure

```
backend/
├── core/              # Configuration and security
├── models/            # SQLAlchemy models
├── routes/            # API endpoints
├── services/          # Business logic
│   ├── ocr_service.py      # OCR processing
│   ├── llm_service.py      # LLM bill parsing
│   ├── simplify_service.py # Debt simplification
│   └── storage_service.py  # S3 file upload
├── alembic/           # Database migrations
├── main.py            # Application entry point
└── requirements.txt   # Python dependencies
```

## Environment Variables

See `.env.example` for required configuration.

## Testing

```bash
pytest
```
