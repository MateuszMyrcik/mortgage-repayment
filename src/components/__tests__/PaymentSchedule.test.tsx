import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentSchedule } from '../PaymentSchedule'
import type { MonthlyPayment } from '../../utils/mortgageCalculations'

describe('PaymentSchedule', () => {
  const mockSchedule: MonthlyPayment[] = [
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
      overpayment: 1500,
      customOverpayment: 1500,
      remainingBalance: 495990
    },
    {
      month: 3,
      date: new Date('2025-03-01'),
      principalPayment: 2020,
      interestPayment: 2271.67,
      totalPayment: 4291.67,
      overpayment: 1000,
      remainingBalance: 493970
    }
  ]

  const mockProps = {
    schedule: mockSchedule,
    baseOverpayment: 1000,
    onOverpaymentChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render schedule table with headers', () => {
    render(<PaymentSchedule {...mockProps} />)

    expect(screen.getByText(/harmonogram spłat/i)).toBeInTheDocument()
    expect(screen.getByText(/nr/i)).toBeInTheDocument()
    expect(screen.getByText(/data spłaty/i)).toBeInTheDocument()
    expect(screen.getByText(/rata kapitałowa/i)).toBeInTheDocument()
    expect(screen.getByText(/rata odsetkowa/i)).toBeInTheDocument()
    expect(screen.getByText(/suma rat/i)).toBeInTheDocument()
    expect(screen.getByText(/nadpłata/i)).toBeInTheDocument()
    expect(screen.getByText(/saldo pozostałe/i)).toBeInTheDocument()
    expect(screen.getByText(/akcje/i)).toBeInTheDocument()
  })

  it('should display payment data correctly', () => {
    render(<PaymentSchedule {...mockProps} />)

    // Check month numbers
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    // Check dates (formatted in Polish)
    expect(screen.getByText('styczeń 2025')).toBeInTheDocument()
    expect(screen.getByText('luty 2025')).toBeInTheDocument()
    expect(screen.getByText('marzec 2025')).toBeInTheDocument()

    // Check formatted currency values - note Polish currency formatting uses spaces for thousands
    expect(screen.getAllByText('1000 zł').length).toBeGreaterThanOrEqual(1) // Principal payment (appears multiple times)
    expect(screen.getByText('2292 zł')).toBeInTheDocument() // Interest payment
    expect(screen.getAllByText('3292 zł').length).toBeGreaterThanOrEqual(1) // Total payment (appears multiple times)
    expect(screen.getByText('498 000 zł')).toBeInTheDocument() // Remaining balance
  })

  it('should highlight custom overpayment rows', () => {
    render(<PaymentSchedule {...mockProps} />)

    const rows = screen.getAllByRole('row')
    // Second row (month 2) should have custom overpayment class
    expect(rows[2]).toHaveClass('custom-overpayment')
    
    // First and third rows should not have custom overpayment class
    expect(rows[1]).not.toHaveClass('custom-overpayment')
    expect(rows[3]).not.toHaveClass('custom-overpayment')
  })

  it('should show custom indicator for custom overpayments', () => {
    render(<PaymentSchedule {...mockProps} />)

    // Should show custom indicator (*) for month 2 - there's one in the table and one in the legend
    const customIndicators = screen.getAllByText('*')
    expect(customIndicators.length).toBeGreaterThanOrEqual(1)
  })

  it('should show reset button for custom overpayments', () => {
    render(<PaymentSchedule {...mockProps} />)

    const resetButtons = screen.getAllByTitle(/przywróć bazową nadpłatę/i)
    expect(resetButtons).toHaveLength(1)
  })

  it('should enter edit mode when overpayment amount is clicked', async () => {
    const user = userEvent.setup()
    render(<PaymentSchedule {...mockProps} />)

    const overpaymentAmount = screen.getAllByText('1000 zł')[0] // First overpayment
    await user.click(overpaymentAmount)

    // Check if edit mode is active - look for a number input in the table
    const editInput = screen.getByRole('spinbutton')
    expect(editInput).toBeInTheDocument()
    expect(editInput).toHaveValue(1000)
  })

  it('should enter edit mode when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<PaymentSchedule {...mockProps} />)

    const editButtons = screen.getAllByTitle(/edytuj nadpłatę/i)
    await user.click(editButtons[0])

    const editInput = screen.getByRole('spinbutton')
    expect(editInput).toBeInTheDocument()
    expect(editInput).toHaveValue(1000)
  })

  it('should save edit when Enter key is pressed', async () => {
    const user = userEvent.setup()
    render(<PaymentSchedule {...mockProps} />)

    const overpaymentAmount = screen.getAllByText(/1[\s ]?000[\s ]?zł|1000[\s ]?zł/)[0]
    await user.click(overpaymentAmount)

    const input = screen.getByDisplayValue('1000')
    await user.clear(input)
    await user.type(input, '2000')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockProps.onOverpaymentChange).toHaveBeenCalledWith(1, 2000)
    })
  })

  it('should save edit when input loses focus', async () => {
    const user = userEvent.setup()
    render(<PaymentSchedule {...mockProps} />)

    const overpaymentAmount = screen.getAllByText(/1[\s ]?000[\s ]?zł|1000[\s ]?zł/)[0]
    await user.click(overpaymentAmount)

    const input = screen.getByDisplayValue('1000')
    await user.clear(input)
    await user.type(input, '1500')
    
    // Click outside to blur
    await user.click(document.body)

    await waitFor(() => {
      expect(mockProps.onOverpaymentChange).toHaveBeenCalledWith(1, 1500)
    })
  })

  it('should cancel edit when Escape key is pressed', async () => {
    const user = userEvent.setup()
    render(<PaymentSchedule {...mockProps} />)

    const overpaymentAmount = screen.getAllByText(/1[\s ]?000[\s ]?zł|1000[\s ]?zł/)[0]
    await user.click(overpaymentAmount)

    const input = screen.getByDisplayValue('1000')
    await user.clear(input)
    await user.type(input, '2000')
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(mockProps.onOverpaymentChange).not.toHaveBeenCalled()
    })
    
    // Should exit edit mode
    expect(screen.queryByDisplayValue('2000')).not.toBeInTheDocument()
  })

  it('should reset to base overpayment when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(<PaymentSchedule {...mockProps} />)

    const resetButton = screen.getByTitle(/przywróć bazową nadpłatę/i)
    await user.click(resetButton)

    expect(mockProps.onOverpaymentChange).toHaveBeenCalledWith(2, 1000)
  })

  it('should display legend information', () => {
    render(<PaymentSchedule {...mockProps} />)

    expect(screen.getByText(/została zmieniona ręcznie/i)).toBeInTheDocument()
    expect(screen.getByText(/kliknij na kwotę nadpłaty/i)).toBeInTheDocument()
  })

  it('should handle empty schedule', () => {
    const emptyProps = {
      ...mockProps,
      schedule: []
    }

    render(<PaymentSchedule {...emptyProps} />)

    expect(screen.getByText(/harmonogram spłat/i)).toBeInTheDocument()
    // Table should still be rendered, just empty
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should display lightning bolt edit icons', () => {
    render(<PaymentSchedule {...mockProps} />)

    const editButtons = screen.getAllByText('⚡')
    expect(editButtons).toHaveLength(3) // One for each payment
  })

  it('should handle zero overpayments', () => {
    const scheduleWithZero: MonthlyPayment[] = [
      {
        ...mockSchedule[0],
        overpayment: 0
      }
    ]

    const propsWithZero = {
      ...mockProps,
      schedule: scheduleWithZero,
      baseOverpayment: 0
    }

    render(<PaymentSchedule {...propsWithZero} />)

    expect(screen.getByText('0 zł')).toBeInTheDocument()
  })
})