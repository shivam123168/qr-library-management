"""
Penalty Amount Model - Fine Amount Configuration
"""

from sqlalchemy import Column, Integer, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class PenaltyAmount(Base):
    """
    Penalty Amount model for storing different fine amounts
    """
    __tablename__ = "penalty_amount"
    
    # Columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    penalty_amount = Column(Float, nullable=False)
    
    # Relationships
    penalties = relationship("Penalty", back_populates="penalty_amount_rel",)
    
    def __repr__(self):
        return f"<PenaltyAmount(id={self.id}, amount={self.penalty_amount})>"
