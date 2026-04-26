"""
Main FastAPI Application
Entry point for the QR Library Management System API
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import auth_with_librarian, reference_endpoints, student_endpoints, employee_endpoints, book_endpoints, password_endpoints, issue_book_view_endpoints, transaction_endpoints, penalty_endpoints, book_request_endpoints, profile_endpoints, backup
from app.core.penalty_schedular import  start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager - replaces deprecated on_event
    Handles startup and shutdown events
    """
    # Startup
    print("=" * 60)
    print(f"🚀 {settings.APP_NAME} - Starting Up")
    print("=" * 60)
    print(f"📚 API Documentation: http://localhost:8000/docs")
    print(f"🔧 Debug Mode: {settings.DEBUG}")
    print("=" * 60)
    

    # START SCHEDULER HERE
    start_scheduler()
    
    yield  # Application runs here
    
    # Shutdown
    print("\n" + "=" * 60)
    print("👋 Shutting down gracefully...")
    print("=" * 60)


# Create FastAPI app with lifespan
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="QR-based Library Management System API",
    docs_url="/docs",  # Swagger UI at http://localhost:8000/docs
    redoc_url="/redoc",  # ReDoc at http://localhost:8000/redoc
    lifespan=lifespan  # Use lifespan context manager
)



# Configure CORS - Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins (for development). In production, specify frontend URL(s).
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

#  allow_origins=[
#         "http://localhost:3000",  # Frontend dev server
#         "http://127.0.0.1:3000",
#         "http://localhost:5500",  # Live Server (VS Code)
#         "http://127.0.0.1:5500",
#         "http://localhost:5173",  # Vite dev server
#         "http://127.0.0.1:5173",
#         "http://192.168.154.212:5500" # Local network access (adjust IP as needed)
#         ""
#     ]

# Include routers
app.include_router(
    auth_with_librarian.router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    reference_endpoints.router,
    prefix="/api/reference",
    tags=["Reference Tables"]
)

app.include_router(
    profile_endpoints.router,
    prefix="/api",
    tags=["� Profile Management"]
)

app.include_router(
    issue_book_view_endpoints.router,
    prefix="/api",
    tags=["Issue Books - View"]
)

app.include_router(
    student_endpoints.router,
    prefix="/api",
    tags=["Students"]
)

app.include_router(
    employee_endpoints.router,
    prefix="/api",
    tags=["Employees"]
)

app.include_router(
    book_endpoints.router,
    prefix="/api",
    tags=["Books"]
)

app.include_router(
    password_endpoints.router,
    prefix="/api",
    tags=["Password Management"]
)

# app.include_router(
#     issue_book_view_endpoints.router,
#     prefix="/api",
#     tags=["Issue Books - View"]
# )

app.include_router(
    transaction_endpoints.router,
    prefix="/api",
    tags=["🔄 Transactions - Issue/Return"]
)

app.include_router(
    penalty_endpoints.router,
    prefix="/api",
    tags=["💰 Penalties Management"]
)

app.include_router(
    book_request_endpoints.router,
    prefix="/api",
    tags=["📬 Book Requests"]
)

app.include_router(
    backup.router,
    prefix="/api/backup",
    tags=["💾 Backup"]
)



# Root endpoint
@app.get("/")
def root():
    """
    API Root - Welcome message
    """
    return {
        "message": "QR Library Management System API",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "running",
        "features": {
            "authentication": "Student, Employee, Librarian login",
            "crud_operations": "Students, Employees, Books",
            "transactions": "Issue books, Return books, Renew books",
            "penalties": "View, Pay, Waive penalties",
            "book_requests": "Students request unavailable books",
            "qr_support": "Frontend handles QR scanning"
        },
        "endpoints": {
            "authentication": "/api/auth",
            "reference_tables": "/api/reference",
            "students": "/api/students",
            "employees": "/api/employees",
            "books": "/api/books",
            "passwords": "/api/students/password & /api/employees/password",
            "my_books": "/api/students/my-issued-books & /api/employees/my-issued-books",
            "transactions": "/api/transactions/issue-book & /api/transactions/return-book",
            "penalties": "/api/penalties",
            "book_requests": "/api/book-requests"
        }
    }

# Health check endpoint
@app.get("/health")
def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "database": "connected"
    }