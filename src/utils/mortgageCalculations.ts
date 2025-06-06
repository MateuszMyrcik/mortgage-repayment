export interface LoanData {
  amount: number;
  interestRate: number;
  termMonths: number;
  paymentType: 'equal' | 'decreasing';
}

export interface OverpaymentSettings {
  baseAmount: number;
  effect: 'shorten_term' | 'reduce_payment';
}

export interface MonthlyPayment {
  month: number;
  date: Date;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  overpayment: number;
  customOverpayment?: number;
  remainingBalance: number;
}

export interface CalculationResult {
  monthlySchedule: MonthlyPayment[];
  totalInterest: number;
  totalInterestWithoutOverpayment: number;
  interestSaved: number;
  actualTermMonths: number;
  originalTermMonths: number;
}

export function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  months: number,
  paymentType: 'equal' | 'decreasing'
): number {
  if (paymentType === 'equal') {
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  } else {
    return principal / months;
  }
}

export function calculateMortgageSchedule(
  loanData: LoanData,
  overpaymentSettings: OverpaymentSettings,
  customOverpayments: Record<number, number> = {},
  startDate: Date = new Date()
): CalculationResult {
  const { amount, interestRate, termMonths, paymentType } = loanData;
  const { baseAmount } = overpaymentSettings;
  
  const monthlyRate = interestRate / 100 / 12;
  const monthlySchedule: MonthlyPayment[] = [];
  
  let remainingBalance = amount;
  let currentMonth = 1;
  let totalInterest = 0;
  
  // Create a copy of start date to avoid mutating the original
  const currentDate = new Date(startDate);
  
  // Calculate original schedule without overpayments for comparison
  const originalMonthlyPayment = calculateMonthlyPayment(amount, monthlyRate, termMonths, paymentType);
  const totalInterestWithoutOverpayment = (originalMonthlyPayment * termMonths) - amount;
  
  while (remainingBalance > 0.01 && currentMonth <= termMonths * 2) { // Safety limit
    const interestPayment = remainingBalance * monthlyRate;
    
    let principalPayment: number;
    if (paymentType === 'equal') {
      const baseMonthlyPayment = calculateMonthlyPayment(amount, monthlyRate, termMonths, paymentType);
      principalPayment = baseMonthlyPayment - interestPayment;
    } else {
      principalPayment = amount / termMonths;
    }
    
    // Ensure we don't overpay
    principalPayment = Math.min(principalPayment, remainingBalance);
    
    const totalPayment = principalPayment + interestPayment;
    
    // Apply overpayment
    const overpayment = customOverpayments[currentMonth] ?? baseAmount;
    const actualOverpayment = Math.min(overpayment, remainingBalance - principalPayment);
    
    const finalPrincipalPayment = principalPayment + actualOverpayment;
    remainingBalance -= finalPrincipalPayment;
    totalInterest += interestPayment;
    
    monthlySchedule.push({
      month: currentMonth,
      date: new Date(currentDate),
      principalPayment: finalPrincipalPayment,
      interestPayment,
      totalPayment: totalPayment + actualOverpayment,
      overpayment: actualOverpayment,
      customOverpayment: customOverpayments[currentMonth],
      remainingBalance: Math.max(0, remainingBalance)
    });
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentMonth++;
  }
  
  return {
    monthlySchedule,
    totalInterest,
    totalInterestWithoutOverpayment,
    interestSaved: totalInterestWithoutOverpayment - totalInterest,
    actualTermMonths: monthlySchedule.length,
    originalTermMonths: termMonths
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: 'long'
  }).format(date);
}

export function formatDateShort(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit'
  }).format(date);
}