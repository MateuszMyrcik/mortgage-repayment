import { Money } from '../value-objects/Money';
import { PaymentDate } from '../value-objects/PaymentDate';

/**
 * MonthlyPayment entity - represents a single payment in the amortization schedule
 * Immutable entity with business logic for payment calculations
 */
export class MonthlyPayment {
  private _monthNumber: number;
  private _date: PaymentDate;
  private _principalPayment: Money;
  private _interestPayment: Money;
  private _overpayment: Money;
  private _remainingBalance: Money;
  private _isCustomOverpayment: boolean;

  private constructor(
    monthNumber: number,
    date: PaymentDate,
    principalPayment: Money,
    interestPayment: Money,
    overpayment: Money,
    remainingBalance: Money,
    isCustomOverpayment: boolean = false
  ) {
    this._monthNumber = monthNumber;
    this._date = date;
    this._principalPayment = principalPayment;
    this._interestPayment = interestPayment;
    this._overpayment = overpayment;
    this._remainingBalance = remainingBalance;
    this._isCustomOverpayment = isCustomOverpayment;
    this.validatePayment();
  }

  static create(
    monthNumber: number,
    date: PaymentDate,
    principalPayment: Money,
    interestPayment: Money,
    overpayment: Money,
    remainingBalance: Money,
    isCustomOverpayment = false
  ): MonthlyPayment {
    return new MonthlyPayment(
      monthNumber,
      date,
      principalPayment,
      interestPayment,
      overpayment,
      remainingBalance,
      isCustomOverpayment
    );
  }

  get monthNumber(): number {
    return this._monthNumber;
  }

  get date(): PaymentDate {
    return this._date;
  }

  get principalPayment(): Money {
    return this._principalPayment;
  }

  get interestPayment(): Money {
    return this._interestPayment;
  }

  get overpayment(): Money {
    return this._overpayment;
  }

  get remainingBalance(): Money {
    return this._remainingBalance;
  }

  get isCustomOverpayment(): boolean {
    return this._isCustomOverpayment;
  }

  /**
   * Total payment amount (principal + interest + overpayment)
   */
  get totalPayment(): Money {
    return this._principalPayment
      .add(this._interestPayment)
      .add(this._overpayment);
  }

  /**
   * Regular payment amount (principal + interest, no overpayment)
   */
  get regularPayment(): Money {
    return this._principalPayment.add(this._interestPayment);
  }

  /**
   * Total amount reducing the balance (principal + overpayment)
   */
  get totalPrincipalReduction(): Money {
    return this._principalPayment.add(this._overpayment);
  }

  /**
   * Check if this payment has any overpayment
   */
  hasOverpayment(): boolean {
    return this._overpayment.isPositive();
  }

  /**
   * Check if this is the final payment (remaining balance is zero)
   */
  isFinalPayment(): boolean {
    return this._remainingBalance.isZero();
  }

  /**
   * Create a copy with a different overpayment amount
   */
  withOverpayment(overpayment: Money, isCustom = false): MonthlyPayment {
    // Ensure overpayment doesn't exceed remaining balance
    const maxOverpayment = this._remainingBalance.subtract(this._principalPayment);
    const actualOverpayment = overpayment.isGreaterThan(maxOverpayment) 
      ? maxOverpayment 
      : overpayment;

    const newRemainingBalance = this._remainingBalance
      .subtract(this._principalPayment)
      .subtract(actualOverpayment);

    return new MonthlyPayment(
      this._monthNumber,
      this._date,
      this._principalPayment,
      this._interestPayment,
      actualOverpayment,
      newRemainingBalance,
      isCustom
    );
  }

  private validatePayment(): void {
    if (this._monthNumber < 1) {
      throw new Error('Month number must be positive');
    }

    if (this._principalPayment.amount < 0) {
      throw new Error('Principal payment cannot be negative');
    }

    if (this._interestPayment.amount < 0) {
      throw new Error('Interest payment cannot be negative');
    }

    if (this._overpayment.amount < 0) {
      throw new Error('Overpayment cannot be negative');
    }

    if (this._remainingBalance.amount < 0) {
      throw new Error('Remaining balance cannot be negative');
    }
  }

  /**
   * Convert to plain object for serialization/API compatibility
   */
  toPlainObject() {
    return {
      month: this._monthNumber,
      date: this._date.date,
      principalPayment: this._principalPayment.amount,
      interestPayment: this._interestPayment.amount,
      totalPayment: this.totalPayment.amount,
      overpayment: this._overpayment.amount,
      remainingBalance: this._remainingBalance.amount,
      customOverpayment: this._isCustomOverpayment ? this._overpayment.amount : undefined
    };
  }
}