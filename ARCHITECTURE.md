# SplitPerfect Architecture

Technical architecture and design decisions for SplitPerfect.

## System Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   Frontend   │ ◄─────► │   Backend   │
│   (PWA)     │  HTTPS  │ React + Vite │   REST  │   FastAPI   │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                         │
                        ┌────────────────────────────────┼────────┐
                        │                                │        │
                   ┌────▼────┐                    ┌──────▼──┐ ┌──▼───┐
                   │PostgreSQL│                    │   S3   │ │ APIs │
                   │    DB    │                    │Storage │ │ LLM  │
                   └──────────┘                    └────────┘ └──────┘
```

## Frontend Architecture

### Technology Stack

- **React 18** - UI library with hooks
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **ShadCN UI** - Pre-built accessible components
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Axios** - HTTP client

### State Management

```
┌─────────────────────────────────────┐
│         Application State           │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Zustand    │  │React Query  │ │
│  │              │  │             │ │
│  │ - Auth       │  │ - Rooms     │ │
│  │ - User       │  │ - Bills     │ │
│  │ - Token      │  │ - Summary   │ │
│  │              │  │ - Cache     │ │
│  └──────────────┘  └─────────────┘ │
│                                     │
│  Local Storage    Server State     │
└─────────────────────────────────────┘
```

### Component Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   └── Layout.tsx       # App shell with navigation
│
├── pages/               # Route components
│   ├── Login.tsx
│   ├── Home.tsx
│   ├── CreateRoom.tsx
│   ├── RoomDetails.tsx
│   └── ...
│
├── lib/
│   ├── api.ts          # Axios instance + interceptors
│   └── utils.ts        # Helper functions
│
├── store/
│   └── authStore.ts    # Zustand auth state
│
└── types/
    └── index.ts        # TypeScript definitions
```

### Routing Strategy

- **Public Routes**: `/login`
- **Protected Routes**: All others (require authentication)
- **Route Guards**: `ProtectedRoute` component checks auth state
- **Navigation**: Bottom tab bar for mobile-first UX

### Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
React Query Mutation/Query
    ↓
API Call (Axios)
    ↓
Backend Endpoint
    ↓
Response
    ↓
React Query Cache Update
    ↓
Component Re-render
```

## Backend Architecture

### Technology Stack

- **FastAPI** - Modern async Python framework
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **JWT** - Stateless authentication
- **Boto3** - AWS S3 integration
- **OpenAI** - LLM for bill parsing
- **Tesseract/Google Vision** - OCR

### Layered Architecture

```
┌─────────────────────────────────────┐
│         Routes (API Layer)          │
│  - Handle HTTP requests/responses   │
│  - Input validation (Pydantic)      │
│  - Authentication checks            │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      Services (Business Logic)      │
│  - OCR Service                      │
│  - LLM Service                      │
│  - Simplify Service                 │
│  - Storage Service                  │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      Models (Data Layer)            │
│  - SQLAlchemy ORM models            │
│  - Database operations              │
└─────────────────────────────────────┘
```

### API Design

**RESTful Principles:**
- Resources: `/rooms`, `/bills`, `/auth`
- HTTP Methods: GET, POST, DELETE
- Status Codes: 200, 201, 400, 401, 403, 404, 500
- JSON request/response bodies

**Authentication Flow:**
```
1. User clicks "Sign in with Google"
2. Frontend gets Google OAuth token
3. Frontend sends token to POST /auth/google
4. Backend verifies token with Google
5. Backend creates/updates user in DB
6. Backend generates JWT token
7. Frontend stores JWT in localStorage
8. Frontend includes JWT in Authorization header
9. Backend validates JWT on protected routes
```

### Database Schema Design

**Normalization:**
- 3NF (Third Normal Form)
- Foreign key constraints
- Indexes on frequently queried fields

**Relationships:**
```
User 1──────────* Membership *──────────1 Room
  │                                        │
  │                                        │
  1                                        1
  │                                        │
  *                                        *
Bill ────────────* BillItem
```

**Key Design Decisions:**
- `shared_by` as JSON array for flexibility
- Soft deletes not implemented (can be added)
- Timestamps on all entities
- Secret codes for room sharing (URL-safe tokens)

### Service Layer

**OCR Service:**
- Abstracts OCR implementation (Tesseract vs Google Vision)
- Handles image preprocessing
- Returns raw text

**LLM Service:**
- Sends OCR text to GPT-4o-mini
- Structured output with JSON mode
- Validates and formats response
- Error handling and retries

**Simplify Service:**
- Implements debt simplification algorithm
- Greedy approach to minimize transactions
- Handles floating-point precision

**Storage Service:**
- AWS S3 integration
- Generates unique filenames
- Returns public URLs
- Handles cleanup on delete

### Security

**Authentication:**
- Google OAuth 2.0 for user verification
- JWT tokens for session management
- Token expiration (30 days default)
- HTTP-only cookies option available

**Authorization:**
- Room membership verification
- User ownership checks (delete operations)
- API endpoint protection

**Data Protection:**
- Environment variables for secrets
- No sensitive data in logs
- CORS configuration
- SQL injection prevention (ORM)

## AI/ML Pipeline

### Bill Parsing Flow

```
┌──────────────┐
│ Upload Image │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Store in S3 │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ OCR Extract  │ ◄── Tesseract or Google Vision
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Raw Text    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ LLM Parsing  │ ◄── OpenAI GPT-4o-mini
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Structured   │
│    JSON      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Frontend   │
│   Editing    │
└──────────────┘
```

### LLM Prompt Engineering

**System Prompt:**
```
You are a bill parsing assistant. Extract line items from 
receipts and return valid JSON.
```

**User Prompt Template:**
```
Parse the following receipt text and extract all line items.

