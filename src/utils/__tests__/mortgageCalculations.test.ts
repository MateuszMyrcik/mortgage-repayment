import { describe, it, expect } from 'vitest'
import {
  calculateMonthlyPayment,
  calculateMortgageSchedule,
  formatCurrency,
  formatDate,
  formatDateShort,
  type LoanData,
  type OverpaymentSettings
} from '../mortgageCalculations'

describe('mortgageCalculations', () => {
  describe('calculateMonthlyPayment', () => {
    it('should calculate equal monthly payment correctly', () => {
      const principal = 500000
      const monthlyRate = 0.055 / 12 // 5.5% annual
      const months = 360 // 30 years
      
      const payment = calculateMonthlyPayment(principal, monthlyRate, months, 'equal')
      
      expect(payment).toBeCloseTo(2838.95, 2) // Expected payment for these parameters
    })

    it('should calculate decreasing monthly payment correctly', () => {
      const principal = 500000
      const monthlyRate = 0.055 / 12
      const months = 360
      
      const payment = calculateMonthlyPayment(principal, monthlyRate, months, 'decreasing')
      
      expect(payment).toBeCloseTo(1388.89, 2) // Principal portion only
    })

    it('should handle zero interest rate', () => {
      const principal = 500000
      const monthlyRate = 0
      const months = 360
      
      const payment = calculateMonthlyPayment(principal, monthlyRate, months, 'equal')
      
      expect(payment).toBeCloseTo(1388.89, 2) // Principal / months
    })
  })

  describe('calculateMortgageSchedule', () => {
    const basicLoanData: LoanData = {
      amount: 500000,
      interestRate: 5.5,
      termMonths: 360,
      paymentType: 'equal'
    }

    const noOverpaymentSettings: OverpaymentSettings = {
      baseAmount: 0,
      effect: 'shorten_term'
    }

    const overpaymentSettings: OverpaymentSettings = {
      baseAmount: 1000,
      effect: 'shorten_term'
    }

    it('should calculate basic mortgage schedule without overpayments', () => {
      const result = calculateMortgageSchedule(basicLoanData, noOverpaymentSettings)
      
      expect(result.monthlySchedule).toHaveLength(360)
      expect(result.actualTermMonths).toBe(360)
      expect(result.originalTermMonths).toBe(360)
      expect(result.interestSaved).toBeCloseTo(0, 2)
      
      // First payment should have correct structure
      const firstPayment = result.monthlySchedule[0]
      expect(firstPayment.month).toBe(1)
      expect(firstPayment.overpayment).toBe(0)
      expect(firstPayment.remainingBalance).toBeLessThan(500000)
      expect(firstPayment.date).toBeInstanceOf(Date)
    })

    it('should calculate mortgage schedule with overpayments', () => {
      const result = calculateMortgageSchedule(basicLoanData, overpaymentSettings)
      
      expect(result.actualTermMonths).toBeLessThan(360)
      expect(result.interestSaved).toBeGreaterThan(0)
      expect(result.totalInterest).toBeLessThan(result.totalInterestWithoutOverpayment)
      
      // All payments should have overpayment
      result.monthlySchedule.forEach(payment => {
        if (payment.remainingBalance > 0) {
          expect(payment.overpayment).toBe(1000)
        }
      })
    })

    it('should handle custom overpayments', () => {
      const customOverpayments = { 1: 2000, 2: 1500, 12: 3000 }
      const result = calculateMortgageSchedule(basicLoanData, overpaymentSettings, customOverpayments)
      
      // Custom overpayments should be applied
      expect(result.monthlySchedule[0].overpayment).toBe(2000)
      expect(result.monthlySchedule[0].customOverpayment).toBe(2000)
      expect(result.monthlySchedule[1].overpayment).toBe(1500)
      expect(result.monthlySchedule[1].customOverpayment).toBe(1500)
      
      // Non-custom months should use base amount
      expect(result.monthlySchedule[2].overpayment).toBe(1000)
      expect(result.monthlySchedule[2].customOverpayment).toBeUndefined()
    })

    it('should handle decreasing payment type', () => {
      const decreasingLoan: LoanData = {
        ...basicLoanData,
        paymentType: 'decreasing'
      }
      
      const result = calculateMortgageSchedule(decreasingLoan, noOverpaymentSettings)
      
      expect(result.monthlySchedule).toHaveLength(360)
      
      // With decreasing payments, principal portion should be constant
      const principalPayments = result.monthlySchedule.map(p => p.principalPayment)
      expect(principalPayments[0]).toBeCloseTo(principalPayments[1], 0)
    })

    it('should calculate correct dates progression', () => {
      const startDate = new Date('2025-01-01')
      const result = calculateMortgageSchedule(basicLoanData, overpaymentSettings, {}, startDate)
      
      expect(result.monthlySchedule[0].date.getFullYear()).toBe(2025)
      expect(result.monthlySchedule[0].date.getMonth()).toBe(0) // January
      expect(result.monthlySchedule[0].date.getDate()).toBe(1)
      
      // Second payment should be February
      expect(result.monthlySchedule[1].date.getMonth()).toBe(1) // February
      
      // 12th payment should be December of same year
      expect(result.monthlySchedule[11].date.getMonth()).toBe(11) // December
      expect(result.monthlySchedule[11].date.getFullYear()).toBe(2025)
      
      // 13th payment should be January of next year
      expect(result.monthlySchedule[12].date.getMonth()).toBe(0) // January
      expect(result.monthlySchedule[12].date.getFullYear()).toBe(2026)
    })

    it('should not overpay beyond remaining balance', () => {
      const smallLoan: LoanData = {
        amount: 10000,
        interestRate: 5.5,
        termMonths: 12,
        paymentType: 'equal'
      }
      
      const largeOverpayment: OverpaymentSettings = {
        baseAmount: 5000,
        effect: 'shorten_term'
      }
      
      const result = calculateMortgageSchedule(smallLoan, largeOverpayment)
      
      // Should finish early
      expect(result.actualTermMonths).toBeLessThan(12)
      
      // Last payment should not exceed remaining balance
      const lastPayment = result.monthlySchedule[result.monthlySchedule.length - 1]
      expect(lastPayment.remainingBalance).toBe(0)
    })
  })

  describe('formatCurrency', () => {
    it('should format Polish currency correctly', () => {
      const result500k = formatCurrency(500000)
      const result1234 = formatCurrency(1234.56)
      const result0 = formatCurrency(0)
      
      expect(result500k).toContain('500')
      expect(result500k).toContain('000')
      expect(result500k).toContain('zł')
      expect(result1234).toContain('1')
      expect(result1234).toContain('235')
      expect(result1234).toContain('zł')
      expect(result0).toContain('0')
      expect(result0).toContain('zł')
    })

    it('should handle negative amounts', () => {
      const result = formatCurrency(-500)
      expect(result).toContain('-500')
      expect(result).toContain('zł')
    })

    it('should round to nearest integer', () => {
      const result1 = formatCurrency(1234.89)
      const result2 = formatCurrency(1234.12)
      expect(result1.includes('1235') || result1.includes('1 235')).toBe(true)
      expect(result2.includes('1234') || result2.includes('1 234')).toBe(true)
    })
  })

  describe('formatDate', () => {
    it('should format dates in Polish', () => {
      const date = new Date('2025-01-01')
      expect(formatDate(date)).toBe('styczeń 2025')
    })

    it('should handle different months', () => {
      expect(formatDate(new Date('2025-06-01'))).toBe('czerwiec 2025')
      expect(formatDate(new Date('2025-12-01'))).toBe('grudzień 2025')
    })
  })

  describe('formatDateShort', () => {
    it('should format dates in short format', () => {
      const date = new Date('2025-01-01')
      expect(formatDateShort(date)).toBe('01.2025')
    })

    it('should handle different months with proper padding', () => {
      expect(formatDateShort(new Date('2025-06-01'))).toBe('06.2025')
      expect(formatDateShort(new Date('2025-12-01'))).toBe('12.2025')
    })
  })

  describe('edge cases', () => {
    it('should handle very small loan amounts', () => {
      const smallLoan: LoanData = {
        amount: 1000,
        interestRate: 5.5,
        termMonths: 12,
        paymentType: 'equal'
      }
      
      const result = calculateMortgageSchedule(smallLoan, { baseAmount: 0, effect: 'shorten_term' })
      
      expect(result.monthlySchedule).toHaveLength(12)
      expect(result.totalInterest).toBeGreaterThan(0)
    })

    it('should handle very high interest rates', () => {
      const highInterestLoan: LoanData = {
        amount: 100000,
        interestRate: 20,
        termMonths: 120,
        paymentType: 'equal'
      }
      
      const result = calculateMortgageSchedule(highInterestLoan, { baseAmount: 0, effect: 'shorten_term' })
      
      expect(result.monthlySchedule).toHaveLength(120)
      expect(result.totalInterest).toBeGreaterThan(highInterestLoan.amount)
    })

    it('should handle very short loan terms', () => {
      const shortLoan: LoanData = {
        amount: 100000,
        interestRate: 5.5,
        termMonths: 6,
        paymentType: 'equal'
      }
      
      const result = calculateMortgageSchedule(shortLoan, { baseAmount: 0, effect: 'shorten_term' })
      
      expect(result.monthlySchedule).toHaveLength(6)
      expect(result.actualTermMonths).toBe(6)
    })
  })
})