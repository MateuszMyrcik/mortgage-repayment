import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryPanel } from '../SummaryPanel'
import type { CalculationResult } from '../../utils/mortgageCalculations'

describe('SummaryPanel', () => {
  const mockResult: CalculationResult = {
    monthlySchedule: [
      {
        month: 1,
        date: new Date('2025-01-01'),
        principalPayment: 2000,
        interestPayment: 2291.67,
        totalPayment: 4291.67,
        overpayment: 1000,
        remainingBalance: 498000
      },
      {
        month: 2,
        date: new Date('2025-02-01'),
        principalPayment: 2010,
        interestPayment: 2281.67,
        totalPayment: 4291.67,
        overpayment: 1000,
        remainingBalance: 495990
      }
    ],
    totalInterest: 150000,
    totalInterestWithoutOverpayment: 200000,
    interestSaved: 50000,
    actualTermMonths: 250,
    originalTermMonths: 360
  }

  it('should display savings information', () => {
    render(<SummaryPanel result={mockResult} />)

    expect(screen.getByText(/zaoszczędzone odsetki/i)).toBeInTheDocument()
    expect(screen.getByText(/50[\s ]?000[\s ]?zł|50000[\s ]?zł/)).toBeInTheDocument()
  })

  it('should display term reduction information', () => {
    render(<SummaryPanel result={mockResult} />)

    expect(screen.getByText(/skrócenie okresu/i)).toBeInTheDocument()
    // 360 - 250 = 110 months = 9 years 2 months
    expect(screen.getByText(/9 lat 2 miesięcy/)).toBeInTheDocument()
  })

  it('should display payment information', () => {
    render(<SummaryPanel result={mockResult} />)

    expect(screen.getByText(/łączne nadpłaty/i)).toBeInTheDocument()
    expect(screen.getByText(/całkowita kwota spłacona/i)).toBeInTheDocument()
    
    // Should show overpayment amounts
    expect(screen.getByText(/2[\s ]?000[\s ]?zł|2000[\s ]?zł/)).toBeInTheDocument()
    
    // Should show total paid amounts
    expect(screen.getByText(/8[\s ]?583[\s ]?zł|8583[\s ]?zł/)).toBeInTheDocument()
  })

  it('should display interest information', () => {
    render(<SummaryPanel result={mockResult} />)

    expect(screen.getByText(/odsetki bez nadpłat/i)).toBeInTheDocument()
    expect(screen.getByText(/odsetki z nadpłatami/i)).toBeInTheDocument()
    
    expect(screen.getByText(/200[\s ]?000[\s ]?zł|200000[\s ]?zł/)).toBeInTheDocument()
    expect(screen.getByText(/150[\s ]?000[\s ]?zł|150000[\s ]?zł/)).toBeInTheDocument()
  })

  it('should display term information', () => {
    render(<SummaryPanel result={mockResult} />)

    expect(screen.getByText(/pierwotny okres/i)).toBeInTheDocument()
    expect(screen.getByText(/rzeczywisty okres/i)).toBeInTheDocument()
    
    // 360 months = 30 years 0 months
    expect(screen.getByText('30 lat 0 miesięcy')).toBeInTheDocument()
    
    // 250 months = 20 years 10 months
    expect(screen.getByText('20 lat 10 miesięcy')).toBeInTheDocument()
  })

  it('should display summary conclusion', () => {
    render(<SummaryPanel result={mockResult} />)

    expect(screen.getByText(/wniosek/i)).toBeInTheDocument()
    expect(screen.getByText(/zaoszczędzisz/i)).toBeInTheDocument()
    expect(screen.getByText(/skrócisz okres spłaty/i)).toBeInTheDocument()
  })

  it('should handle zero savings correctly', () => {
    const noSavingsResult: CalculationResult = {
      ...mockResult,
      interestSaved: 0,
      actualTermMonths: 360,
      originalTermMonths: 360
    }

    render(<SummaryPanel result={noSavingsResult} />)

    expect(screen.getByText(/0[\s ]?zł|0zł/)).toBeInTheDocument()
    expect(screen.getByText('0 miesięcy')).toBeInTheDocument()
  })

  it('should handle different time periods correctly', () => {
    const customResult: CalculationResult = {
      ...mockResult,
      actualTermMonths: 300, // 25 years
      originalTermMonths: 360 // 30 years
    }

    render(<SummaryPanel result={customResult} />)

    // Savings: 360 - 300 = 60 months = 5 years 0 months
    expect(screen.getByText('5 lat 0 miesięcy')).toBeInTheDocument()
  })

  it('should handle months only (less than a year saved)', () => {
    const customResult: CalculationResult = {
      ...mockResult,
      actualTermMonths: 354, // 29 years 6 months
      originalTermMonths: 360 // 30 years
    }

    render(<SummaryPanel result={customResult} />)

    // Savings: 360 - 354 = 6 months
    expect(screen.getByText('6 miesięcy')).toBeInTheDocument()
  })

  it('should display all summary cards', () => {
    render(<SummaryPanel result={mockResult} />)

    expect(screen.getByText(/oszczędności/i)).toBeInTheDocument()
    expect(screen.getByText(/spłaty/i)).toBeInTheDocument()
    expect(screen.getByText(/odsetki/i)).toBeInTheDocument()
    expect(screen.getByText(/okres kredytowania/i)).toBeInTheDocument()
  })
})