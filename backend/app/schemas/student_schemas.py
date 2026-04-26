"""
Student Schemas - Complete CRUD operations
"""

from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional


class StudentCreate(BaseModel):
    """Schema for creating a new student"""
    Prn_id: int
    first_name: str
    Middle_name: str
    last_name: str
    DOB: date
    sem: str  # '1' to '8'
    Phone_no: str
    password: str  # Will be hashed
    gmail: EmailStr
    Branch_id: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "Prn_id": 1001,
                "first_name": "John",
                "Middle_name": "A",
                "last_name": "Doe",
                "DOB": "2000-01-01",
                "sem": "1",
                "Phone_no": "1234567890",
                "password": "student123",
                "gmail": "john.doe@example.com",
                "Branch_id": 1,
             
            }
        }
        
class StudentCreateThroughExcel(BaseModel):
    """Schema for creating a new student"""
    Prn_id: int
    first_name: str
    Middle_name: str
    last_name: str
    DOB: date
    sem: str  # '1' to '8'
    Phone_no: str
    password: str  # Will be hashed
    gmail: EmailStr
    Branch_id: Optional[int] = None
    Branch_name: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "Prn_id": 1001,
                "first_name": "John",
                "Middle_name": "A",
                "last_name": "Doe",
                "DOB": "2000-01-01",
                "sem": "1",
                "Phone_no": "1234567890",
                "password": "student123",
                "gmail": "john.doe@example.com",
                "Branch_name": "Computer Science"
            }
        }


class StudentUpdate(BaseModel):
    """Schema for updating student information"""
    first_name: Optional[str] = None
    Middle_name: Optional[str] = None
    last_name: Optional[str] = None
    DOB: Optional[date] = None
    sem: Optional[str] = None
    Phone_no: Optional[str] = None
    password: Optional[str] = None  # Will be hashed if provided
    gmail: Optional[EmailStr] = None
    Branch_id: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "sem": "2",
                "Phone_no": "9876543210"
            }
        }


class StudentResponse(BaseModel):
    """Schema for student response (no password)"""
    Prn_id: int
    first_name: str
    Middle_name:  Optional[str] = None
    last_name: str
    DOB: date
    sem: str
    Phone_no: str
    gmail: str
    student_creation_time: datetime
    Branch_id: Optional[int]
    branch_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class StudentDetailResponse(BaseModel):
    """Schema for detailed student response with relationships"""
    Prn_id: int
    first_name: str
    Middle_name: Optional[str] = None
    last_name: str
    DOB: date
    sem: str
    Phone_no: str
    gmail: str
    student_creation_time: datetime
    Branch_id: Optional[int]
    branch_name: Optional[str] = None
    
    class Config:
        from_attributes = True