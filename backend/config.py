import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://user:password@localhost:5432/mindquest',
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    FLASK_ENV = os.getenv('FLASK_ENV', 'development')

    _origins = os.getenv('CORS_ORIGINS', 'http://localhost:5173')
    CORS_ORIGINS = [o.strip() for o in _origins.split(',')]

    KEYCLOAK_URL       = os.getenv('KEYCLOAK_URL',       'http://localhost:8180')
    KEYCLOAK_REALM     = os.getenv('KEYCLOAK_REALM',     'mindquest')
    KEYCLOAK_CLIENT_ID = os.getenv('KEYCLOAK_CLIENT_ID', 'dashboard-app')

