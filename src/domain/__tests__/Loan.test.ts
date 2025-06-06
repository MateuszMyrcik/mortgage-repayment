import { describe, it, expect } from 'vitest';
import { Loan } from '../entities/Loan';
import { Money } from '../value-objects/Money';
import { InterestRate } from '../value-objects/InterestRate';
import { LoanTerm } from '../value-objects/LoanTerm';
import { PaymentDate } from '../value-objects/PaymentDate';

describe('Loan Entity', () => {
  const createTestLoan = () => {
    return Loan.create(
      Money.of(500000),
      InterestRate.fromPercentage(5.5),
      LoanTerm.fromMonths(360),
      'equal',
      PaymentDate.fromYearMonth(2025, 1)
    );
  };

  describe('creation and validation', () => {
    it('should create valid loan', () => {
      const loan = createTestLoan();
      expect(loan.principal.amount).toBe(500000);
      expect(loan.interestRate.annualPercentage).toBe(5.5);
      expect(loan.term.months).toBe(360);
      expect(loan.paymentType).toBe('equal');
    });

    it('should validate loan is valid', () => {
      const loan = createTestLoan();
      expect(loan.isValid()).toBe(true);
    });

    it('should throw error for principal too small', () => {
      expect(() => {
        Loan.create(
          Money.of(500), // Too small
          InterestRate.fromPercentage(5.5),
          LoanTerm.fromMonths(360),
          'equal',
          PaymentDate.current()
        );
      }).toThrow('Loan principal must be at least 1,000 PLN');
    });

    it('should throw error for principal too large', () => {
      expect(() => {
        Loan.create(
          Money.of(20000000), // Too large
          InterestRate.fromPercentage(5.5),
          LoanTerm.fromMonths(360),
          'equal',
          PaymentDate.current()
        );
      }).toThrow('Loan principal cannot exceed 10,000,000 PLN');
    });
  });

  describe('payment calculations', () => {
    it('should calculate equal monthly payment correctly', () => {
      const loan = createTestLoan();
      const monthlyPayment = loan.calculateMonthlyPayment();
      
      // Expected payment for 500,000 PLN at 5.5% for 30 years
      expect(monthlyPayment.amount).toBeCloseTo(2838.95, 2);
    });

    it('should calculate decreasing monthly payment correctly', () => {
      const loan = Loan.create(
        Money.of(500000),
        InterestRate.fromPercentage(5.5),
        LoanTerm.fromMonths(360),
        'decreasing',
        PaymentDate.current()
      );
      
      const monthlyPayment = loan.calculateMonthlyPayment();
      
      // For decreasing payment, this is just principal portion
      expect(monthlyPayment.amount).toBeCloseTo(1388.89, 2);
    });

    it('should handle zero interest rate', () => {
      const loan = Loan.create(
        Money.of(500000),
        InterestRate.zero(),
        LoanTerm.fromMonths(360),
        'equal',
        PaymentDate.current()
      );
      
      const monthlyPayment = loan.calculateMonthlyPayment();
      expect(monthlyPayment.amount).toBeCloseTo(1388.89, 2);
    });

    it('should calculate interest payment correctly', () => {
      const loan = createTestLoan();
      const remainingBalance = Money.of(500000);
      const interestPayment = loan.calculateInterestPayment(remainingBalance);
      
      // Monthly interest = 500,000 * (5.5% / 12)
      expect(interestPayment.amount).toBeCloseTo(2291.67, 2);
    });
  });

  describe('payment dates', () => {
    it('should calculate payment dates correctly', () => {
      const loan = createTestLoan();
      
      const firstPayment = loan.getPaymentDate(1);
      const secondPayment = loan.getPaymentDate(2);
      const twelfthPayment = loan.getPaymentDate(12);
      
      expect(firstPayment.month).toBe(1);
      expect(firstPayment.year).toBe(2025);
      
      expect(secondPayment.month).toBe(2);
      expect(secondPayment.year).toBe(2025);
      
      expect(twelfthPayment.month).toBe(12);
      expect(twelfthPayment.year).toBe(2025);
    });

    it('should handle year transitions in payment dates', () => {
      const loan = createTestLoan();
      
      const thirteenthPayment = loan.getPaymentDate(13);
      expect(thirteenthPayment.month).toBe(1);
      expect(thirteenthPayment.year).toBe(2026);
    });

    it('should throw error for invalid month numbers', () => {
      const loan = createTestLoan();
      
      expect(() => loan.getPaymentDate(0)).toThrow('Month number must be between 1 and loan term');
      expect(() => loan.getPaymentDate(361)).toThrow('Month number must be between 1 and loan term');
    });
  });

  describe('immutability and updates', () => {
    const originalLoan = createTestLoan();

    it('should create new loan with updated principal', () => {
      const newLoan = originalLoan.withPrincipal(Money.of(600000));
      
      expect(newLoan.principal.amount).toBe(600000);
      expect(originalLoan.principal.amount).toBe(500000); // Original unchanged
    });

    it('should create new loan with updated interest rate', () => {
      const newLoan = originalLoan.withInterestRate(InterestRate.fromPercentage(6));
      
      expect(newLoan.interestRate.annualPercentage).toBe(6);
      expect(originalLoan.interestRate.annualPercentage).toBe(5.5); // Original unchanged
    });

    it('should create new loan with updated term', () => {
      const newLoan = originalLoan.withTerm(LoanTerm.fromMonths(240));
      
      expect(newLoan.term.months).toBe(240);
      expect(originalLoan.term.months).toBe(360); // Original unchanged
    });

    it('should create new loan with updated payment type', () => {
      const newLoan = originalLoan.withPaymentType('decreasing');
      
      expect(newLoan.paymentType).toBe('decreasing');
      expect(originalLoan.paymentType).toBe('equal'); // Original unchanged
    });

    it('should create new loan with updated start date', () => {
      const newDate = PaymentDate.fromYearMonth(2025, 6);
      const newLoan = originalLoan.withStartDate(newDate);
      
      expect(newLoan.startDate.month).toBe(6);
      expect(originalLoan.startDate.month).toBe(1); // Original unchanged
    });
  });
});