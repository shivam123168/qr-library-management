"""
Student Model - Student Information
"""

from sqlalchemy import Column, Integer, String, Date, Enum, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Student(Base):
    """
    Student model representing student users of the library system
    """
    __tablename__ = "Students"
    
    # Columns
    Prn_id = Column(Integer, primary_key=True)
    first_name = Column(String(45), nullable=False)
    Middle_name = Column(String(45), nullable=False)
    last_name = Column(String(45), nullable=False)
    DOB = Column(Date, nullable=False)
    sem = Column(
        Enum('1', '2', '3', '4', '5', '6', '7', '8'),
        nullable=False
    )
    Phone_no = Column(String(15), nullable=False, unique=True)
    password = Column(String(225), nullable=False)
    gmail = Column(String(60), nullable=False, unique=True)
    student_creation_time = Column(TIMESTAMP, nullable=False)
    
    # Foreign Keys
    Branch_id = Column(Integer, ForeignKey('Branch.Branch_id'))
    
    # Relationships
    branch = relationship("Branch", back_populates="students")
    issued_books = relationship("IssueBook", back_populates="student")
    requested_books = relationship("RequestBook", back_populates="student")
    
    def __repr__(self):
        return f"<Student(Prn_id={self.Prn_id}, name='{self.first_name} {self.last_name}')>"
