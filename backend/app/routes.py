from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from . import db
from .models import User, Item

# Create a Blueprint to organize our routes
api = Blueprint('api', __name__)

# ==========================================
# USER ROUTES
# ==========================================

@api.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    
    # Check if user already exists
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({"error": "Email already registered"}), 400
        
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({"error": "Username already taken"}), 400

    # Create new user and hash the password for security
    hashed_password = generate_password_hash(data.get('password'))
    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        password_hash=hashed_password
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "message": "User created successfully!",
        "user": {"id": new_user.id, "username": new_user.username}
    }), 201


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