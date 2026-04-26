"""
Day Limit Book Model - Book Loan Period Configuration
"""

from sqlalchemy import Column, Integer
from app.core.database import Base


class DayLimitBook(Base):
    """
    Configuration table for book loan period
    Stores how many days a book can be borrowed
    """
    __tablename__ = "day_limit_book"
    
    # Columns
    day_id = Column(Integer, primary_key=True, autoincrement=True)
    days_limit = Column(Integer, nullable=False)
    
    def __repr__(self):
        return f"<DayLimitBook(id={self.day_id}, days={self.days_limit})>"
