/**
 * Money value object - represents monetary amounts in PLN
 * Ensures type safety and provides consistent formatting
 */
export class Money {
  private readonly _amount: number;

  private constructor(amount: number) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!Number.isFinite(amount)) {
      throw new Error('Money amount must be a finite number');
    }
    this._amount = Math.round(amount * 100) / 100; // Round to 2 decimal places
  }

  static of(amount: number): Money {
    return new Money(amount);
  }

  static zero(): Money {
    return new Money(0);
  }

  get amount(): number {
    return this._amount;
  }

  add(other: Money): Money {
    return new Money(this._amount + other._amount);
  }

  subtract(other: Money): Money {
    return new Money(this._amount - other._amount);
  }

  multiply(factor: number): Money {
    return new Money(this._amount * factor);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this._amount / divisor);
  }

  isGreaterThan(other: Money): boolean {
    return this._amount > other._amount;
  }

  isLessThan(other: Money): boolean {
    return this._amount < other._amount;
  }

  isEqual(other: Money): boolean {
    return this._amount === other._amount;
  }

  isZero(): boolean {
    return this._amount === 0;
  }

  isPositive(): boolean {
    return this._amount > 0;
  }

  /**
   * Format as Polish currency
   */
  toDisplayString(): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(this._amount);
  }

  /**
   * Format for calculations (no currency symbol)
   */
  toString(): string {
    return this._amount.toString();
  }

  toJSON(): number {
    return this._amount;
  }
}