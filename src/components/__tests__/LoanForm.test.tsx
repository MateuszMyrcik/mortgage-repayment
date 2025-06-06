import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoanForm } from '../LoanForm'
import type { LoanData, OverpaymentSettings } from '../../utils/mortgageCalculations'

describe('LoanForm', () => {
  const mockLoanData: LoanData = {
    amount: 0,
    interestRate: 0,
    termMonths: 0,
    paymentType: 'equal'
  }

  const mockOverpaymentSettings: OverpaymentSettings = {
    baseAmount: 0,
    effect: 'shorten_term'
  }

  const mockStartDate = new Date('2025-01-01')

  const mockProps = {
    loanData: mockLoanData,
    overpaymentSettings: mockOverpaymentSettings,
    startDate: mockStartDate,
    onLoanDataChange: vi.fn(),
    onOverpaymentSettingsChange: vi.fn(),
    onStartDateChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all form fields', () => {
    render(<LoanForm {...mockProps} />)

    expect(screen.getByLabelText(/kwota kredytu/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/oprocentowanie/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/okres kredytowania/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/typ spłaty/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/data rozpoczęcia/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/kwota nadpłaty cyklicznej/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/efekt nadpłaty/i)).toBeInTheDocument()
  })

  it('should display placeholder text in empty inputs', () => {
    render(<LoanForm {...mockProps} />)

    expect(screen.getByPlaceholderText('np. 500000')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('np. 5.5')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('np. 360 (30 lat)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('np. 1000')).toBeInTheDocument()
  })

  it('should call onLoanDataChange when amount input changes', async () => {
    const user = userEvent.setup()
    render(<LoanForm {...mockProps} />)

    const amountInput = screen.getByLabelText(/kwota kredytu/i)
    await user.click(amountInput)
    await user.paste('500000')

    // Check that the final value was processed correctly
    expect(mockProps.onLoanDataChange).toHaveBeenCalledWith({
      ...mockLoanData,
      amount: 500000
    })
  })

  it('should call onLoanDataChange when interest rate changes', async () => {
    const user = userEvent.setup()
    render(<LoanForm {...mockProps} />)

    const interestInput = screen.getByLabelText(/oprocentowanie/i)
    await user.click(interestInput)
    await user.paste('5.5')

    // Check that the final value was processed correctly
    expect(mockProps.onLoanDataChange).toHaveBeenCalledWith({
      ...mockLoanData,
      interestRate: 5.5
    })
  })

  it('should call onLoanDataChange when term changes', async () => {
    const user = userEvent.setup()
    render(<LoanForm {...mockProps} />)

    const termInput = screen.getByLabelText(/okres kredytowania/i)
    await user.click(termInput)
    await user.paste('360')

    // Check that the final value was processed correctly
    expect(mockProps.onLoanDataChange).toHaveBeenCalledWith({
      ...mockLoanData,
      termMonths: 360
    })
  })

  it('should call onLoanDataChange when payment type changes', async () => {
    const user = userEvent.setup()
    render(<LoanForm {...mockProps} />)

    const paymentTypeSelect = screen.getByLabelText(/typ spłaty/i)
    await user.selectOptions(paymentTypeSelect, 'decreasing')

    expect(mockProps.onLoanDataChange).toHaveBeenCalledWith({
      ...mockLoanData,
      paymentType: 'decreasing'
    })
  })

  it('should call onOverpaymentSettingsChange when base amount changes', async () => {
    const user = userEvent.setup()
    render(<LoanForm {...mockProps} />)

    const overpaymentInput = screen.getByLabelText(/kwota nadpłaty cyklicznej/i)
    await user.click(overpaymentInput)
    await user.paste('1000')

    // Check that the final value was processed correctly
    expect(mockProps.onOverpaymentSettingsChange).toHaveBeenCalledWith({
      ...mockOverpaymentSettings,
      baseAmount: 1000
    })
  })

  it('should call onOverpaymentSettingsChange when effect changes', async () => {
    const user = userEvent.setup()
    render(<LoanForm {...mockProps} />)

    const effectSelect = screen.getByLabelText(/efekt nadpłaty/i)
    await user.selectOptions(effectSelect, 'reduce_payment')

    expect(mockProps.onOverpaymentSettingsChange).toHaveBeenCalledWith({
      ...mockOverpaymentSettings,
      effect: 'reduce_payment'
    })
  })

  it('should call onStartDateChange when date changes', async () => {
    const user = userEvent.setup()
    render(<LoanForm {...mockProps} />)

    const dateInput = screen.getByLabelText(/data rozpoczęcia/i)
    await user.clear(dateInput)
    await user.type(dateInput, '2025-06')

    expect(mockProps.onStartDateChange).toHaveBeenCalled()
  })

  it('should handle empty input values correctly', async () => {
    const user = userEvent.setup()
    render(<LoanForm {...mockProps} />)

    const amountInput = screen.getByLabelText(/kwota kredytu/i)
    await user.type(amountInput, '500000')
    await user.clear(amountInput)

    expect(mockProps.onLoanDataChange).toHaveBeenLastCalledWith({
      ...mockLoanData,
      amount: 0
    })
  })

  it('should display current values when provided', () => {
    const propsWithValues = {
      ...mockProps,
      loanData: {
        amount: 500000,
        interestRate: 5.5,
        termMonths: 360,
        paymentType: 'equal' as const
      },
      overpaymentSettings: {
        baseAmount: 1000,
        effect: 'shorten_term' as const
      }
    }

    render(<LoanForm {...propsWithValues} />)

    expect(screen.getByDisplayValue('500000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5.5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('360')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument()
  })

  it('should show empty string for zero values', () => {
    render(<LoanForm {...mockProps} />)

    const amountInput = screen.getByLabelText(/kwota kredytu/i) as HTMLInputElement
    const interestInput = screen.getByLabelText(/oprocentowanie/i) as HTMLInputElement
    const termInput = screen.getByLabelText(/okres kredytowania/i) as HTMLInputElement
    const overpaymentInput = screen.getByLabelText(/kwota nadpłaty/i) as HTMLInputElement

    expect(amountInput.value).toBe('')
    expect(interestInput.value).toBe('')
    expect(termInput.value).toBe('')
    expect(overpaymentInput.value).toBe('')
  })
})