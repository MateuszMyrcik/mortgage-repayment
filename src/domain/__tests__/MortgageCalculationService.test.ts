import { describe, it, expect } from 'vitest';
import { MortgageCalculationService } from '../services/MortgageCalculationService';
import { Loan } from '../entities/Loan';
import { OverpaymentStrategy } from '../entities/OverpaymentStrategy';
import { Money } from '../value-objects/Money';
import { InterestRate } from '../value-objects/InterestRate';
import { LoanTerm } from '../value-objects/LoanTerm';
import { PaymentDate } from '../value-objects/PaymentDate';

describe('MortgageCalculationService', () => {
  let service: MortgageCalculationService;
  
  beforeEach(() => {
    service = new MortgageCalculationService();
  });

  const createTestLoan = () => {
    return Loan.create(
      Money.of(500000),
      InterestRate.fromPercentage(5.5),
      LoanTerm.fromMonths(360),
      'equal',
      PaymentDate.fromYearMonth(2025, 1)
    );
  };

  describe('basic calculations without overpayments', () => {
    it('should calculate mortgage schedule without overpayments', () => {
      const loan = createTestLoan();
      const strategy = OverpaymentStrategy.noOverpayment();
      
      const result = service.calculateSchedule(loan, strategy);
      
      expect(result.payments).toHaveLength(360);
      expect(result.actualTerm.months).toBe(360);
      expect(result.originalTerm.months).toBe(360);
      expect(result.interestSaved.amount).toBe(0);
      expect(result.totalOverpayments.amount).toBe(0);
    });

    it('should calculate first payment correctly', () => {
      const loan = createTestLoan();
      const strategy = OverpaymentStrategy.noOverpayment();
      
      const result = service.calculateSchedule(loan, strategy);
      const firstPayment = result.payments[0];
      
      expect(firstPayment.monthNumber).toBe(1);
      expect(firstPayment.overpayment.amount).toBe(0);
      expect(firstPayment.remainingBalance.amount).toBeLessThan(500000);
      expect(firstPayment.interestPayment.amount).toBeCloseTo(2291.67, 2);
    });

    it('should have decreasing remaining balance', () => {
      const loan = createTestLoan();
      const strategy = OverpaymentStrategy.noOverpayment();
      
      const result = service.calculateSchedule(loan, strategy);
      
      for (let i = 1; i < result.payments.length; i++) {
        expect(result.payments[i].remainingBalance.amount)
          .toBeLessThan(result.payments[i - 1].remainingBalance.amount);
      }
      
      // Last payment should have zero remaining balance
      const lastPayment = result.payments[result.payments.length - 1];
      expect(lastPayment.remainingBalance.amount).toBe(0);
    });
  });

  describe('calculations with overpayments', () => {
    it('should calculate schedule with base overpayments', () => {
      const loan = createTestLoan();
      const strategy = OverpaymentStrategy.create(
        Money.of(1000),
        'shorten_term'
      );
      
      const result = service.calculateSchedule(loan, strategy);
      
      expect(result.actualTerm.months).toBeLessThan(360);
      expect(result.interestSaved.amount).toBeGreaterThan(0);
      expect(result.totalOverpayments.amount).toBeGreaterThan(0);
      
      // All payments should have overpayment until loan is paid off
      result.payments.forEach(payment => {
        if (payment.remainingBalance.isPositive()) {
          expect(payment.overpayment.amount).toBe(1000);
        }
      });
    });

    it('should handle custom overpayments', () => {
      const loan = createTestLoan();
      const strategy = OverpaymentStrategy.create(
        Money.of(1000),
        'shorten_term',
        { 1: 2000, 2: 1500 }
      );
      
      const result = service.calculateSchedule(loan, strategy);
      
      expect(result.payments[0].overpayment.amount).toBe(2000);
      expect(result.payments[0].isCustomOverpayment).toBe(true);
      
      expect(result.payments[1].overpayment.amount).toBe(1500);
      expect(result.payments[1].isCustomOverpayment).toBe(true);
      
      expect(result.payments[2].overpayment.amount).toBe(1000);
      expect(result.payments[2].isCustomOverpayment).toBe(false);
    });

    it('should not overpay beyond remaining balance', () => {
      const smallLoan = Loan.create(
        Money.of(10000),
        InterestRate.fromPercentage(5.5),
        LoanTerm.fromMonths(12),
        'equal',
        PaymentDate.current()
      );
      
      const largeOverpayment = OverpaymentStrategy.create(
        Money.of(5000),
        'shorten_term'
      );
      
      const result = service.calculateSchedule(smallLoan, largeOverpayment);
      
      expect(result.actualTerm.months).toBeLessThan(12);
      
      // Last payment should not exceed remaining balance
      const lastPayment = result.payments[result.payments.length - 1];
      expect(lastPayment.remainingBalance.amount).toBe(0);
    });
  });

  describe('decreasing payment type', () => {
    it('should calculate decreasing payment schedule', () => {
      const loan = Loan.create(
        Money.of(500000),
        InterestRate.fromPercentage(5.5),
        LoanTerm.fromMonths(360),
        'decreasing',
        PaymentDate.current()
      );
      
      const strategy = OverpaymentStrategy.noOverpayment();
      const result = service.calculateSchedule(loan, strategy);
      
      expect(result.payments).toHaveLength(360);
      
      // Principal payments should be constant
      const principalPayments = result.payments.map(p => p.principalPayment.amount);
      expect(principalPayments[0]).toBeCloseTo(principalPayments[1], 2);
      
      // Interest payments should decrease over time
      expect(result.payments[0].interestPayment.amount)
        .toBeGreaterThan(result.payments[100].interestPayment.amount);
    });
  });

  describe('edge cases', () => {
    it('should handle zero interest rate', () => {
      const loan = Loan.create(
        Money.of(500000),
        InterestRate.zero(),
        LoanTerm.fromMonths(360),
        'equal',
        PaymentDate.current()
      );
      
      const strategy = OverpaymentStrategy.noOverpayment();
      const result = service.calculateSchedule(loan, strategy);
      
      expect(result.payments).toHaveLength(360);
      expect(result.totalInterest.amount).toBe(0);
      
      // All payments should be principal only
      result.payments.forEach(payment => {
        expect(payment.interestPayment.amount).toBe(0);
      });
      
      // Check that total principal payments equals loan amount
      const totalPrincipal = result.payments.reduce(
        (sum, payment) => sum + payment.principalPayment.amount,
        0
      );
      expect(totalPrincipal).toBeCloseTo(500000, 2);
    });

    it('should throw error for invalid loan', () => {
      // Test that creating an invalid loan throws during construction
      expect(() => {
        Loan.create(
          Money.zero(), // Invalid - should throw during creation
          InterestRate.fromPercentage(5.5),
          LoanTerm.fromMonths(360),
          'equal',
          PaymentDate.current()
        );
      }).toThrow('Loan principal must be positive');
    });

    it('should validate loan parameters', () => {
      const loan = createTestLoan();
      const validation = service.validateLoanParameters(loan);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('monthly payment calculation', () => {
    it('should calculate monthly payment amount', () => {
      const loan = createTestLoan();
      const monthlyPayment = service.calculateMonthlyPaymentAmount(loan);
      
      expect(monthlyPayment.amount).toBeCloseTo(2838.95, 2);
    });
  });

  describe('calculation totals', () => {
    it('should calculate correct totals', () => {
      const loan = createTestLoan();
      const strategy = OverpaymentStrategy.create(Money.of(1000), 'shorten_term');
      
      const result = service.calculateSchedule(loan, strategy);
      
      // Total paid should equal sum of all payments
      const sumOfPayments = result.payments.reduce(
        (sum, payment) => sum.add(payment.totalPayment),
        Money.zero()
      );
      expect(result.totalPaid.amount).toBeCloseTo(sumOfPayments.amount, 2);
      
      // Total overpayments should equal sum of all overpayments
      const sumOfOverpayments = result.payments.reduce(
        (sum, payment) => sum.add(payment.overpayment),
        Money.zero()
      );
      expect(result.totalOverpayments.amount).toBeCloseTo(sumOfOverpayments.amount, 2);
    });
  });
});