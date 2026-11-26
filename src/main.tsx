import { installStaticCdnApiGuard } from './utils/apiAvailability.ts';
import { installChunkLoadErrorRecovery } from './utils/runtimeRecovery.ts';

installStaticCdnApiGuard();
installChunkLoadErrorRecovery();

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ClientProtectionProvider } from './components/security/ClientProtectionProvider.tsx';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ClientProtectionProvider>
        <App />
      </ClientProtectionProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);


