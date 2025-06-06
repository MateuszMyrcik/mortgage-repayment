import React from 'react';
import type { LoanData, OverpaymentSettings } from '../utils/mortgageCalculations';

interface LoanFormProps {
  loanData: LoanData;
  overpaymentSettings: OverpaymentSettings;
  startDate: Date;
  onLoanDataChange: (data: LoanData) => void;
  onOverpaymentSettingsChange: (settings: OverpaymentSettings) => void;
  onStartDateChange: (date: Date) => void;
}

export const LoanForm: React.FC<LoanFormProps> = ({
  loanData,
  overpaymentSettings,
  startDate,
  onLoanDataChange,
  onOverpaymentSettingsChange,
  onStartDateChange
}) => {
  const handleLoanChange = (field: keyof LoanData, value: string | number) => {
    let processedValue = value;
    if (typeof value === 'string' && field !== 'paymentType') {
      // Handle empty string to avoid leading zeros
      if (value === '') {
        processedValue = 0;
      } else {
        processedValue = parseFloat(value) || 0;
      }
    }
    onLoanDataChange({
      ...loanData,
      [field]: processedValue
    });
  };

  const handleOverpaymentChange = (field: keyof OverpaymentSettings, value: string | number) => {
    let processedValue = value;
    if (typeof value === 'string' && field !== 'effect') {
      // Handle empty string to avoid leading zeros
      if (value === '') {
        processedValue = 0;
      } else {
        processedValue = parseFloat(value) || 0;
      }
    }
    onOverpaymentSettingsChange({
      ...overpaymentSettings,
      [field]: processedValue
    });
  };

  const handleStartDateChange = (value: string) => {
    const newDate = new Date(value);
    newDate.setDate(1); // Always set to first day of month
    onStartDateChange(newDate);
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  return (
    <div className="loan-form">
      <h2>Parametry kredytu</h2>
      
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="amount">Kwota kredytu (PLN):</label>
          <input
            type="number"
            id="amount"
            value={loanData.amount || ''}
            onChange={(e) => handleLoanChange('amount', e.target.value)}
            min="0"
            step="1000"
            placeholder="np. 500000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="interestRate">Oprocentowanie (%):</label>
          <input
            type="number"
            id="interestRate"
            value={loanData.interestRate || ''}
            onChange={(e) => handleLoanChange('interestRate', e.target.value)}
            min="0"
            max="20"
            step="0.1"
            placeholder="np. 5.5"
          />
        </div>

        <div className="form-group">
          <label htmlFor="termMonths">Okres kredytowania (miesiące):</label>
          <input
            type="number"
            id="termMonths"
            value={loanData.termMonths || ''}
            onChange={(e) => handleLoanChange('termMonths', e.target.value)}
            min="1"
            max="480"
            step="1"
            placeholder="np. 360 (30 lat)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="paymentType">Typ spłaty:</label>
          <select
            id="paymentType"
            value={loanData.paymentType}
            onChange={(e) => handleLoanChange('paymentType', e.target.value as 'equal' | 'decreasing')}
          >
            <option value="equal">Raty równe</option>
            <option value="decreasing">Raty malejące</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Data rozpoczęcia spłat:</label>
          <input
            type="month"
            id="startDate"
            value={formatDateForInput(startDate)}
            onChange={(e) => handleStartDateChange(e.target.value)}
          />
        </div>
      </div>

      <h3>Ustawienia nadpłat</h3>
      
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="baseAmount">Kwota nadpłaty cyklicznej (PLN):</label>
          <input
            type="number"
            id="baseAmount"
            value={overpaymentSettings.baseAmount || ''}
            onChange={(e) => handleOverpaymentChange('baseAmount', e.target.value)}
            min="0"
            step="100"
            placeholder="np. 1000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="effect">Efekt nadpłaty:</label>
          <select
            id="effect"
            value={overpaymentSettings.effect}
            onChange={(e) => handleOverpaymentChange('effect', e.target.value as 'shorten_term' | 'reduce_payment')}
          >
            <option value="shorten_term">Skrócenie okresu kredytowania</option>
            <option value="reduce_payment">Zmniejszenie wysokości rat</option>
          </select>
        </div>
      </div>
    </div>
  );
};