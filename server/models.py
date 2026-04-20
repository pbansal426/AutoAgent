from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    vehicles = relationship("Vehicle", back_populates="owner")

    def verify_password(self, plain_password):
        return pwd_context.verify(plain_password, self.hashed_password)
    
    @staticmethod
    def get_password_hash(password):
        return pwd_context.hash(password)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    make = Column(String)
    model = Column(String)
    year = Column(Integer)
    vin = Column(String, unique=True, index=True)
    submodel = Column(String, nullable=True)
    powertrain = Column(String, nullable=True)
    # New fields for NHTSA-sourced specs
    body_class = Column(String, nullable=True)
    engine_cylinders = Column(String, nullable=True)
    fuel_type = Column(String, nullable=True)
    drive_type = Column(String, nullable=True)
    displacement = Column(String, nullable=True)
    engine_hp = Column(String, nullable=True)
    # Custom fallback fields
    color = Column(String, nullable=True)
    color_name = Column(String, nullable=True)
    packages = Column(Text, nullable=True)

    owner = relationship("User", back_populates="vehicles")
