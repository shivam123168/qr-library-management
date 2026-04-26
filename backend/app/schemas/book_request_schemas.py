"""
Book Request Schemas - Updated
Supports both Students AND Employees requesting books
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BookRequestCreate(BaseModel):
    """Schema for creating a book request (Student or Employee)"""
    book_accession_number: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "book_accession_number": 5001
            }
        }


class BookRequestResponse(BaseModel):
    """Response after creating a book request"""
    request_id: int
    book_accession_number: int
    book_title: str
    book_status: str
    requester_id: int  # PRN or Emp_Id
    requester_type: str  # "student" or "employee"
    requester_name: str
    request_time: datetime
    message: str
    
    class Config:
        from_attributes = True


class BookRequestDetail(BaseModel):
    """Detailed book request information"""
    request_id: int
    book_accession_number: int
    book_title: str
    book_authors: list[str]
    current_holder_name: Optional[str] = None
    current_holder_type: Optional[str] = None  # "student" or "employee"
    expected_return_date: Optional[datetime] = None
    requester_id: int
    requester_type: str  # "student" or "employee"
    requester_name: str
    requester_email: str
    requester_phone: str
    request_time: datetime
    can_be_processed: bool  # True if book is now available
    
    class Config:
        from_attributes = True


class ProcessBookRequestRequest(BaseModel):
    """Request to process (approve/reject) a book request"""
    action: str  # "issue" or "cancel"
    days_limit: Optional[int] = None  # Required if action is "issue"
    
    class Config:
        json_schema_extra = {
            "example": {
                "action": "issue",
                "days_limit": 14
            }
        }