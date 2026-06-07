import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import keycloak, { logout } from './keycloak';
import App from './App';

keycloak
  .init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    scope: 'openid',
  })
  .then((authenticated) => {
    if (!authenticated) {
      keycloak.login();
      return;
    }

    setInterval(() => {
      keycloak.updateToken(60).catch(() => { void logout(); });
    }, 60_000);

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((err) => {
    console.error('Keycloak initialisation failed:', err);
  });
