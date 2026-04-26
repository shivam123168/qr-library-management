"""
Issue Book Schemas - For viewing issued, returned, and overdue books
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class IssueBookResponse(BaseModel):
    """Schema for issue book record"""
    issue_book_id: int
    issue_time: datetime
    due_date: datetime
    returned_date: Optional[datetime]
    status: Optional[str]
    
    # Student details
    Student_Prn_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_phone: Optional[str] = None
    
    # Book details
    Books_Accession_number: int
    book_title: Optional[str] = None
    book_author: Optional[str] = None
    
    # Employee details
    Employee_Emp_Id: Optional[int] = None
    employee_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class IssueBookDetailResponse(BaseModel):
    """Schema for detailed issue book information"""
    issue_book_id: int
    issue_time: datetime
    due_date: datetime
    returned_date: Optional[datetime]
    status: Optional[str]
    days_overdue: Optional[int] = None  # Number of days overdue (if overdue)
    
    # borrower details
    borrower: dict  
    
    # Book details
    book: dict  # Contains Accessation_number, title, authors, publisher, location
    
    
    # Penalty info (if any)
    has_penalty: bool = False
    penalty_amount: Optional[float] = None
    penalty_status: Optional[str] = None
    
    class Config:
        from_attributes = True


class OverdueBookSummary(BaseModel):
    """Summary of overdue books"""
    total_overdue: int
    total_students_with_overdue: int
    total_penalty_amount: float
    books: List[IssueBookResponse]


class IssuedBookStats(BaseModel):
    """Statistics about issued books"""
    total_issued: int
    total_returned: int
    total_available: int
    total_overdue: int
    currently_issued: int # Not yet returned
    student_issued: int
    employee_issued: int
    class Config:
        json_schema_extra = {
            "example": {
                "total_issued": 150,
                "total_returned": 120,
                "total_overdue": 15,
                "currently_issued": 30,
                "total_available": 200,
                "student_issued": 100,
                "employee_issued": 50
            }
        }