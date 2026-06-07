"""Run once to create the admin user: python create_admin.py"""
from werkzeug.security import generate_password_hash
from app import create_app
from extensions import db
from models.user import User

app = create_app()

with app.app_context():
    existing = db.session.execute(db.select(User).filter_by(username='admin')).scalar_one_or_none()
    if existing:
        print('Admin user already exists.')
    else:
        user = User(
            username='admin',
            password_hash=generate_password_hash('mindquest2025'),
            role='admin',
        )
        db.session.add(user)
        db.session.commit()
        print('Admin user created.')
        print('  Username: admin')
        print('  Password: mindquest2025')
