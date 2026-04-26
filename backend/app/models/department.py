"""
Department Model - Employee Departments
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Department(Base):
    """
    Department model representing different departments where employees work
    (e.g., Library, Administration, etc.)
    """
    __tablename__ = "Department"
    
    # Columns
    Department_id = Column(Integer, primary_key=True, autoincrement=True)
    department_name = Column(String(45), nullable=False, unique=True)
    
    # Relationships
    employees = relationship("Employee", back_populates="department")
    
    def __repr__(self):
        return f"<Department(id={self.Department_id}, name='{self.department_name}')>"
