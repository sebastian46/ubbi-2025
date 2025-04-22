from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import logging
from logging.handlers import RotatingFileHandler

# Initialize SQLAlchemy
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Configure CORS more explicitly
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    
    # Configure SQLite database
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///festival.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # Setup logging
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/backend.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Backend startup')
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    from app.routes import api
    app.register_blueprint(api)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app 