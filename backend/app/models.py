from . import db
from datetime import datetime

# ==========================================
# ASSOCIATION TABLES (Many-to-Many Links)
# ==========================================

# Links Users to the Items they "Fancy" (Favorite)
fancies = db.Table('fancies',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('item_id', db.Integer, db.ForeignKey('items.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

# Links Users to their Achievements (e.g., "The Rich Badge")
user_achievements = db.Table('user_achievements',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('achievement_id', db.Integer, db.ForeignKey('achievements.id'), primary_key=True),
    db.Column('earned_at', db.DateTime, default=datetime.utcnow)
)


# ==========================================
# CORE MODELS
# ==========================================

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    # Items this user wants (their wishlist)
    wishlist_items = db.relationship('Item', foreign_keys='Item.user_id', backref='owner', lazy=True)
    # Items this user has fancied/favorited
    fancied_items = db.relationship('Item', secondary=fancies, backref=db.backref('fancied_by', lazy='dynamic'))
    # Badges this user has earned
    achievements = db.relationship('Achievement', secondary=user_achievements, backref=db.backref('users', lazy='dynamic'))


class Follow(db.Model):
    __tablename__ = 'follows'
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    followed_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Item(db.Model):
    __tablename__ = 'items'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    url = db.Column(db.String(500), nullable=True)
    price = db.Column(db.Float, nullable=True)
    
    # "musts", "can't go wrong", "i love"
    category = db.Column(db.String(50), nullable=False, default="musts")
    
    # Ownership (Whose wishlist is this on?)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Purchasing Logic (Who bought this for them?)
    is_purchased = db.Column(db.Boolean, default=False)
    purchased_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to see who bought it
    purchaser = db.relationship('User', foreign_keys=[purchased_by_id])


class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)


# ==========================================
# GAMIFICATION & EVENTS
# ==========================================

class Achievement(db.Model):
    __tablename__ = 'achievements'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True) # e.g., "I'm Rich", "First Gift"
    description = db.Column(db.String(250), nullable=False)
    icon_url = db.Column(db.String(500), nullable=True)


class EventGroup(db.Model):
    __tablename__ = 'event_groups'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False) # e.g., "Office Secret Santa 2026"
    description = db.Column(db.Text, nullable=True)
    budget_limit = db.Column(db.Float, nullable=True)
    draw_date = db.Column(db.DateTime, nullable=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)


class EventAssignment(db.Model):
    __tablename__ = 'event_assignments'
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event_groups.id'), nullable=False)
    giver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)