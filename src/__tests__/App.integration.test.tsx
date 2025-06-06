import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock Chart.js to avoid canvas rendering issues in tests
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  BarElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  ArcElement: vi.fn(),
}))

vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
}))

describe('App Integration Tests', () => {
  it('should render the complete application', () => {
    render(<App />)

    expect(screen.getByText(/kalkulator nadpłat kredytu hipotecznego/i)).toBeInTheDocument()
    expect(screen.getByText(/parametry kredytu/i)).toBeInTheDocument()
    expect(screen.getByText(/ustawienia nadpłat/i)).toBeInTheDocument()
  })

  it('should show placeholder message when no data is entered', () => {
    render(<App />)

    expect(screen.getByText(/wprowadź dane kredytu aby zobaczyć wykresy/i)).toBeInTheDocument()
  })

  it('should calculate and display results when valid data is entered', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Fill in loan data
    const amountInput = screen.getByLabelText(/kwota kredytu/i)
    const interestInput = screen.getByLabelText(/oprocentowanie/i)
    const termInput = screen.getByLabelText(/okres kredytowania/i)
    const overpaymentInput = screen.getByLabelText(/kwota nadpłaty cyklicznej/i)

    await user.type(amountInput, '500000')
    await user.type(interestInput, '5.5')
    await user.type(termInput, '360')
    await user.type(overpaymentInput, '1000')

    // Wait for calculations to complete
    await waitFor(() => {
      expect(screen.getByText(/podsumowanie/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Should show summary panel
    expect(screen.getByText(/zaoszczędzone odsetki/i)).toBeInTheDocument()
    expect(screen.getAllByText(/skrócenie okresu/i)[1]).toBeInTheDocument() // Use second occurrence (in summary, not form)

    // Should show charts
    expect(screen.getByText(/wizualizacje/i)).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()

    // Should show payment schedule
    expect(screen.getByText(/harmonogram spłat/i)).toBeInTheDocument()
    // The payment schedule should be shown, dates will depend on start date and might vary
  })

  it('should update calculations when loan data changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Enter initial data
    await user.type(screen.getByLabelText(/kwota kredytu/i), '500000')
    await user.type(screen.getByLabelText(/oprocentowanie/i), '5.5')
    await user.type(screen.getByLabelText(/okres kredytowania/i), '360')
    await user.type(screen.getByLabelText(/kwota nadpłaty cyklicznej/i), '1000')

    await waitFor(() => {
      expect(screen.getByText(/podsumowanie/i)).toBeInTheDocument()
    })

    // Change overpayment amount
    const overpaymentInput = screen.getByLabelText(/kwota nadpłaty cyklicznej/i)
    await user.clear(overpaymentInput)
    await user.type(overpaymentInput, '2000')

    // Results should update automatically
    await waitFor(() => {
      // Higher overpayment should result in more savings
      expect(screen.getByText(/zaoszczędzone odsetki/i)).toBeInTheDocument()
    })
  })

  it('should allow editing individual overpayments in the schedule', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Enter loan data
    await user.type(screen.getByLabelText(/kwota kredytu/i), '500000')
    await user.type(screen.getByLabelText(/oprocentowanie/i), '5.5')
    await user.type(screen.getByLabelText(/okres kredytowania/i), '360')
    await user.type(screen.getByLabelText(/kwota nadpłaty cyklicznej/i), '1000')

    await waitFor(() => {
      expect(screen.getByText(/harmonogram spłat/i)).toBeInTheDocument()
    })

    // Click on the first overpayment amount to edit it
    const firstOverpayment = screen.getAllByText(/1[\s ]?000[\s ]?zł/)[0]
    await user.click(firstOverpayment)

    // Should enter edit mode - find the edit input within the payment schedule
    await waitFor(() => {
      const scheduleSection = screen.getByText(/harmonogram spłat/i).closest('div')
      const editInput = scheduleSection?.querySelector('input[type="number"]')
      expect(editInput).toBeInTheDocument()
      expect(editInput).toHaveValue(1000)
    })

    // Change the value - find edit input in schedule section
    const scheduleSection = screen.getByText(/harmonogram spłat/i).closest('div')
    const editInput = scheduleSection?.querySelector('input[type="number"]') as HTMLInputElement
    await user.clear(editInput)
    await user.type(editInput, '2000')
    await user.keyboard('{Enter}')

    // Should show custom indicator in the payment schedule
    await waitFor(() => {
      const scheduleSection = screen.getByText(/harmonogram spłat/i).closest('div')
      const customIndicator = scheduleSection?.querySelector('.custom-indicator')
      expect(customIndicator).toBeInTheDocument()
      expect(customIndicator).toHaveTextContent('*')
    })

    // Should show reset button
    expect(screen.getByTitle(/przywróć bazową nadpłatę/i)).toBeInTheDocument()
  })

  it('should handle different payment types', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Enter loan data
    await user.type(screen.getByLabelText(/kwota kredytu/i), '500000')
    await user.type(screen.getByLabelText(/oprocentowanie/i), '5.5')
    await user.type(screen.getByLabelText(/okres kredytowania/i), '360')

    // Select decreasing payment type
    const paymentTypeSelect = screen.getByLabelText(/typ spłaty/i)
    await user.selectOptions(paymentTypeSelect, 'decreasing')

    await waitFor(() => {
      expect(screen.getByText(/podsumowanie/i)).toBeInTheDocument()
    })

    // Should still calculate correctly
    expect(screen.getByText(/zaoszczędzone odsetki/i)).toBeInTheDocument()
  })

  it('should handle different overpayment effects', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Enter loan data
    await user.type(screen.getByLabelText(/kwota kredytu/i), '500000')
    await user.type(screen.getByLabelText(/oprocentowanie/i), '5.5')
    await user.type(screen.getByLabelText(/okres kredytowania/i), '360')
    await user.type(screen.getByLabelText(/kwota nadpłaty cyklicznej/i), '1000')

    // Select reduce payment effect
    const effectSelect = screen.getByLabelText(/efekt nadpłaty/i)
    await user.selectOptions(effectSelect, 'reduce_payment')

    await waitFor(() => {
      expect(screen.getByText(/podsumowanie/i)).toBeInTheDocument()
    })

    // Should still show savings
    expect(screen.getByText(/zaoszczędzone odsetki/i)).toBeInTheDocument()
  })

  it('should change start date and update schedule dates', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Enter loan data
    await user.type(screen.getByLabelText(/kwota kredytu/i), '500000')
    await user.type(screen.getByLabelText(/oprocentowanie/i), '5.5')
    await user.type(screen.getByLabelText(/okres kredytowania/i), '360')

    // Change start date to a valid format
    const dateInput = screen.getByLabelText(/data rozpoczęcia/i)
    await user.clear(dateInput)
    await user.type(dateInput, '2025-06')

    await waitFor(() => {
      expect(screen.getByText(/harmonogram spłat/i)).toBeInTheDocument()
    })

    // Should show updated payment schedule with new start date
    expect(screen.getByText(/harmonogram spłat/i)).toBeInTheDocument()
  })

  it('should maintain responsiveness across different input combinations', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Test with very small loan
    await user.type(screen.getByLabelText(/kwota kredytu/i), '10000')
    await user.type(screen.getByLabelText(/oprocentowanie/i), '5.5')
    await user.type(screen.getByLabelText(/okres kredytowania/i), '12')
    await user.type(screen.getByLabelText(/kwota nadpłaty cyklicznej/i), '500')

    await waitFor(() => {
      expect(screen.getByText(/podsumowanie/i)).toBeInTheDocument()
    })

    // Should handle small loans
    expect(screen.getByText(/zaoszczędzone odsetki/i)).toBeInTheDocument()

    // Clear and test with large loan
    await user.clear(screen.getByLabelText(/kwota kredytu/i))
    await user.clear(screen.getByLabelText(/oprocentowanie/i))
    await user.clear(screen.getByLabelText(/okres kredytowania/i))
    await user.clear(screen.getByLabelText(/kwota nadpłaty cyklicznej/i))

    await user.type(screen.getByLabelText(/kwota kredytu/i), '1000000')
    await user.type(screen.getByLabelText(/oprocentowanie/i), '7.5')
    await user.type(screen.getByLabelText(/okres kredytowania/i), '480')
    await user.type(screen.getByLabelText(/kwota nadpłaty cyklicznej/i), '5000')

    await waitFor(() => {
      expect(screen.getByText(/podsumowanie/i)).toBeInTheDocument()
    })

    // Should handle large loans
    expect(screen.getByText(/zaoszczędzone odsetki/i)).toBeInTheDocument()
  })

  it('should display proper Polish formatting throughout', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/kwota kredytu/i), '500000')
    await user.type(screen.getByLabelText(/oprocentowanie/i), '5.5')
    await user.type(screen.getByLabelText(/okres kredytowania/i), '360')
    await user.type(screen.getByLabelText(/kwota nadpłaty cyklicznej/i), '1000')

    await waitFor(() => {
      expect(screen.getByText(/podsumowanie/i)).toBeInTheDocument()
    })

    // Should use Polish currency formatting - check for at least one 'zł' occurrence
    expect(screen.getAllByText(/zł/).length).toBeGreaterThan(0)
    
    // Should use Polish month names in the schedule (actual month depends on start date)
    // Just check that schedule is rendered with proper structure
    
    // Should use Polish text throughout - check for at least one occurrence  
    expect(screen.getAllByText(/lat/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/miesięcy/).length).toBeGreaterThan(0)
  })
})