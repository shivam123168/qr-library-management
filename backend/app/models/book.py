"""
Book Model - Library Book Catalog
"""

from sqlalchemy import Column, Integer, String, Float, TIMESTAMP, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Book(Base):
    """
    Book model representing books in the library catalog
    """
    __tablename__ = "books"
    
    # Columns
    Accession_number = Column(Integer, primary_key=True)
    Title = Column(String(45), nullable=False)
    total_pages = Column(Integer, nullable=False)
    Total_Copy = Column(Integer, nullable=False)
    Copy_Number = Column(Integer, nullable=False)
    Book_Cost = Column(Float, nullable=False)
    Publisher_place = Column(String(45), nullable=False)
    book_upload_time = Column(TIMESTAMP, nullable=False)
    Status = Column(
        Enum('Available', 'Issued'),
        nullable=False
    )
    rack_location = Column(String(45), nullable=False)
    self_location = Column(String(45), nullable=False)
    
    # Foreign Keys
    publisher_id = Column(Integer, ForeignKey('publishers.publisher_id'))
    
    # Relationships
    publisher = relationship("Publisher", back_populates="books")
    # author_junctions = relationship("AuthorJunction", back_populates="book",cascade="all, delete-orphan")
    issue_records = relationship("IssueBook", back_populates="book")
    requests = relationship("RequestBook", back_populates="book")
    authors = relationship("Author",secondary="author_junction",back_populates="books")
    @property
    def author_names(self):
         return [author.Author_name for author in self.authors]

    def __repr__(self):
        return f"<Book(Acc_no={self.Accession_number}, title='{self.Title}', status='{self.Status}')>"
