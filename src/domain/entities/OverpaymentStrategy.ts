import { Money } from '../value-objects/Money';

export type OverpaymentEffect = 'shorten_term' | 'reduce_payment';

/**
 * OverpaymentStrategy entity - encapsulates overpayment business rules
 * Manages base overpayment amounts and custom monthly overrides
 */
export class OverpaymentStrategy {
  private _baseAmount: Money;
  private _effect: OverpaymentEffect;
  private _customOverpayments: Map<number, Money>;

  private constructor(
    baseAmount: Money,
    effect: OverpaymentEffect,
    customOverpayments: Map<number, Money> = new Map()
  ) {
    this._baseAmount = baseAmount;
    this._effect = effect;
    this._customOverpayments = customOverpayments;
  }

  static create(
    baseAmount: Money,
    effect: OverpaymentEffect,
    customOverpayments: Record<number, number> = {}
  ): OverpaymentStrategy {
    const customMap = new Map<number, Money>();
    
    // Convert custom overpayments to Money objects
    Object.entries(customOverpayments).forEach(([month, amount]) => {
      const monthNum = parseInt(month, 10);
      if (monthNum > 0 && amount >= 0) {
        customMap.set(monthNum, Money.of(amount));
      }
    });

    return new OverpaymentStrategy(baseAmount, effect, customMap);
  }

  static noOverpayment(): OverpaymentStrategy {
    return new OverpaymentStrategy(Money.zero(), 'shorten_term');
  }

  get baseAmount(): Money {
    return this._baseAmount;
  }

  get effect(): OverpaymentEffect {
    return this._effect;
  }

  /**
   * Get overpayment amount for a specific month
   * Returns custom amount if set, otherwise base amount
   */
  getOverpaymentForMonth(monthNumber: number): Money {
    const customAmount = this._customOverpayments.get(monthNumber);
    return customAmount || this._baseAmount;
  }

  /**
   * Check if a month has a custom overpayment
   */
  hasCustomOverpayment(monthNumber: number): boolean {
    return this._customOverpayments.has(monthNumber);
  }

  /**
   * Set custom overpayment for a specific month
   */
  withCustomOverpayment(monthNumber: number, amount: Money): OverpaymentStrategy {
    if (monthNumber < 1) {
      throw new Error('Month number must be positive');
    }

    const newCustomOverpayments = new Map(this._customOverpayments);
    
    if (amount.isEqual(this._baseAmount)) {
      // If custom amount equals base amount, remove the custom override
      newCustomOverpayments.delete(monthNumber);
    } else {
      newCustomOverpayments.set(monthNumber, amount);
    }

    return new OverpaymentStrategy(this._baseAmount, this._effect, newCustomOverpayments);
  }

  /**
   * Remove custom overpayment for a specific month (revert to base)
   */
  withoutCustomOverpayment(monthNumber: number): OverpaymentStrategy {
    const newCustomOverpayments = new Map(this._customOverpayments);
    newCustomOverpayments.delete(monthNumber);
    return new OverpaymentStrategy(this._baseAmount, this._effect, newCustomOverpayments);
  }

  /**
   * Create a copy with a different base amount
   */
  withBaseAmount(baseAmount: Money): OverpaymentStrategy {
    return new OverpaymentStrategy(baseAmount, this._effect, this._customOverpayments);
  }

  /**
   * Create a copy with a different effect
   */
  withEffect(effect: OverpaymentEffect): OverpaymentStrategy {
    return new OverpaymentStrategy(this._baseAmount, effect, this._customOverpayments);
  }

  /**
   * Check if any overpayments are configured
   */
  hasAnyOverpayments(): boolean {
    return this._baseAmount.isPositive() || this._customOverpayments.size > 0;
  }

  /**
   * Get all custom overpayments as a plain object
   */
  getCustomOverpaymentsAsRecord(): Record<number, number> {
    const result: Record<number, number> = {};
    this._customOverpayments.forEach((amount, month) => {
      result[month] = amount.amount;
    });
    return result;
  }

  /**
   * Calculate total overpayments made over the entire loan
   */
  calculateTotalOverpayments(totalMonths: number): Money {
    let total = Money.zero();
    
    for (let month = 1; month <= totalMonths; month++) {
      total = total.add(this.getOverpaymentForMonth(month));
    }
    
    return total;
  }

  /**
   * Validate overpayment amount against remaining balance
   */
  validateOverpaymentAmount(amount: Money, remainingBalance: Money, principalPayment: Money): Money {
    const maxPossibleOverpayment = remainingBalance.subtract(principalPayment);
    
    if (amount.isGreaterThan(maxPossibleOverpayment)) {
      return maxPossibleOverpayment;
    }
    
    return amount;
  }
}