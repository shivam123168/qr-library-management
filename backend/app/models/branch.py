"""
Branch Model - College/University Branches
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Branch(Base):
    """
    Branch model representing different branches/departments
    (e.g., Computer Science, Mechanical Engineering, etc.)
    """
    __tablename__ = "branch"
    
    # Columns
    Branch_id = Column(Integer, primary_key=True, autoincrement=True)
    Branch_name = Column(String(45), nullable=False, unique=True)
    
    # Relationships
    students = relationship("Student", back_populates="branch")
    
    def __repr__(self):
        return f"<Branch(id={self.Branch_id}, name='{self.Branch_name}')>"
