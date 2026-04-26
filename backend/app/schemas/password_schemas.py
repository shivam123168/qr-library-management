"""
Password Update Schemas
"""

from pydantic import BaseModel


class PasswordUpdate(BaseModel):
    """Schema for updating password"""
    old_password: str
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "old_password": "oldpass123",
                "new_password": "newpass456"
            }
        }


class PasswordResetByLibrarian(BaseModel):
    """Schema for librarian to reset user password"""
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "new_password": "resetpass123"
            }
        }


class PasswordUpdateResponse(BaseModel):
    """Response after password update"""
    message: str
    user_id: int
    user_type: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Password updated successfully",
                "user_id": 1001,
                "user_type": "student"
            }
        }