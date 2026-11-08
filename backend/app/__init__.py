from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Initialize the database object
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Allow React to communicate with Flask
    CORS(app)
    
    # Configure SQLite database (this will create an app.db file in your instance folder)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Link the app to the database
    db.init_app(app)
    
    with app.app_context():
        # Import routes and models here to avoid circular imports
        from . import models
        from .routes import api
        
        # Register the blueprint
        app.register_blueprint(api)
        
        # Create the tables in the database
        db.create_all()
        
    return app