"""
Employee Post Model - Employee Positions/Designations
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class EmployeePost(Base):
    """
    Employee Post model representing different positions/designations
    (e.g., Librarian, Assistant Librarian, Clerk, etc.)
    """
    __tablename__ = "Employee_post"
    
    # Columns
    Employee_post_id = Column(Integer, primary_key=True)
    post_name = Column(String(45), nullable=False, unique=True)
    
    # Relationships
    employees = relationship("Employee", back_populates="employee_post")
    
    def __repr__(self):
        return f"<EmployeePost(id={self.Employee_post_id}, post='{self.post_name}')>"
