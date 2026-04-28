"""
Book Schemas - Complete CRUD operations
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from pydantic import Field

class BookCreate(BaseModel):
    """Schema for creating a new book"""
    Accession_number: int
    Title: str
    total_pages: int
    Total_Copy: int
    Copy_Number: int
    Book_Cost: float
    Publisher_place: str
    Status: str = "Available"  # 'Available' or 'Issued'
    rack_location: str
    self_location: str
    publisher_id: Optional[int] = None
    author_ids: Optional[List[int]] = None  # List of author IDs


    class Config:
        json_schema_extra = {
            "example": {
                "Accession_number": 5001,
                "Title": "Introduction to Algorithms",
                "total_pages": 1312,
                "Total_Copy": 5,
                "Copy_Number": 1,
                "Book_Cost": 899.99,
                "Publisher_place": "Cambridge, MA",
                "Status": "Available",
                "rack_location": "A1",
                "self_location": "S1",
                "publisher_id": 1,
                "author_ids": [1, 2],
            
            }
        }


class BookCreateThroughExcel(BaseModel):
    """Schema for creating a new book"""
    Accession_number: int
    Title: str
    total_pages: int
    Total_Copy: int
    Copy_Number: int
    Book_Cost: float
    Publisher_place: str
    Status: str = "Available"  # 'Available' or 'Issued'
    rack_location: str
    self_location: str
    publisher_name: Optional[str] = None #  instead of publisher_id
    author_names: Optional[List[str]] = None # instead of author_ids

    class Config:
        json_schema_extra = {
            "example": {
                "Accession_number": 5001,
                "Title": "Introduction to Algorithms",
                "total_pages": 1312,
                "Total_Copy": 5,
                "Copy_Number": 1,
                "Book_Cost": 899.99,
                "Publisher_place": "Cambridge, MA",
                "Status": "Available",
                "rack_location": "A1",
                "self_location": "S1",
                "publisher_name": "MIT Press",
                "author_names": ["Thomas H. Cormen", "Charles E. Leiserson"]
            }
        }


class BookUpdate(BaseModel):
    """Schema for updating book information"""
    Title: Optional[str] = None
    total_pages: Optional[int] = None
    Total_Copy: Optional[int] = None
    Copy_Number: Optional[int] = None
    Book_Cost: Optional[float] = None
    Publisher_place: Optional[str] = None
    Status: Optional[str] = None
    rack_location: Optional[str] = None
    self_location: Optional[str] = None
    publisher_id: Optional[int] = None
    author_ids: Optional[List[int]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "Status": "Issued",
                "rack_location": "B2"
            }
        }


class AuthorResponse(BaseModel):
    author_id: int
    author_name: str

    class Config:
        from_attributes = True


class BookResponse(BaseModel):
    """Schema for book response"""
    Accession_number: int
    Title: str
    total_pages: int
    Total_Copy: int
    Copy_Number: int
    Book_Cost: float
    Publisher_place: str
    book_upload_time: datetime
    Status: str
    rack_location: Optional[str] = None
    self_location: Optional[str] = None
    publisher_id: int
    publisher_name: Optional[str] = None
    authors: List[str] = Field(alias="author_names")
    class Config:
        from_attributes = True


class BookDetailResponse(BaseModel):
    """Schema for detailed book response with relationships"""
    Accession_number: int
    Title: str
    total_pages: int
    Total_Copy: int
    Copy_Number: int
    Book_Cost: float
    Publisher_place: str
    book_upload_time: datetime
    Status: str
    rack_location: Optional[str] = None
    self_location: Optional[str] = None
    publisher_id: int
    publisher_name: Optional[str] = None
    authors: List[str] = []
  # List of author names
    
    class Config:
        from_attributes = True
