import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { OnboardingProvider } from './contexts/OnboardingContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <OnboardingProvider>
        <App />
      </OnboardingProvider>
    </CurrencyProvider>
  </StrictMode>
);
