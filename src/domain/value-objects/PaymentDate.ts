/**
 * PaymentDate value object - represents a specific payment date
 * Handles Polish date formatting and month progression
 */
export class PaymentDate {
  private readonly _date: Date;

  private constructor(date: Date) {
    if (!date || isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }
    // Always set to first day of month for consistency
    this._date = new Date(date.getFullYear(), date.getMonth(), 1);
  }

  static fromDate(date: Date): PaymentDate {
    return new PaymentDate(date);
  }

  static fromYearMonth(year: number, month: number): PaymentDate {
    return new PaymentDate(new Date(year, month - 1, 1)); // month is 0-indexed
  }

  static current(): PaymentDate {
    return new PaymentDate(new Date());
  }

  get date(): Date {
    return new Date(this._date);
  }

  get year(): number {
    return this._date.getFullYear();
  }

  get month(): number {
    return this._date.getMonth() + 1; // Return 1-indexed month
  }

  addMonths(months: number): PaymentDate {
    const newDate = new Date(this._date);
    newDate.setMonth(newDate.getMonth() + months);
    return new PaymentDate(newDate);
  }

  subtractMonths(months: number): PaymentDate {
    return this.addMonths(-months);
  }

  isBefore(other: PaymentDate): boolean {
    return this._date < other._date;
  }

  isAfter(other: PaymentDate): boolean {
    return this._date > other._date;
  }

  isEqual(other: PaymentDate): boolean {
    return this._date.getTime() === other._date.getTime();
  }

  /**
   * Format as "styczeń 2025" in Polish
   */
  toDisplayString(): string {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'long'
    }).format(this._date);
  }

  /**
   * Format as "01.2025" for input fields
   */
  toInputString(): string {
    const year = this._date.getFullYear();
    const month = String(this._date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  toString(): string {
    return this._date.toISOString().split('T')[0];
  }

  toJSON(): string {
    return this.toString();
  }
}