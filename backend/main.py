from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from database import engine, Base
from routes import auth_router, rooms_router, bills_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="SplitPerfect API",
    description="AI-powered expense sharing and bill splitting application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(bills_router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "SplitPerfect API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development"
    )
