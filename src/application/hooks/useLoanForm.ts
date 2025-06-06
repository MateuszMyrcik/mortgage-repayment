import { useCallback } from 'react';
import { LoanInputData } from '../services/MortgageApplicationService';
import { PaymentType } from '../../domain/entities/Loan';

export interface LoanFormData {
  amount: string;
  interestRate: string;
  termMonths: string;
  paymentType: PaymentType;
  startDate: string;
}

/**
 * Custom hook for loan form state management
 * Handles form validation and data transformation
 */
export function useLoanForm(
  loanData: LoanInputData,
  onLoanDataChange: (data: LoanInputData) => void,
  onStartDateChange: (date: Date) => void
) {
  
  // Convert domain data to form data
  const formData: LoanFormData = {
    amount: loanData.amount > 0 ? loanData.amount.toString() : '',
    interestRate: loanData.interestRate > 0 ? loanData.interestRate.toString() : '',
    termMonths: loanData.termMonths > 0 ? loanData.termMonths.toString() : '',
    paymentType: loanData.paymentType,
    startDate: formatDateForInput(loanData.startDate)
  };

  // Handle loan field changes
  const handleLoanFieldChange = useCallback((field: keyof LoanInputData, value: string | PaymentType) => {
    if (field === 'paymentType') {
      onLoanDataChange({
        ...loanData,
        [field]: value as PaymentType
      });
      return;
    }

    // Handle numeric fields
    let processedValue: number;
    if (typeof value === 'string') {
      if (value === '') {
        processedValue = 0;
      } else {
        const parsed = parseFloat(value);
        processedValue = isNaN(parsed) ? 0 : parsed;
      }
    } else {
      processedValue = Number(value);
    }

    onLoanDataChange({
      ...loanData,
      [field]: processedValue
    });
  }, [loanData, onLoanDataChange]);

  // Handle start date change
  const handleStartDateChange = useCallback((value: string) => {
    try {
      const newDate = new Date(value + '-01'); // Add day to make valid date
      if (!isNaN(newDate.getTime())) {
        onStartDateChange(newDate);
      }
    } catch (error) {
      console.warn('Invalid date format:', value);
    }
  }, [onStartDateChange]);

  // Format date for input field (YYYY-MM format)
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Validation helpers
  const getFieldError = useCallback((field: keyof LoanFormData): string | null => {
    switch (field) {
      case 'amount':
        if (loanData.amount > 0 && loanData.amount < 1000) {
          return 'Minimum amount is 1,000 PLN';
        }
        if (loanData.amount > 10000000) {
          return 'Maximum amount is 10,000,000 PLN';
        }
        break;
      
      case 'interestRate':
        if (loanData.interestRate < 0) {
          return 'Interest rate cannot be negative';
        }
        if (loanData.interestRate > 50) {
          return 'Interest rate seems too high';
        }
        break;
      
      case 'termMonths':
        if (loanData.termMonths > 0 && loanData.termMonths < 1) {
          return 'Minimum term is 1 month';
        }
        if (loanData.termMonths > 600) {
          return 'Maximum term is 600 months (50 years)';
        }
        break;
    }
    return null;
  }, [loanData]);

  const hasErrors = Object.keys(formData).some(field => 
    getFieldError(field as keyof LoanFormData) !== null
  );

  return {
    formData,
    handleLoanFieldChange,
    handleStartDateChange,
    getFieldError,
    hasErrors,
    isComplete: loanData.amount > 0 && loanData.interestRate >= 0 && loanData.termMonths > 0
  };
}