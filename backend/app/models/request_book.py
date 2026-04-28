"""
Request Book Model - Student Book Requests
"""

from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class RequestBook(Base):
    """
    Request Book model for tracking student book requests
    When a book is not available, students can request it
    """
    __tablename__ = "request_books"
    
    # Columns
    request_id = Column(Integer, primary_key=True, autoincrement=True)
    book_request_time = Column(TIMESTAMP, nullable=False, unique=True)
    status = Column(Enum('Pending', 'Approved', 'Rejected'), nullable=False, default='Pending')
    
    # Foreign Keys
    Books_Accession_number = Column(Integer, ForeignKey('books.Accession_number'))
    Employee_Emp_Id = Column(Integer, ForeignKey('employees.Emp_Id'))
    Student_Prn_id = Column(Integer, ForeignKey('students.Prn_id'))
    
    # Relationships
    book = relationship("Book", back_populates="requests")
    employee = relationship("Employee", back_populates="requested_books")
    student = relationship("Student", back_populates="requested_books")
    
    def __repr__(self):
        return f"<RequestBook(id={self.request_id}, student={self.Student_Prn_id}, book={self.Books_Accession_number})>"
