from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from . import db
from .models import User, Item

# Create a Blueprint to organize our routes
api = Blueprint('api', __name__)

# ==========================================
# USER ROUTES
# ==========================================

@api.route('/register', methods=['POST'])
def register_user():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 400

    # Create new user and hash the password for security
    hashed_password = generate_password_hash(password)
    new_user = User(
        username=username,
        email=email,
        password_hash=hashed_password
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "message": "User created successfully!",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email
        }
    }), 201


@api.route('/login', methods=['POST'])
def login_user():
    data = request.get_json() or {}
    identifier = (data.get('username') or data.get('email') or '').strip()
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({"error": "Username/email and password are required"}), 400

    # Find user by username or email
    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "message": "Login successful!",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200


# ==========================================
# WISHLIST (ITEM) ROUTES
# ==========================================

@api.route('/items', methods=['POST'])
def add_item():
    data = request.get_json()
    
    user_id = data.get('user_id')
    
    new_item = Item(
        title=data.get('title'),
        description=data.get('description', ''),
        url=data.get('url', ''),
        price=data.get('price'),
        category=data.get('category', 'musts'),
        user_id=user_id
    )
    
    db.session.add(new_item)
    db.session.commit()
    
    return jsonify({"message": "Item added to wishlist!", "item_id": new_item.id}), 201


@api.route('/users/<int:user_id>/wishlist', methods=['GET'])
def get_user_wishlist(user_id):
    user = User.query.get_or_404(user_id)
    
    items = Item.query.filter_by(user_id=user_id).all()
    
    items_list = []
    for item in items:
        items_list.append({
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "url": item.url,
            "price": item.price,
            "category": item.category,
            "is_purchased": item.is_purchased
        })
        
    return jsonify({
        "username": user.username,
        "wishlist": items_list
    }), 200
