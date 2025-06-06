import React from 'react';
import { formatCurrency } from '../utils/mortgageCalculations';
import type { CalculationResult } from '../utils/mortgageCalculations';

interface SummaryPanelProps {
  result: CalculationResult;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ result }) => {
  const {
    totalInterest,
    totalInterestWithoutOverpayment,
    interestSaved,
    actualTermMonths,
    originalTermMonths,
    monthlySchedule
  } = result;

  const monthsSaved = originalTermMonths - actualTermMonths;
  const yearsSaved = Math.floor(monthsSaved / 12);
  const remainingMonthsSaved = monthsSaved % 12;

  const totalPaidWithOverpayments = monthlySchedule.reduce((sum, payment) => sum + payment.totalPayment, 0);
  const totalOverpayments = monthlySchedule.reduce((sum, payment) => sum + payment.overpayment, 0);

  return (
    <div className="summary-panel">
      <h3>Podsumowanie</h3>
      
      <div className="summary-grid">
        <div className="summary-card savings">
          <h4>Oszczędności</h4>
          <div className="summary-item highlight">
            <span className="label">Zaoszczędzone odsetki:</span>
            <span className="value">{formatCurrency(interestSaved)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Skrócenie okresu:</span>
            <span className="value">
              {yearsSaved > 0 && `${yearsSaved} lat `}
              {remainingMonthsSaved > 0 && `${remainingMonthsSaved} miesięcy`}
              {monthsSaved === 0 && '0 miesięcy'}
            </span>
          </div>
        </div>

        <div className="summary-card payments">
          <h4>Spłaty</h4>
          <div className="summary-item">
            <span className="label">Łączne nadpłaty:</span>
            <span className="value">{formatCurrency(totalOverpayments)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Całkowita kwota spłacona:</span>
            <span className="value">{formatCurrency(totalPaidWithOverpayments)}</span>
          </div>
        </div>

        <div className="summary-card interest">
          <h4>Odsetki</h4>
          <div className="summary-item">
            <span className="label">Odsetki bez nadpłat:</span>
            <span className="value">{formatCurrency(totalInterestWithoutOverpayment)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Odsetki z nadpłatami:</span>
            <span className="value">{formatCurrency(totalInterest)}</span>
          </div>
        </div>

        <div className="summary-card term">
          <h4>Okres kredytowania</h4>
          <div className="summary-item">
            <span className="label">Pierwotny okres:</span>
            <span className="value">{Math.floor(originalTermMonths / 12)} lat {originalTermMonths % 12} miesięcy</span>
          </div>
          <div className="summary-item">
            <span className="label">Rzeczywisty okres:</span>
            <span className="value">{Math.floor(actualTermMonths / 12)} lat {actualTermMonths % 12} miesięcy</span>
          </div>
        </div>
      </div>

      <div className="summary-highlight">
        <p>
          <strong>Wniosek:</strong> Dzięki nadpłatom zaoszczędzisz{' '}
          <span className="highlight-amount">{formatCurrency(interestSaved)}</span> na odsetkach
          {monthsSaved > 0 && (
            <span>
              {' '}i skrócisz okres spłaty o{' '}
              {yearsSaved > 0 && `${yearsSaved} lat `}
              {remainingMonthsSaved > 0 && `${remainingMonthsSaved} miesięcy`}
            </span>
          )}
          .
        </p>
      </div>
    </div>
  );
};