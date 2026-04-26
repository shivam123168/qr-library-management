"""
Publisher Model - Book Publishers
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Publisher(Base):
    """
    Publisher model representing book publishing companies
    """
    __tablename__ = "publishers"
    
    # Columns
    publisher_id = Column(Integer, primary_key=True, autoincrement=True)
    publisher_name = Column(String(45), nullable=False, unique=True)
    
    # Relationships
    books = relationship("Book", back_populates="publisher")
    
    def __repr__(self):
        return f"<Publisher(id={self.publisher_id}, name='{self.publisher_name}')>"
