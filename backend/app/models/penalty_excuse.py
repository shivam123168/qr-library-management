"""
Penalty Excuse Model - Excuse Reasons for Penalties
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class PenaltyExcuse(Base):
    """
    Penalty Excuse model for storing excuse/reason for waiving penalties
    (e.g., "Medical emergency", "Family emergency", etc.)
    """
    __tablename__ = "penalty_excuse"
    
    # Columns
    penalty_excuse_id = Column(Integer, primary_key=True, autoincrement=True)
    excuse = Column(String(255), nullable=False)
    
    # Relationships
    penalties = relationship("Penalty", back_populates="penalty_excuse")
    
    def __repr__(self):
        return f"<PenaltyExcuse(id={self.penalty_excuse_id}, excuse='{self.excuse[:30]}...')>"
