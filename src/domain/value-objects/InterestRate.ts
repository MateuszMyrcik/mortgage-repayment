/**
 * InterestRate value object - represents annual interest rates
 * Provides type safety and consistent calculation methods
 */
export class InterestRate {
  private readonly _annualRate: number;

  private constructor(annualRate: number) {
    if (!Number.isFinite(annualRate)) {
      throw new Error('Interest rate must be a finite number');
    }
    if (annualRate < 0) {
      throw new Error('Interest rate cannot be negative');
    }
    if (annualRate > 100) {
      throw new Error('Interest rate cannot exceed 100%');
    }
    this._annualRate = annualRate;
  }

  static fromPercentage(percentage: number): InterestRate {
    return new InterestRate(percentage);
  }

  static fromDecimal(decimal: number): InterestRate {
    return new InterestRate(decimal * 100);
  }

  static zero(): InterestRate {
    return new InterestRate(0);
  }

  get annualPercentage(): number {
    return this._annualRate;
  }

  get annualDecimal(): number {
    return this._annualRate / 100;
  }

  get monthlyDecimal(): number {
    return this.annualDecimal / 12;
  }

  get monthlyPercentage(): number {
    return this._annualRate / 12;
  }

  isZero(): boolean {
    return this._annualRate === 0;
  }

  isPositive(): boolean {
    return this._annualRate > 0;
  }

  toString(): string {
    return `${this._annualRate}%`;
  }

  toJSON(): number {
    return this._annualRate;
  }
}