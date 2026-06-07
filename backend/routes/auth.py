"""
Keycloak-based admin guard.

Validates access tokens by verifying the JWT signature against Keycloak's
public JWKS (works with public SPA clients like dashboard-app).

Introspection is NOT used — public clients are rejected by Keycloak's
introspection endpoint ("Client not allowed").
"""

from functools import wraps

import jwt
from jwt import PyJWKClient
from flask import Blueprint, request, jsonify, g, current_app


def _jwks_url() -> str:
    base  = current_app.config['KEYCLOAK_URL'].rstrip('/')
    realm = current_app.config['KEYCLOAK_REALM']
    return f'{base}/realms/{realm}/protocol/openid-connect/certs'


def _jwk_client() -> PyJWKClient:
    cache_key = 'keycloak_jwk_client'
    client = current_app.extensions.get(cache_key)
    if client is None:
        client = PyJWKClient(_jwks_url())
        current_app.extensions[cache_key] = client
    return client


def _decode_token(token: str) -> dict:
    signing_key = _jwk_client().get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=['RS256'],
        options={'verify_aud': False},
    )


def _has_admin_role(claims: dict) -> bool:
    realm_roles = (claims.get('realm_access') or {}).get('roles', [])
    client_id   = current_app.config['KEYCLOAK_CLIENT_ID']
    client_roles = (
        (claims.get('resource_access') or {})
        .get(client_id, {})
        .get('roles', [])
    )
    all_roles = [r.lower() for r in realm_roles + client_roles]
    return 'admin' in all_roles


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'Missing or malformed Authorization header'}), 401

        token = auth.split(' ', 1)[1]
        try:
            claims = _decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError as exc:
            current_app.logger.error('JWT validation failed: %s', exc)
            return jsonify({'error': 'Token validation failed'}), 401
        except Exception as exc:
            current_app.logger.error('Keycloak JWKS fetch/decode failed: %s', exc)
            return jsonify({'error': 'Token validation failed'}), 401

        if not _has_admin_role(claims):
            return jsonify({'error': 'Insufficient permissions — admin role required'}), 403

        g.current_user = claims.get('preferred_username') or claims.get('sub', 'unknown')
        return f(*args, **kwargs)

    return decorated


auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/health', methods=['GET'])
def health():
    return jsonify({'ok': True})
