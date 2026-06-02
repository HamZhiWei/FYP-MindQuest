import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://user:password@localhost:5432/mindquest',
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-change-in-production')

    FLASK_ENV = os.getenv('FLASK_ENV', 'development')

    _origins = os.getenv('CORS_ORIGINS', 'http://localhost:5173')
    CORS_ORIGINS = [o.strip() for o in _origins.split(',')]
