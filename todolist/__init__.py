from flask import Flask
import os
from dotenv import load_dotenv
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask import current_app
from datetime import timedelta
from sqlalchemy import text



load_dotenv()
SECRET_KEY = os.environ.get("KEY")
DB_NAME = os.environ.get("DB_NAME")

db = SQLAlchemy()
mail = Mail()

def create_database(app):
    if not os.path.exists("todolist/" + DB_NAME):
        with app.app_context():
            db.create_all()
            print("Created Database!")

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_NAME}"
    
    # Session configuration for OAuth
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
    
    # Email configuration
    app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", 587))
    app.config["MAIL_USE_TLS"] = os.environ.get("MAIL_USE_TLS", "true").lower() in ["true", "on", "1"]
    app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME")
    app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD")
    app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_USERNAME", "noreply@todolist.com")

    db.init_app(app)
    mail.init_app(app)
    
    from .views import views
    from .user import user
    from .models import User, Task, PasswordResetToken
    from .admin import admin
    from .oauth_routes import oauth_bp
 
    create_database(app)
    with app.app_context():
        db.create_all()
        # Ensure new columns exist for existing SQLite DBs (simple auto-migration)
        try:
            cols = db.session.execute(text("PRAGMA table_info(user)")).fetchall()
            col_names = {c[1] for c in cols}
            
            # Add is_admin column if not exists
            if "is_admin" not in col_names:
                db.session.execute(text("ALTER TABLE user ADD COLUMN is_admin BOOLEAN DEFAULT 0"))
                db.session.commit()
            
            # Add OAuth2 columns if not exist
            if "provider" not in col_names:
                db.session.execute(text("ALTER TABLE user ADD COLUMN provider VARCHAR(50)"))
                db.session.commit()
            
            if "provider_id" not in col_names:
                db.session.execute(text("ALTER TABLE user ADD COLUMN provider_id VARCHAR(100)"))
                db.session.commit()
            
            if "avatar_url" not in col_names:
                db.session.execute(text("ALTER TABLE user ADD COLUMN avatar_url VARCHAR(500)"))
                db.session.commit()
                
        except Exception as e:
            print(f"Migration error: {e}")
            db.session.rollback()
        # Seed default admin account if not exists
        from werkzeug.security import generate_password_hash
        admin_email = "admin@gmail.com"
        existing_admin = User.query.filter_by(email=admin_email).first()
        if existing_admin is None:
            admin_user = User(
                email=admin_email,
                password=generate_password_hash("admin123"),
                user_name="admin",
                is_admin=True,
            )
            db.session.add(admin_user)
            db.session.commit()
    
    app.register_blueprint(user)
    app.register_blueprint(views)
    app.register_blueprint(admin)
    app.register_blueprint(oauth_bp)

    login_manager = LoginManager()
    login_manager.login_view = "user.login"
    login_manager.login_message = "Vui lòng đăng nhập để truy cập trang này."
    login_manager.init_app(app)
    
    app.permanent_session_lifetime = timedelta(minutes=1)

    from .oauth_config import oauth, register_google
    oauth.init_app(app)
    register_google(app)
    
    @login_manager.user_loader
    def load_user(id):
        return User.query.get(int(id))
    return app  