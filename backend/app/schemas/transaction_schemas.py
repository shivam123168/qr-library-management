"""
Issue Book Transaction Schemas
For issuing and returning books
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class IssueBookRequest(BaseModel):
    """Schema for issuing a book to student"""
    student_prn_id: int
    book_accession_number: int
    days_limit: int  # Librarian selects this at time of issue
    
    class Config:
        json_schema_extra = {
            "example": {
                "student_prn_id": 1001,
                "book_accession_number": 5001,
                "days_limit": 14
            }
        }


class IssueBookResponse(BaseModel):
    """Response after successfully issuing a book"""
    issue_book_id: int
    student_prn_id: int
    student_name: str
    book_accession_number: int
    book_title: str
    # issued_by: str  # Employee name
    issue_time: datetime
    due_date: datetime
    days_allowed: int
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "issue_book_id": 1,
                "student_prn_id": 1001,
                "student_name": "John Doe",
                "book_accession_number": 5001,
                "book_title": "Introduction to Algorithms",
                "issue_time": "2026-02-14T10:30:00",
                "return_date": "2026-02-28T10:30:00",
                "days_allowed": 14,
                "message": "Book issued successfully"
            }
        }


class ReturnBookRequest(BaseModel):
    """Schema for returning a book"""
    book_accession_number: int
    student_prn_id: Optional[int] = None  # Optional, can auto-detect
    
    class Config:
        json_schema_extra = {
            "example": {
                "book_accession_number": 5001,
                "Borrower_id": 1001
            }
        }


class ReturnBookResponse(BaseModel):
    """Response after returning a book"""
    issue_book_id: int
    student_prn_id: int
    student_name: str
    book_accession_number: int
    book_title: str
    issue_time: datetime
    due_date: datetime  # Expected return date
    returned_date: datetime  # Actual return date
    days_borrowed: int
    days_overdue: int
    is_overdue: bool
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "issue_book_id": 1,
                "student_prn_id": 1001,
                "student_name": "John Doe",
                "book_accession_number": 5001,
                "book_title": "Introduction to Algorithms",
                "issue_time": "2026-02-14T10:30:00",
                "return_date": "2026-02-28T10:30:00",
                "returned_date": "2026-03-05T14:20:00",
                "days_borrowed": 20,
                "days_overdue": 5,
                "is_overdue": True,
                "message": "Book returned. Penalty applied for late return."
            }
        }


class RenewBookRequest(BaseModel):
    """Schema for renewing/extending book return date"""
    book_accession_number: int
    student_prn_id: int
    additional_days: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "book_accession_number": 5001,
                "student_prn_id": 1001,
                "additional_days": 7
            }
        }


class RenewBookResponse(BaseModel):
    """Response after renewing a book"""
    issue_book_id: int
    book_title: str
    old_return_date: datetime
    new_return_date: datetime
    additional_days: int
    message: str