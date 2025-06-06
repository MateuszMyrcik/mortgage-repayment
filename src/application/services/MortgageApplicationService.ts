import { Loan } from '../../domain/entities/Loan';
import type { PaymentType } from '../../domain/entities/Loan';
import { OverpaymentStrategy } from '../../domain/entities/OverpaymentStrategy';
import type { OverpaymentEffect } from '../../domain/entities/OverpaymentStrategy';
import { MortgageCalculationService } from '../../domain/services/MortgageCalculationService';
import type { MortgageCalculationResult } from '../../domain/services/MortgageCalculationService';
import { Money } from '../../domain/value-objects/Money';
import { InterestRate } from '../../domain/value-objects/InterestRate';
import { LoanTerm } from '../../domain/value-objects/LoanTerm';
import { PaymentDate } from '../../domain/value-objects/PaymentDate';

export interface LoanInputData {
  amount: number;
  interestRate: number;
  termMonths: number;
  paymentType: PaymentType;
  startDate: Date;
}

export interface OverpaymentInputData {
  baseAmount: number;
  effect: OverpaymentEffect;
  customOverpayments?: Record<number, number>;
}

/**
 * MortgageApplicationService - Application layer service
 * Orchestrates domain services and handles data transformation between UI and domain
 */
export class MortgageApplicationService {
  private calculationService: MortgageCalculationService;

  constructor() {
    this.calculationService = new MortgageCalculationService();
  }

  /**
   * Calculate mortgage schedule from raw input data
   */
  calculateMortgageSchedule(
    loanInput: LoanInputData,
    overpaymentInput: OverpaymentInputData
  ): MortgageCalculationResult | null {
    try {
      // Validate inputs first
      if (!this.isValidLoanInput(loanInput)) {
        return null;
      }

      // Convert primitive inputs to domain objects
      const loan = this.createLoanFromInput(loanInput);
      const overpaymentStrategy = this.createOverpaymentStrategyFromInput(overpaymentInput);

      // Delegate to domain service
      return this.calculationService.calculateSchedule(loan, overpaymentStrategy);
    } catch (error) {
      console.error('Error calculating mortgage schedule:', error);
      return null;
    }
  }

  /**
   * Update overpayment for a specific month
   */
  updateOverpayment(
    currentResult: MortgageCalculationResult,
    loanInput: LoanInputData,
    overpaymentInput: OverpaymentInputData,
    monthNumber: number,
    newAmount: number
  ): MortgageCalculationResult | null {
    try {
      const loan = this.createLoanFromInput(loanInput);
      
      // Update overpayment strategy with new custom amount
      const currentStrategy = this.createOverpaymentStrategyFromInput(overpaymentInput);
      const updatedStrategy = currentStrategy.withCustomOverpayment(
        monthNumber, 
        Money.of(newAmount)
      );

      return this.calculationService.calculateSchedule(loan, updatedStrategy);
    } catch (error) {
      console.error('Error updating overpayment:', error);
      return currentResult; // Return unchanged on error
    }
  }

  /**
   * Validate loan input data
   */
  validateLoanInput(loanInput: LoanInputData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (loanInput.amount <= 0) {
      errors.push('Loan amount must be positive');
    }

    if (loanInput.amount < 1000) {
      errors.push('Loan amount must be at least 1,000 PLN');
    }

    if (loanInput.interestRate < 0) {
      errors.push('Interest rate cannot be negative');
    }

    if (loanInput.interestRate > 50) {
      errors.push('Interest rate seems unreasonably high');
    }

    if (loanInput.termMonths <= 0) {
      errors.push('Loan term must be positive');
    }

    if (loanInput.termMonths > 600) {
      errors.push('Loan term cannot exceed 50 years');
    }

    if (!loanInput.startDate || isNaN(loanInput.startDate.getTime())) {
      errors.push('Valid start date is required');
    }

    // Additional domain validation if basic validation passes
    if (errors.length === 0) {
      try {
        const loan = this.createLoanFromInput(loanInput);
        const domainValidation = this.calculationService.validateLoanParameters(loan);
        errors.push(...domainValidation.errors);
      } catch (error) {
        errors.push('Invalid loan parameters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate monthly payment amount for display
   */
  calculateMonthlyPayment(loanInput: LoanInputData): number | null {
    try {
      if (!this.isValidLoanInput(loanInput)) {
        return null;
      }

      const loan = this.createLoanFromInput(loanInput);
      const monthlyPayment = this.calculationService.calculateMonthlyPaymentAmount(loan);
      return monthlyPayment.amount;
    } catch (error) {
      return null;
    }
  }

  private isValidLoanInput(loanInput: LoanInputData): boolean {
    return loanInput.amount > 0 && 
           loanInput.interestRate >= 0 && 
           loanInput.termMonths > 0 &&
           loanInput.startDate &&
           !isNaN(loanInput.startDate.getTime());
  }

  private createLoanFromInput(loanInput: LoanInputData): Loan {
    return Loan.create(
      Money.of(loanInput.amount),
      InterestRate.fromPercentage(loanInput.interestRate),
      LoanTerm.fromMonths(loanInput.termMonths),
      loanInput.paymentType,
      PaymentDate.fromDate(loanInput.startDate)
    );
  }

  private createOverpaymentStrategyFromInput(overpaymentInput: OverpaymentInputData): OverpaymentStrategy {
    return OverpaymentStrategy.create(
      Money.of(overpaymentInput.baseAmount),
      overpaymentInput.effect,
      overpaymentInput.customOverpayments || {}
    );
  }

  /**
   * Convert domain result to legacy format for backward compatibility
   */
  convertToLegacyFormat(result: MortgageCalculationResult): any {
    return {
      monthlySchedule: result.payments.map(payment => payment.toPlainObject()),
      totalInterest: result.totalInterest.amount,
      totalInterestWithoutOverpayment: result.totalInterestWithoutOverpayment.amount,
      interestSaved: result.interestSaved.amount,
      actualTermMonths: result.actualTerm.months,
      originalTermMonths: result.originalTerm.months
    };
  }
}