"""
Author Model - Book Authors
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Author(Base):
    """
    Author model representing book authors
    """
    __tablename__ = "author"
    
    # Columns
    Author_id = Column(Integer, primary_key=True, autoincrement=True)
    Author_name = Column(String(45), nullable=False, unique=True)
    
    # Relationships (many-to-many with Books through author_junction)
    books = relationship(
        "Book",
        secondary="author_junction",
        back_populates="authors"
    )


    def __repr__(self):
        return f"<Author(id={self.Author_id}, name='{self.Author_name}')>"
