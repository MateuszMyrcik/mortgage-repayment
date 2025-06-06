import { useCallback } from 'react';
import type { OverpaymentInputData } from '../services/MortgageApplicationService';
import type { OverpaymentEffect } from '../../domain/entities/OverpaymentStrategy';

export interface OverpaymentFormData {
  baseAmount: string;
  effect: OverpaymentEffect;
}

/**
 * Custom hook for overpayment form state management
 * Handles overpayment settings and validation
 */
export function useOverpaymentForm(
  overpaymentData: OverpaymentInputData,
  onOverpaymentDataChange: (data: Partial<OverpaymentInputData>) => void
) {
  
  // Convert domain data to form data
  const formData: OverpaymentFormData = {
    baseAmount: overpaymentData.baseAmount > 0 ? overpaymentData.baseAmount.toString() : '',
    effect: overpaymentData.effect
  };

  // Handle overpayment field changes
  const handleOverpaymentFieldChange = useCallback((field: keyof OverpaymentInputData, value: string | OverpaymentEffect) => {
    if (field === 'effect') {
      onOverpaymentDataChange({
        [field]: value as OverpaymentEffect
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
        processedValue = isNaN(parsed) ? 0 : Math.max(0, parsed); // Ensure non-negative
      }
    } else {
      processedValue = Math.max(0, Number(value));
    }

    onOverpaymentDataChange({
      [field]: processedValue
    });
  }, [onOverpaymentDataChange]);

  // Validation helpers
  const getFieldError = useCallback((field: keyof OverpaymentFormData): string | null => {
    switch (field) {
      case 'baseAmount':
        if (overpaymentData.baseAmount < 0) {
          return 'Overpayment amount cannot be negative';
        }
        if (overpaymentData.baseAmount > 1000000) {
          return 'Overpayment amount seems too high';
        }
        break;
    }
    return null;
  }, [overpaymentData]);

  const hasErrors = Object.keys(formData).some(field => 
    getFieldError(field as keyof OverpaymentFormData) !== null
  );

  const hasOverpayments = overpaymentData.baseAmount > 0 || 
    Object.keys(overpaymentData.customOverpayments || {}).length > 0;

  return {
    formData,
    handleOverpaymentFieldChange,
    getFieldError,
    hasErrors,
    hasOverpayments
  };
}