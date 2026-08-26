import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ProductIdProvider } from './contexts/ProductIdContext';
import { CxProvider } from './contexts/CxContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { DateFilterProvider } from './contexts/DateFilterContext';
import { AccountSpecificsProvider } from './contexts/AccountSpecificsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <ProductIdProvider>
       <CxProvider>
        <DateFilterProvider>
          <AccountSpecificsProvider>
            <OnboardingProvider>
              <App />
            </OnboardingProvider>
          </AccountSpecificsProvider>
        </DateFilterProvider>
       </CxProvider>
      </ProductIdProvider>
    </CurrencyProvider>
  </StrictMode>
);
