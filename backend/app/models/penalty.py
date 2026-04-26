"""
Penalty Model - Fine/Penalty Tracking
"""

from sqlalchemy import Column, Integer, Enum, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from app.core.database import Base


class Penalty(Base):
    """
    Penalty model for tracking fines/penalties for late book returns
    """
    __tablename__ = "penalty"
    
    # Columns
    penalty_id = Column(Integer, primary_key=True, autoincrement=True)
    Amount_status = Column(
        Enum('paid', 'not paid', 'no penalty'),
        nullable=False
    )
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    
    # Foreign Keys
    penalty_excuse_id = Column(Integer, ForeignKey('penalty_excuse.penalty_excuse_id'))
    issue_book_id = Column(Integer, ForeignKey('issue_book.issue_book_id'), nullable=False)
    penalty_amount_id = Column(Integer, ForeignKey('penalty_amount.id'), nullable=False)
    
    # Relationships
    penalty_excuse = relationship("PenaltyExcuse", back_populates="penalties")
    issue_book = relationship("IssueBook", back_populates="penalties")
    penalty_amount_rel = relationship("PenaltyAmount", back_populates="penalties")
    
    def __repr__(self):
        return f"<Penalty(id={self.penalty_id}, status='{self.Amount_status}')>"