Receipt Text:
{ocr_text}

Return JSON with:
- merchant_name
- date
- items (description, quantity, unit_price, total)
- subtotal, tax, total_amount
```

**Response Format:**
- JSON mode enabled for structured output
- Temperature: 0.1 for consistency
- Validation and fallbacks

### Debt Simplification Algorithm

**Problem:** Minimize number of transactions to settle debts

**Algorithm:**
1. Calculate net balance for each user
2. Separate creditors (positive) and debtors (negative)
3. Sort both lists by amount (descending)
4. Greedily match largest creditor with largest debtor
5. Settle minimum of the two amounts
6. Continue until all balanced

**Complexity:** O(n log n) due to sorting

**Example:**
```
Initial:
- Alice paid $100, owes $30 → net +$70
- Bob paid $20, owes $50 → net -$30
- Carol paid $30, owes $70 → net -$40

Simplified:
- Bob pays Alice $30
- Carol pays Alice $40
```

## Deployment Architecture

### Production Stack

```
┌─────────────┐
│   Vercel    │ ◄── Frontend (Static hosting)
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Render    │ ◄── Backend (Container)
└──────┬──────┘
       │
       ├──────► PostgreSQL (Neon/Supabase)
       ├──────► S3 (AWS)
       └──────► OpenAI API
```

### Scaling Considerations

**Frontend:**
- CDN distribution (Vercel Edge Network)
- Static asset caching
- Code splitting
- Lazy loading

**Backend:**
- Horizontal scaling (multiple instances)
- Database connection pooling
- Redis caching (future)
- Rate limiting (future)

**Database:**
- Read replicas for scaling reads
- Indexes on foreign keys
- Query optimization

## Performance Optimizations

### Frontend

- **React Query** caching reduces API calls
- **Code splitting** reduces initial bundle size
- **Lazy loading** images and routes
- **Debouncing** user inputs
- **Optimistic updates** for better UX

### Backend

- **Async/await** for I/O operations
- **Database indexing** on frequently queried fields
- **Batch operations** where possible
- **Connection pooling** for database
- **Caching** API responses (future)

## Monitoring & Observability

### Logging

**Backend:**
- Request/response logging
- Error tracking
- Performance metrics

**Frontend:**
- Error boundaries
- Analytics events
- Performance monitoring

### Future Enhancements

- Sentry for error tracking
- DataDog for APM
- CloudWatch for AWS resources
- Google Analytics for user behavior

## Testing Strategy

### Frontend

- **Unit Tests**: Component logic
- **Integration Tests**: User flows
- **E2E Tests**: Critical paths (Playwright)

### Backend

- **Unit Tests**: Service layer
- **Integration Tests**: API endpoints
- **Database Tests**: Model operations

## Future Architecture Improvements

1. **Microservices**: Split AI processing into separate service
2. **Message Queue**: Async bill processing with Celery/RabbitMQ
3. **Caching Layer**: Redis for frequently accessed data
4. **WebSockets**: Real-time updates for collaborative editing
5. **GraphQL**: Alternative to REST for flexible queries
6. **Event Sourcing**: Audit trail for all transactions

## Design Patterns Used

- **Repository Pattern**: Database abstraction
- **Service Layer**: Business logic separation
- **Dependency Injection**: FastAPI dependencies
- **Factory Pattern**: Model creation
- **Singleton**: Service instances
- **Observer**: React state updates

## Technology Choices Rationale

**Why FastAPI?**
- Modern async support
- Automatic API documentation
- Type hints and validation
- High performance

**Why React?**
- Large ecosystem
- Component reusability
- Virtual DOM performance
- Strong TypeScript support

**Why PostgreSQL?**
- ACID compliance
- JSON support for flexible fields
- Mature and reliable
- Good ORM support

**Why Zustand over Redux?**
- Simpler API
- Less boilerplate
- Better TypeScript support
- Smaller bundle size

**Why React Query?**
- Built-in caching
- Automatic refetching
- Optimistic updates
- DevTools

This architecture provides a solid foundation for a scalable, maintainable expense-sharing application with room for future enhancements.
