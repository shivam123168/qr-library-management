"""
Authentication Schemas - Login/Token models
"""

from pydantic import BaseModel
from typing import Optional


class StudentLoginRequest(BaseModel):
    """
    Student login request
    Username is PRN, password is password
    """
    prn: int  # Student PRN as username
    password: str  # Plain password
    
    class Config:
        json_schema_extra = {
            "example": {
                "prn": 1001,
                "password": "student123"
            }
        }


class EmployeeLoginRequest(BaseModel):
    """
    Employee login request
    Username is Emp_Id, password is password
    """
    emp_id: int  # Employee ID as username
    password: str  # Plain password
    
    class Config:
        json_schema_extra = {
            "example": {
                "emp_id": 10,
                "password": "employee123"
            }
        }


class TokenResponse(BaseModel):
    """
    Response after successful login
    """
    access_token: str
    token_type: str = "bearer"
    user_type: str  # "student" or "employee"
    user_id: int  # PRN or Emp_Id
    name: str  # Full name
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user_type": "student",
                "user_id": 1001,
                "name": "John Doe"
            }
        }


class TokenData(BaseModel):
    """
    Data stored inside JWT token
    """
    user_id: Optional[int] = None
    user_type: Optional[str] = None  # "student" or "employee"