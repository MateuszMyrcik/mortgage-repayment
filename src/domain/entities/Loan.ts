import { Money } from '../value-objects/Money';
import { InterestRate } from '../value-objects/InterestRate';
import { LoanTerm } from '../value-objects/LoanTerm';
import { PaymentDate } from '../value-objects/PaymentDate';

export type PaymentType = 'equal' | 'decreasing';

/**
 * Loan entity - represents the core loan parameters
 * Contains business rules and validation for loan parameters
 */
export class Loan {
  private constructor(
    private readonly _principal: Money,
    private readonly _interestRate: InterestRate,
    private readonly _term: LoanTerm,
    private readonly _paymentType: PaymentType,
    private readonly _startDate: PaymentDate
  ) {
    this.validateLoanParameters();
  }

  static create(
    principal: Money,
    interestRate: InterestRate,
    term: LoanTerm,
    paymentType: PaymentType,
    startDate: PaymentDate
  ): Loan {
    return new Loan(principal, interestRate, term, paymentType, startDate);
  }

  get principal(): Money {
    return this._principal;
  }

  get interestRate(): InterestRate {
    return this._interestRate;
  }

  get term(): LoanTerm {
    return this._term;
  }

  get paymentType(): PaymentType {
    return this._paymentType;
  }

  get startDate(): PaymentDate {
    return this._startDate;
  }

  /**
   * Calculate monthly payment amount (principal + interest)
   */
  calculateMonthlyPayment(): Money {
    if (this._interestRate.isZero()) {
      return this._principal.divide(this._term.months);
    }

    const monthlyRate = this._interestRate.monthlyDecimal;
    const numPayments = this._term.months;

    if (this._paymentType === 'equal') {
      // Equal payment calculation (PMT formula)
      const factor = Math.pow(1 + monthlyRate, numPayments);
      const payment = this._principal.amount * (monthlyRate * factor) / (factor - 1);
      return Money.of(payment);
    } else {
      // Decreasing payment - only principal portion (interest varies)
      return this._principal.divide(numPayments);
    }
  }

  /**
   * Calculate interest payment for a given remaining balance
   */
  calculateInterestPayment(remainingBalance: Money): Money {
    return remainingBalance.multiply(this._interestRate.monthlyDecimal);
  }

  /**
   * Get payment date for a specific month number (1-indexed)
   */
  getPaymentDate(monthNumber: number): PaymentDate {
    if (monthNumber < 1 || monthNumber > this._term.months) {
      throw new Error('Month number must be between 1 and loan term');
    }
    return this._startDate.addMonths(monthNumber - 1);
  }

  /**
   * Check if the loan parameters are valid for calculation
   */
  isValid(): boolean {
    return this._principal.isPositive() && 
           this._interestRate.annualPercentage >= 0 && 
           this._term.months > 0;
  }

  private validateLoanParameters(): void {
    if (!this._principal.isPositive()) {
      throw new Error('Loan principal must be positive');
    }

    if (this._principal.amount < 1000) {
      throw new Error('Loan principal must be at least 1,000 PLN');
    }

    if (this._principal.amount > 10000000) {
      throw new Error('Loan principal cannot exceed 10,000,000 PLN');
    }
  }

  /**
   * Create a copy of the loan with updated parameters
   */
  withPrincipal(principal: Money): Loan {
    return new Loan(principal, this._interestRate, this._term, this._paymentType, this._startDate);
  }

  withInterestRate(rate: InterestRate): Loan {
    return new Loan(this._principal, rate, this._term, this._paymentType, this._startDate);
  }

  withTerm(term: LoanTerm): Loan {
    return new Loan(this._principal, this._interestRate, term, this._paymentType, this._startDate);
  }

  withPaymentType(paymentType: PaymentType): Loan {
    return new Loan(this._principal, this._interestRate, this._term, paymentType, this._startDate);
  }

  withStartDate(startDate: PaymentDate): Loan {
    return new Loan(this._principal, this._interestRate, this._term, this._paymentType, startDate);
  }
}