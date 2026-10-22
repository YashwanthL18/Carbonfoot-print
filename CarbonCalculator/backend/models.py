from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize the database object
db = SQLAlchemy()

class FootprintRecord(db.Model):
    """
    Stores a single carbon footprint calculation.
    """
    id = db.Column(db.Integer, primary_key=True)
    
    # In a real app, this would link to a User
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Footprint breakdown
    travel_footprint = db.Column(db.Float, nullable=False)
    energy_footprint = db.Column(db.Float, nullable=False)
    food_footprint = db.Column(db.Float, nullable=False)
    total_footprint = db.Column(db.Float, nullable=False)
    
    # Recommendations given
    recommendations = db.Column(db.Text, nullable=True) # Store tips as a JSON string
    
    # Timestamp
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        """Serializes the object to a dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "travel_footprint": self.travel_footprint,
            "energy_footprint": self.energy_footprint,
            "food_footprint": self.food_footprint,
            "total_footprint": self.total_footprint,
            "recommendations": self.recommendations,
            "created_at": self.created_at.isoformat()
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat()
        }