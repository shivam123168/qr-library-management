"""
Issue Book Model - Book Issue and Return Tracking
"""

from sqlalchemy import Column, Integer, TIMESTAMP, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class IssueBook(Base):
    """
    Issue Book model for tracking book issues and returns
    Records when a book is issued to a student and when it's returned
    """
    __tablename__ = "issue_book"
    
    # Columns
    issue_book_id = Column(Integer, primary_key=True, autoincrement=True)
    issue_time = Column(TIMESTAMP, nullable=False)
    due_date = Column(DateTime, nullable=False)
    returned_date = Column(DateTime, nullable=True)
    status = Column(
        Enum("Issued", "Returned", "Overdue"),
        nullable=True
    )
    
    # Foreign Keys
    Student_Prn_id = Column(Integer, ForeignKey('Students.Prn_id'))
    Books_Accession_number = Column(Integer, ForeignKey('books.Accession_number'))
    Employee_Emp_Id = Column(Integer, ForeignKey('Employees.Emp_Id'))
    
    # Relationships
    student = relationship("Student", back_populates="issued_books")
    book = relationship("Book", back_populates="issue_records")
    employee = relationship("Employee", back_populates="issued_books")
    penalties = relationship("Penalty", back_populates="issue_book")
    
    def __repr__(self):
        return f"<IssueBook(id={self.issue_book_id}, student={self.Student_Prn_id}, book={self.Books_Accession_number}, status='{self.status}')>"
