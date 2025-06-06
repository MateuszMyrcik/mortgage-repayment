import { useState, useEffect, useMemo } from 'react';
import { MortgageApplicationService } from '../services/MortgageApplicationService';
import type { LoanInputData, OverpaymentInputData } from '../services/MortgageApplicationService';
import type { MortgageCalculationResult } from '../../domain/services/MortgageCalculationService';

/**
 * Custom hook for mortgage calculations
 * Bridges domain services with React components
 */
export function useMortgageCalculation() {
  const [loanData, setLoanData] = useState<LoanInputData>({
    amount: 500000,
    interestRate: 5.5,
    termMonths: 360,
    paymentType: 'equal',
    startDate: new Date()
  });

  const [overpaymentData, setOverpaymentData] = useState<OverpaymentInputData>({
    baseAmount: 0,
    effect: 'shorten_term',
    customOverpayments: {}
  });

  const [calculationResult, setCalculationResult] = useState<MortgageCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Create application service instance
  const applicationService = useMemo(() => new MortgageApplicationService(), []);

  // Validate inputs whenever they change
  const validation = useMemo(() => {
    return applicationService.validateLoanInput(loanData);
  }, [loanData, applicationService]);

  // Calculate schedule when inputs change
  useEffect(() => {
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setCalculationResult(null);
      return;
    }

    setIsCalculating(true);
    setValidationErrors([]);

    // Use setTimeout to prevent blocking UI
    const timeoutId = setTimeout(() => {
      const result = applicationService.calculateMortgageSchedule(loanData, overpaymentData);
      setCalculationResult(result);
      setIsCalculating(false);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loanData, overpaymentData, validation.isValid, applicationService]);

  // Update loan data
  const updateLoanData = (updates: Partial<LoanInputData>) => {
    setLoanData(prev => ({ ...prev, ...updates }));
  };

  // Update overpayment data
  const updateOverpaymentData = (updates: Partial<OverpaymentInputData>) => {
    setOverpaymentData(prev => ({ ...prev, ...updates }));
  };

  // Update custom overpayment for specific month
  const updateCustomOverpayment = (monthNumber: number, amount: number) => {
    const currentCustom = overpaymentData.customOverpayments || {};
    
    let newCustomOverpayments: Record<number, number>;
    if (amount === overpaymentData.baseAmount) {
      // Remove custom overpayment if it equals base amount
      const { [monthNumber]: removed, ...rest } = currentCustom;
      newCustomOverpayments = rest;
    } else {
      newCustomOverpayments = {
        ...currentCustom,
        [monthNumber]: amount
      };
    }

    setOverpaymentData(prev => ({
      ...prev,
      customOverpayments: newCustomOverpayments
    }));
  };

  // Calculate monthly payment for display
  const monthlyPaymentAmount = useMemo(() => {
    if (!validation.isValid) return null;
    return applicationService.calculateMonthlyPayment(loanData);
  }, [loanData, validation.isValid, applicationService]);

  // Check if calculation is ready
  const isReady = validation.isValid && !isCalculating && calculationResult !== null;

  return {
    // State
    loanData,
    overpaymentData,
    calculationResult,
    
    // Derived state
    isCalculating,
    isReady,
    validationErrors,
    monthlyPaymentAmount,
    hasValidInputs: validation.isValid,
    
    // Actions
    updateLoanData,
    updateOverpaymentData,
    updateCustomOverpayment,
    
    // Utilities
    getLegacyResult: () => calculationResult ? applicationService.convertToLegacyFormat(calculationResult) : null
  };
}