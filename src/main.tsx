import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ClientProtectionProvider } from './components/security/ClientProtectionProvider.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClientProtectionProvider>
      <App />
    </ClientProtectionProvider>
  </StrictMode>,
);
