"""
Author Junction Model - Many-to-Many relationship between Books and Authors
"""

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuthorJunction(Base):
    """
    Junction table for many-to-many relationship between Books and Authors
    (One book can have multiple authors, one author can write multiple books)
    """
    __tablename__ = "author_junction"
    
    # Columns
    author_junction_id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign Keys
    Books_Accession_number = Column(Integer, ForeignKey('books.Accession_number'))
    Author_id = Column(Integer, ForeignKey('author.Author_id'))
    
    # Relationships
    # book = relationship("Book", back_populates="author_junctions")
    # author = relationship("Author", back_populates="author_junctions")
    
    def __repr__(self):
        return f"<AuthorJunction(id={self.author_junction_id}, book_id={self.Books_Accession_number}, author_id={self.Author_id})>"
