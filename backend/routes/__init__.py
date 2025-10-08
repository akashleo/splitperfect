from routes.auth import router as auth_router
from routes.rooms import router as rooms_router
from routes.bills import router as bills_router

__all__ = ["auth_router", "rooms_router", "bills_router"]
