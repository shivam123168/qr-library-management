"""
QR Library Management System - Server Starter
Run this file to start the FastAPI backend server

Usage:
    python run.py
    
Server will run on: http://localhost:8000
API Documentation: http://localhost:8000/docs
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes (disable in production)
        log_level="info"
    )
    