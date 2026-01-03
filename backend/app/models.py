from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    RIDER = "rider"
    DRIVER = "driver"
    ADMIN = "admin"

class RideStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class VehicleType(str, enum.Enum):
    ECONOMY = "economy"
    SUV = "suv"
    LUXURY = "luxury"
    PREMIUM = "premium"
    PREMIUM_UC = "PREMIUM"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.RIDER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    profile_picture = Column(String, nullable=True)
    wallet_balance = Column(Float, default=0.0)
    address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    otp_code = Column(String, nullable=True)
    otp_expiry = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    rides_as_rider = relationship("Ride", back_populates="rider", foreign_keys="Ride.rider_id")
    rides_as_driver = relationship("Ride", back_populates="driver", foreign_keys="Ride.driver_id")
    driver_profile = relationship("DriverProfile", back_populates="user", uselist=False)
    vacations = relationship("Vacation", back_populates="user", foreign_keys="Vacation.user_id")
    vacations = relationship("Vacation", back_populates="user", foreign_keys="Vacation.user_id")
    loyalty_points = relationship("LoyaltyPoints", back_populates="user", uselist=False)
    transactions = relationship("Transaction", back_populates="user")

class DriverProfile(Base):
    __tablename__ = "driver_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    license_number = Column(String, unique=True, nullable=False)
    aadhar_card_number = Column(String, unique=True, nullable=True)
    vehicle_type = Column(Enum(VehicleType), default=VehicleType.ECONOMY)
    vehicle_model = Column(String, nullable=True)
    vehicle_plate = Column(String, nullable=True)
    vehicle_color = Column(String, nullable=True)
    city = Column(String, nullable=True)
    rating = Column(Float, default=5.0)
    total_rides = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="driver_profile")

class Ride(Base):
    __tablename__ = "rides"
    
    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    vacation_id = Column(Integer, ForeignKey("vacations.id"), nullable=True)
    pickup_address = Column(String, nullable=False)
    pickup_lat = Column(Float, nullable=False)
    pickup_lng = Column(Float, nullable=False)
    destination_address = Column(String, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    status = Column(Enum(RideStatus), default=RideStatus.PENDING)
    vehicle_type = Column(Enum(VehicleType), default=VehicleType.ECONOMY)
    distance_km = Column(Float, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    estimated_fare = Column(Float, nullable=True)
    final_fare = Column(Float, nullable=True)
    rating = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    scheduled_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    rider = relationship("User", back_populates="rides_as_rider", foreign_keys=[rider_id])
    driver = relationship("User", back_populates="rides_as_driver", foreign_keys=[driver_id])
    vacation = relationship("Vacation", back_populates="rides")

class City(Base):
    __tablename__ = "cities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    state = Column(String, nullable=True)
    country = Column(String, default="India")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    origin_rides = relationship("IntercityRide", back_populates="origin_city", foreign_keys="IntercityRide.origin_city_id")
    destination_rides = relationship("IntercityRide", back_populates="destination_city", foreign_keys="IntercityRide.destination_city_id")

class IntercityRide(Base):
    __tablename__ = "intercity_rides"
    
    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    origin_city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    destination_city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    pickup_address = Column(String, nullable=False)
    dropoff_address = Column(String, nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(RideStatus), default=RideStatus.PENDING)
    vehicle_type = Column(Enum(VehicleType), default=VehicleType.ECONOMY)
    distance_km = Column(Float, nullable=True)
    estimated_duration_hours = Column(Float, nullable=True)
    price = Column(Float, nullable=False)
    passengers = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    origin_city = relationship("City", back_populates="origin_rides", foreign_keys=[origin_city_id])
    destination_city = relationship("City", back_populates="destination_rides", foreign_keys=[destination_city_id])

class Vacation(Base):
    __tablename__ = "vacations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    destination = Column(String, nullable=False)
    hotel_name = Column(String, nullable=True)
    hotel_address = Column(String, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    total_price = Column(Float, nullable=False)
    ride_included = Column(Boolean, default=True)
    hotel_included = Column(Boolean, default=True)
    is_fixed_package = Column(Boolean, default=False)
    vehicle_type = Column(Enum(VehicleType), default=VehicleType.ECONOMY)
    passengers = Column(Integer, default=1)
    status = Column(String, default="pending")
    booking_reference = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # New fields for automated schedule-based trip planner
    schedule = Column(Text, nullable=True)  # JSON string containing the full trip schedule
    flight_details = Column(Text, nullable=True)  # JSON string containing flight/train details
    activities = Column(Text, nullable=True)  # JSON string containing activities schedule
    meal_preferences = Column(Text, nullable=True)  # JSON string containing meal timings
    
    # Relationships
    user = relationship("User", back_populates="vacations", foreign_keys=[user_id])
    driver = relationship("User", foreign_keys=[driver_id])
    rides = relationship("Ride", back_populates="vacation")

    @property
    def completed_rides_count(self):
        return sum(1 for ride in self.rides if ride.status == RideStatus.COMPLETED)

    @property
    def has_active_ride(self):
        return any(ride.status in [RideStatus.PENDING, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS] for ride in self.rides)

class LoyaltyPoints(Base):
    __tablename__ = "loyalty_points"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    total_points = Column(Integer, default=0)
    tier = Column(String, default="bronze")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="loyalty_points")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # "credit" or "debit"
    description = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="transactions")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    ride = relationship("Ride")

class SavedCard(Base):
    __tablename__ = "saved_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    last4 = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    expiry_month = Column(String, nullable=False)
    expiry_year = Column(String, nullable=False)
    holder_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="saved_cards")

# Update User model to include relationship
User.saved_cards = relationship("SavedCard", back_populates="user", cascade="all, delete-orphan")
