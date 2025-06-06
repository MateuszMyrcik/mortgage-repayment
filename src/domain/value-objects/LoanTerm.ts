/**
 * LoanTerm value object - represents loan duration in months
 * Provides type safety and convenient conversion methods
 */
export class LoanTerm {
  private readonly _months: number;

  private constructor(months: number) {
    if (months <= 0) {
      throw new Error('Loan term must be positive');
    }
    if (!Number.isInteger(months)) {
      throw new Error('Loan term must be a whole number of months');
    }
    if (months > 600) { // 50 years max
      throw new Error('Loan term cannot exceed 600 months (50 years)');
    }
    this._months = months;
  }

  static fromMonths(months: number): LoanTerm {
    return new LoanTerm(months);
  }

  static fromYears(years: number): LoanTerm {
    return new LoanTerm(years * 12);
  }

  get months(): number {
    return this._months;
  }

  get years(): number {
    return this._months / 12;
  }

  get fullYears(): number {
    return Math.floor(this._months / 12);
  }

  get remainingMonths(): number {
    return this._months % 12;
  }

  subtract(other: LoanTerm): LoanTerm {
    const newMonths = this._months - other._months;
    if (newMonths <= 0) {
      throw new Error('Cannot subtract more months than available');
    }
    return new LoanTerm(newMonths);
  }

  add(other: LoanTerm): LoanTerm {
    return new LoanTerm(this._months + other._months);
  }

  isGreaterThan(other: LoanTerm): boolean {
    return this._months > other._months;
  }

  isLessThan(other: LoanTerm): boolean {
    return this._months < other._months;
  }

  isEqual(other: LoanTerm): boolean {
    return this._months === other._months;
  }

  /**
   * Format as "X lat Y miesięcy" in Polish
   */
  toDisplayString(): string {
    const fullYears = this.fullYears;
    const remainingMonths = this.remainingMonths;

    if (fullYears === 0) {
      return `${remainingMonths} miesięcy`;
    }
    
    if (remainingMonths === 0) {
      return `${fullYears} lat 0 miesięcy`;
    }

    return `${fullYears} lat ${remainingMonths} miesięcy`;
  }

  toString(): string {
    return `${this._months} months`;
  }

  toJSON(): number {
    return this._months;
  }
}