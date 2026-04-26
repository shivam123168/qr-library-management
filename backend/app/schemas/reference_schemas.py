"""
Reference Tables Schemas
Schemas for Branch, Department, Publishers, Authors, etc.
"""

from pydantic import BaseModel
from typing import Optional


# ===== BRANCH =====
class BranchCreate(BaseModel):
    """Schema for creating a new branch"""
    Branch_name: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "Branch_name": "Computer Science"
            }
        }


class BranchResponse(BaseModel):
    """Schema for branch response"""
    Branch_id: int
    Branch_name: str
    
    class Config:
        from_attributes = True


# ===== DEPARTMENT =====
class DepartmentCreate(BaseModel):
    """Schema for creating a new department"""
    department_name: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "department_name": "Library"
            }
        }


class DepartmentResponse(BaseModel):
    """Schema for department response"""
    Department_id: int
    department_name: str
    
    class Config:
        from_attributes = True


# ===== PUBLISHER =====
class PublisherCreate(BaseModel):
    """Schema for creating a new publisher"""
    publisher_name: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "publisher_name": "Pearson Education"
            }
        }


class PublisherResponse(BaseModel):
    """Schema for publisher response"""
    publisher_id: int
    publisher_name: str
    
    class Config:
        from_attributes = True


# ===== AUTHOR =====
class AuthorCreate(BaseModel):
    """Schema for creating a new author"""
    Author_name: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "Author_name": "J.K. Rowling"
            }
        }


class AuthorResponse(BaseModel):
    """Schema for author response"""
    Author_id: int
    Author_name: str
    
    class Config:
        from_attributes = True


# ===== EMPLOYEE POST =====
class EmployeePostCreate(BaseModel):
    """Schema for creating a new employee post"""
    post_name: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "post_name": "Assistant Librarian"
            }
        }


class EmployeePostResponse(BaseModel):
    """Schema for employee post response"""
    Employee_post_id: int
    post_name: str
    
    class Config:
        from_attributes = True


# ===== PENALTY AMOUNT =====
class PenaltyAmountCreate(BaseModel):
    """Schema for creating a new penalty amount"""
    penalty_amount: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "penalty_amount": 5.0
            }
        }


class PenaltyAmountResponse(BaseModel):
    """Schema for penalty amount response"""
    id: int
    penalty_amount: float
    
    class Config:
        from_attributes = True


# ===== PENALTY EXCUSE =====
class PenaltyExcuseCreate(BaseModel):
    """Schema for creating a new penalty excuse"""
    excuse: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "excuse": "Medical emergency"
            }
        }


class PenaltyExcuseResponse(BaseModel):
    """Schema for penalty excuse response"""
    penalty_excuse_id: int
    excuse: str
    
    class Config:
        from_attributes = True


# ===== DAY LIMIT BOOK =====
class DayLimitBookCreate(BaseModel):
    """Schema for creating/updating day limit"""
    days_limit: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "days_limit": 14
            }
        }


class DayLimitBookResponse(BaseModel):
    """Schema for day limit response"""
    day_id: int
    days_limit: int
    
    class Config:
        from_attributes = True