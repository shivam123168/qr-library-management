"""
Profile Schemas
Complete personal information for students and employees (no passwords)
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from pymysql import Date


class StudentProfileResponse(BaseModel):
    """Complete student profile information"""
    Prn_id: int
    first_name: str
    middle_name: str
    last_name: str
    DOB: str
    gmail: str
    Phone_no: str
    sem: Optional[int] = None
    Branch_id: Optional[int] = None
    branch_name: Optional[str] = None
    student_creation_time: Optional[datetime] = None
    
    # Statistics
    total_books_borrowed: int
    currently_issued: int
    currently_overdue: int
    total_penalties: int
    unpaid_penalties: int
    total_unpaid_amount: float
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "Prn_id": 1001,
                "first_name": "John",
                "last_name": "Doe",
                "DOB": "2000-05-15",
                "gmail": "john.doe@example.com",
                "Phone_no": "9876543210",
                "sem": 5,
                "Branch_id": 1,
                "branch_name": "Computer Science",
                "profile_created_at": "2025-01-15T10:30:00",
                "total_books_borrowed": 15,
                "currently_issued": 2,
                "currently_overdue": 1,
                "total_penalties": 3,
                "unpaid_penalties": 1,
                "total_unpaid_amount": 50.0
            }
        }


class EmployeeProfileResponse(BaseModel):
    """Complete employee profile information"""
    Emp_Id: int
    First_name: str
    Middel_name: str
    Last_name: str
    DOB: str
    Gmail: str
    Phone_no: str
    Department_id: Optional[int] = None
    department_name: Optional[str] = None
    Employee_post_id: Optional[int] = None
    post_name: Optional[str] = None
    employee_creation_time: Optional[datetime] = None
    
    # Statistics
    total_books_borrowed: int
    currently_borrowed: int
    currently_overdue: int
    total_penalties: int
    unpaid_penalties: int
    total_unpaid_amount: float
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "Emp_Id": 200,
                "First_name": "Jane",
                "Last_name": "Smith",
                "Gmail": "jane.smith@example.com",
                "DOB": "1985-07-20",
                "Phone_no": "9876543211",
                "Department_Department_id": 1,
                "department_name": "Computer Science",
                "Employee_post_Employee_post_id": 1,
                "post_name": "Assistant Professor",
                "profile_created_at": "2024-08-01T09:00:00",
                "total_books_borrowed": 8,
                "currently_borrowed": 1,
                "currently_overdue": 0,
                "total_penalties": 1,
                "unpaid_penalties": 0,
                "total_unpaid_amount": 0.0
            }
        }


class UpdateStudentProfileRequest(BaseModel):
    """Update student profile information"""
    gmail: Optional[str] = None
    Phone_no: Optional[str] = None
    sem: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "gmail": "newemail@example.com",
                "Phone_no": "9876543210",
                "sem": 6
            }
        }


class UpdateEmployeeProfileRequest(BaseModel):
    """Update employee profile information"""
    Gmail: Optional[str] = None
    Phone_no: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "Gmail": "newemail@example.com",
                "Phone_no": "9876543211"
            }
        }
