import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url:      import.meta.env.VITE_KEYCLOAK_URL      ?? 'http://localhost:8180',
  realm:    import.meta.env.VITE_KEYCLOAK_REALM    ?? 'mindquest',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'dashboard-app',
});

/** Must match a Valid post logout redirect URI on the Keycloak client. */
export const getLogoutRedirectUri = () => window.location.origin;

/**
 * End the Keycloak SSO session and return to the dashboard origin.
 * Falls back to a hard reload if the adapter logout call fails.
 */
export async function logout(): Promise<void> {
  const redirectUri = getLogoutRedirectUri();

  if (!keycloak.authenticated) {
    window.location.replace(redirectUri);
    return;
  }

  try {
    await keycloak.logout({ redirectUri });
  } catch (err) {
    console.error('Keycloak logout failed, forcing local sign-out:', err);
    keycloak.clearToken();
    window.location.replace(redirectUri);
  }
}

export default keycloak;
