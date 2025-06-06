// Google Analytics configuration and utilities
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with your actual GA4 Measurement ID

// Check if user has given consent
export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('mortgage_calculator_consent') === 'true';
};

// Initialize Google Analytics (only call this after user consent)
export const initGA = () => {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  // Prevent multiple initializations
  if (typeof window.gtag === 'function') return;

  // Create script element for Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
    anonymize_ip: true, // GDPR compliance
    allow_google_signals: false, // Disable advertising features
    allow_ad_personalization_signals: false // Disable ad personalization
  });
};

// Track custom events (only if consent given)
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window === 'undefined' || !hasAnalyticsConsent() || !window.gtag) return;
  
  window.gtag('event', eventName, parameters);
};

// Track page views (only if consent given)
export const trackPageView = (page_title: string, page_location: string) => {
  if (typeof window === 'undefined' || !hasAnalyticsConsent() || !window.gtag) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title,
    page_location,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
};

// Mortgage calculator specific tracking events
export const trackMortgageCalculation = (data: {
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  paymentType: string;
  hasOverpayment: boolean;
}) => {
  trackEvent('mortgage_calculation', {
    loan_amount_range: getLoanAmountRange(data.loanAmount),
    interest_rate_range: getInterestRateRange(data.interestRate),
    term_years: Math.round(data.termMonths / 12),
    payment_type: data.paymentType,
    has_overpayment: data.hasOverpayment,
  });
};

export const trackOverpaymentChange = (monthNumber: number, amount: number) => {
  trackEvent('overpayment_change', {
    month_number: monthNumber,
    amount_range: getOverpaymentRange(amount),
  });
};

// Helper functions to categorize data for privacy
const getLoanAmountRange = (amount: number): string => {
  if (amount < 100000) return '0-100k';
  if (amount < 300000) return '100k-300k';
  if (amount < 500000) return '300k-500k';
  if (amount < 1000000) return '500k-1M';
  return '1M+';
};

const getInterestRateRange = (rate: number): string => {
  if (rate < 3) return '0-3%';
  if (rate < 5) return '3-5%';
  if (rate < 7) return '5-7%';
  if (rate < 10) return '7-10%';
  return '10%+';
};

const getOverpaymentRange = (amount: number): string => {
  if (amount === 0) return 'none';
  if (amount < 500) return '1-500';
  if (amount < 1000) return '500-1k';
  if (amount < 2000) return '1k-2k';
  if (amount < 5000) return '2k-5k';
  return '5k+';
};