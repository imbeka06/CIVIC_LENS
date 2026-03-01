from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Float

# DO NOT import Base from app.models here. 
# You DEFINE it here instead.
Base = declarative_base()

class Donor(Base):
    __tablename__ = "donors"
    
    # Ensure you have your primary key set to avoid the previous error
    id = Column(Integer, primary_key=True, index=True)
    donor_name = Column(String)
    # ... rest of your columns