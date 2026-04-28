"""
Employee Model - Library Staff/Employees
"""

from sqlalchemy import Column, Integer, String, Date, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Employee(Base):
    """
    Employee model representing library staff members
    """
    __tablename__ = "employees"
    
    # Columns
    Emp_Id = Column(Integer, primary_key=True)
    First_name = Column(String(45), nullable=False)
    Middle_name = Column(String(45), nullable=False)
    Last_name = Column(String(45), nullable=False)
    DOB = Column(Date, nullable=False)
    Phone_no = Column(String(15), nullable=False, unique=True)
    Gmail = Column(String(45), nullable=False, unique=True)
    Password = Column(String(225), nullable=False)
    employee_creation_time = Column(TIMESTAMP, nullable=False)
    
    # Foreign Keys
    Employee_post_id = Column(Integer, ForeignKey('employee_post.Employee_post_id'))
    Department_id = Column(Integer, ForeignKey('department.Department_id'))
    
    # Relationships
    employee_post = relationship("EmployeePost", back_populates="employees")
    department = relationship("Department", back_populates="employees")
    issued_books = relationship("IssueBook", back_populates="employee")
    requested_books = relationship("RequestBook", back_populates="employee")
    
    def __repr__(self):
        return f"<Employee(Emp_Id={self.Emp_Id}, name='{self.First_name} {self.Last_name}')>"
