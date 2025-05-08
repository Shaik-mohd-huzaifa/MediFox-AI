from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from .config import Config

# Initialize SQLAlchemy
db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    
    # Register main API blueprints
    from .routes import main_bp
    app.register_blueprint(main_bp)
    
    # Register AI symptom assessment blueprints
    from .ai.routes import ai_bp
    app.register_blueprint(ai_bp)
    
    # Register document management blueprints
    from .ai.document_routes import documents_bp
    app.register_blueprint(documents_bp)
    
    # Register appointments blueprints
    from .appointments.routes import appointments_bp
    app.register_blueprint(appointments_bp)
    
    @app.route('/health')
    def health_check():
        """Simple health check endpoint."""
        return {'status': 'healthy'}
    
    return app
