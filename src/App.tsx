import { LoanForm } from './components/LoanForm';
import { PaymentSchedule } from './components/PaymentSchedule';
import { SummaryPanel } from './components/SummaryPanel';
import { Charts } from './components/Charts';
import { CookieConsentWrapper } from './components/CookieConsent';
import { useMortgageCalculation } from './application/hooks/useMortgageCalculation';
import { trackMortgageCalculation, hasAnalyticsConsent, initGA } from './utils/analytics';
import { useEffect } from 'react';
import './App.css';

function App() {
  const {
    loanData,
    overpaymentData,
    isCalculating,
    isReady,
    validationErrors,
    updateLoanData,
    updateOverpaymentData,
    updateCustomOverpayment,
    getLegacyResult
  } = useMortgageCalculation();

  // Get legacy format for backward compatibility with existing components
  const legacyResult = getLegacyResult();

  const handleStartDateChange = (date: Date) => {
    updateLoanData({ startDate: date });
  };

  // Initialize GA if user has already given consent
  useEffect(() => {
    if (hasAnalyticsConsent()) {
      initGA();
    }
  }, []);

  // Track calculations when they're completed
  useEffect(() => {
    if (isReady && legacyResult && hasAnalyticsConsent()) {
      trackMortgageCalculation({
        loanAmount: loanData.amount,
        interestRate: loanData.interestRate,
        termMonths: loanData.termMonths,
        paymentType: loanData.paymentType,
        hasOverpayment: overpaymentData.baseAmount > 0
      });
    }
  }, [isReady, legacyResult, loanData, overpaymentData]);

  return (
    <CookieConsentWrapper>
      <div className="app">
        <header className="app-header">
          <h1>Kalkulator Nadpłat Kredytu Hipotecznego</h1>
          <p>Sprawdź ile możesz zaoszczędzić dzięki nadpłatom kredytu</p>
        </header>

      <main className="app-main">
        <div className="calculator-container">
          <div className="input-section">
            <LoanForm
              loanData={{
                amount: loanData.amount,
                interestRate: loanData.interestRate,
                termMonths: loanData.termMonths,
                paymentType: loanData.paymentType
              }}
              overpaymentSettings={{
                baseAmount: overpaymentData.baseAmount,
                effect: overpaymentData.effect
              }}
              startDate={loanData.startDate}
              onLoanDataChange={(data) => updateLoanData(data)}
              onOverpaymentSettingsChange={(settings) => updateOverpaymentData(settings)}
              onStartDateChange={handleStartDateChange}
            />
            
            {/* Show validation errors */}
            {validationErrors.length > 0 && (
              <div className="validation-errors">
                {validationErrors.map((error, index) => (
                  <p key={index} className="error-message">{error}</p>
                ))}
              </div>
            )}
            
            {/* Show loading state */}
            {isCalculating && (
              <div className="calculating-indicator">
                <p>Obliczanie...</p>
              </div>
            )}
          </div>

          {isReady && legacyResult && legacyResult.monthlySchedule.length > 0 && (
            <>
              <div className="summary-section">
                <SummaryPanel result={legacyResult} />
              </div>

              <div className="charts-section">
                <Charts result={legacyResult} />
              </div>

              <div className="schedule-section">
                <PaymentSchedule
                  schedule={legacyResult.monthlySchedule}
                  baseOverpayment={overpaymentData.baseAmount}
                  onOverpaymentChange={updateCustomOverpayment}
                />
              </div>
            </>
          )}

          {legacyResult && legacyResult.monthlySchedule.length === 0 && (
            <div className="charts-section">
              <Charts result={legacyResult} />
            </div>
          )}
        </div>
      </main>

        <footer className="app-footer">
          <p>Uwaga: Kalkulator służy jedynie do celów orientacyjnych. Rzeczywiste warunki kredytu mogą się różnić.</p>
        </footer>
      </div>
    </CookieConsentWrapper>
  );
}

export default App;
