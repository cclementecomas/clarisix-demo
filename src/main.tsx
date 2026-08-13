import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ProductIdProvider } from './contexts/ProductIdContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { DateFilterProvider } from './contexts/DateFilterContext';
import { AccountSpecificsProvider } from './contexts/AccountSpecificsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <ProductIdProvider>
        <DateFilterProvider>
          <AccountSpecificsProvider>
            <OnboardingProvider>
              <App />
            </OnboardingProvider>
          </AccountSpecificsProvider>
        </DateFilterProvider>
      </ProductIdProvider>
    </CurrencyProvider>
  </StrictMode>
);
