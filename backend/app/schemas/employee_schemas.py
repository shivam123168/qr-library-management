"""
Employee Schemas - Complete CRUD operations
"""

from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional


class EmployeeCreate(BaseModel):
    """Schema for creating a new employee"""
    Emp_Id: int
    First_name: str
    Middle_name: str
    Last_name: str
    DOB: date
    Phone_no: str
    Gmail: EmailStr
    Password: str  # Will be hashed
    Employee_post_id: Optional[int] = None
    Department_id: Optional[int] = None
  
    
    class Config:
        json_schema_extra = {
            "example": {
                "Emp_Id": 10,
                "First_name": "Jane",
                "Middle_name": "M",
                "Last_name": "Smith",
                "DOB": "1990-05-15",
                "Phone_no": "5551234567",
                "Gmail": "jane.smith@library.com",
                "Password": "employee123",
                "Employee_post_id": 1,
                "Department_id": 1,
                
            }
        }


class EmployeeCreateThroughExcel(BaseModel):
    """Schema for creating a new employee"""
    Emp_Id: int
    First_name: str
    Middle_name: str
    Last_name: str
    DOB: date
    Phone_no: str
    Gmail: EmailStr
    Password: str  # Will be hashed
    Department_name: Optional[str] = None   # 👈 NEW
    Post_name: Optional[str] = None  
    
    class Config:
        json_schema_extra = {
            "example": {
                "Emp_Id": 10,
                "First_name": "Jane",
                "Middle_name": "M",
                "Last_name": "Smith",
                "DOB": "1990-05-15",
                "Phone_no": "5551234567",
                "Gmail": "jane.smith@library.com",
                "Password": "employee123",
                "Department_name": "Circulation",  
                "Post_name": "Librarian"
            }
        }

class EmployeeUpdate(BaseModel):
    """Schema for updating employee information"""
    Emp_Id: Optional[int] = None
    First_name: Optional[str] = None
    Middle_name: Optional[str] = None
    Last_name: Optional[str] = None
    DOB: Optional[date] = None
    Phone_no: Optional[str] = None
    Gmail: Optional[EmailStr] = None
    Password: Optional[str] = None  # Will be hashed if provided
    Employee_post_id: Optional[int] = None
    Department_id: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "Phone_no": "5559876543",
                "Employee_post_id": 2
            }
        }


class EmployeeResponse(BaseModel):
    """Schema for employee response (no password)"""
    Emp_Id: int
    First_name: str
    Middle_name: str
    Last_name: str
    DOB: date
    Phone_no: str
    Gmail: str
    employee_creation_time: Optional[datetime] = None
    Employee_post_id: Optional[int]
    Department_id: Optional[int]
    department_name: Optional[str] = None
    post_name: Optional[str] = None
    class Config:
        from_attributes = True


class EmployeeDetailResponse(BaseModel):
    """Schema for detailed employee response with relationships"""
    Emp_Id: int
    First_name: str
    Middle_name: str
    Last_name: str
    DOB: date
    Phone_no: str
    Gmail: str
    employee_creation_time: Optional[datetime] = None
    Employee_post_id: Optional[int]
    Department_id: Optional[int]
    post_name: Optional[str] = None
    department_name: Optional[str] = None
    
    class Config:
        from_attributes = True