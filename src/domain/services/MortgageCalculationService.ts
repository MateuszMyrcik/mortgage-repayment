import { Loan } from '../entities/Loan';
import { MonthlyPayment } from '../entities/MonthlyPayment';
import { OverpaymentStrategy } from '../entities/OverpaymentStrategy';
import { Money } from '../value-objects/Money';
import { LoanTerm } from '../value-objects/LoanTerm';

export interface MortgageCalculationResult {
  payments: MonthlyPayment[];
  totalInterest: Money;
  totalInterestWithoutOverpayment: Money;
  interestSaved: Money;
  actualTerm: LoanTerm;
  originalTerm: LoanTerm;
  totalPaid: Money;
  totalOverpayments: Money;
}

/**
 * MortgageCalculationService - Core domain service for mortgage calculations
 * Contains the main business logic for generating amortization schedules
 */
export class MortgageCalculationService {
  
  /**
   * Calculate complete mortgage schedule with overpayments
   */
  calculateSchedule(loan: Loan, overpaymentStrategy: OverpaymentStrategy): MortgageCalculationResult {
    if (!loan.isValid()) {
      throw new Error('Invalid loan parameters provided');
    }

    const payments = this.generatePaymentSchedule(loan, overpaymentStrategy);
    const baselineResult = this.calculateBaselineSchedule(loan);
    
    const totalInterest = this.calculateTotalInterest(payments);
    const totalPaid = this.calculateTotalPaid(payments);
    const totalOverpayments = this.calculateTotalOverpayments(payments);
    const actualTerm = LoanTerm.fromMonths(payments.length);
    
    return {
      payments,
      totalInterest,
      totalInterestWithoutOverpayment: baselineResult.totalInterest,
      interestSaved: baselineResult.totalInterest.subtract(totalInterest),
      actualTerm,
      originalTerm: loan.term,
      totalPaid,
      totalOverpayments
    };
  }

  private generatePaymentSchedule(loan: Loan, overpaymentStrategy: OverpaymentStrategy): MonthlyPayment[] {
    const payments: MonthlyPayment[] = [];
    let remainingBalance = loan.principal;
    let monthNumber = 1;

    const baseMonthlyPayment = loan.calculateMonthlyPayment();

    while (remainingBalance.isPositive() && monthNumber <= loan.term.months) {
      const paymentDate = loan.getPaymentDate(monthNumber);
      const interestPayment = loan.calculateInterestPayment(remainingBalance);
      
      let principalPayment: Money;
      
      if (loan.paymentType === 'equal') {
        principalPayment = baseMonthlyPayment.subtract(interestPayment);
      } else {
        // Decreasing payment type
        principalPayment = loan.principal.divide(loan.term.months);
      }

      // Ensure we don't pay more principal than remaining balance
      if (principalPayment.isGreaterThan(remainingBalance)) {
        principalPayment = remainingBalance;
      }

      // Calculate overpayment
      const plannedOverpayment = overpaymentStrategy.getOverpaymentForMonth(monthNumber);
      const maxOverpayment = remainingBalance.subtract(principalPayment);
      const actualOverpayment = plannedOverpayment.isGreaterThan(maxOverpayment) 
        ? maxOverpayment 
        : plannedOverpayment;

      // Update remaining balance
      const newRemainingBalance = remainingBalance
        .subtract(principalPayment)
        .subtract(actualOverpayment);

      const payment = MonthlyPayment.create(
        monthNumber,
        paymentDate,
        principalPayment,
        interestPayment,
        actualOverpayment,
        newRemainingBalance,
        overpaymentStrategy.hasCustomOverpayment(monthNumber)
      );

      payments.push(payment);
      remainingBalance = newRemainingBalance;
      monthNumber++;

      // Break if loan is fully paid
      if (remainingBalance.isZero()) {
        break;
      }
    }

    return payments;
  }

  private calculateBaselineSchedule(loan: Loan): { totalInterest: Money } {
    // Calculate schedule without overpayments
    const noOverpayment = OverpaymentStrategy.noOverpayment();
    const payments = this.generatePaymentSchedule(loan, noOverpayment);
    return {
      totalInterest: this.calculateTotalInterest(payments)
    };
  }

  private calculateTotalInterest(payments: MonthlyPayment[]): Money {
    return payments.reduce(
      (total, payment) => total.add(payment.interestPayment),
      Money.zero()
    );
  }

  private calculateTotalPaid(payments: MonthlyPayment[]): Money {
    return payments.reduce(
      (total, payment) => total.add(payment.totalPayment),
      Money.zero()
    );
  }

  private calculateTotalOverpayments(payments: MonthlyPayment[]): Money {
    return payments.reduce(
      (total, payment) => total.add(payment.overpayment),
      Money.zero()
    );
  }

  /**
   * Calculate just the monthly payment amount (for form validation)
   */
  calculateMonthlyPaymentAmount(loan: Loan): Money {
    return loan.calculateMonthlyPayment();
  }

  /**
   * Validate if loan parameters can produce a valid schedule
   */
  validateLoanParameters(loan: Loan): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      if (!loan.isValid()) {
        errors.push('Invalid loan parameters');
      }

      // Additional business rule validations
      const monthlyPayment = loan.calculateMonthlyPayment();
      const monthlyIncome = loan.principal.multiply(0.1); // Assume 10% of principal as monthly income limit
      
      if (monthlyPayment.isGreaterThan(monthlyIncome)) {
        errors.push('Monthly payment exceeds reasonable income limits');
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}