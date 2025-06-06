import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { CalculationResult } from '../utils/mortgageCalculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartsProps {
  result: CalculationResult;
}

export const Charts: React.FC<ChartsProps> = ({ result }) => {
  const { monthlySchedule, totalInterest, interestSaved } = result;

  // Generate chart data
  const generateBalanceChartData = () => {
    const labels = monthlySchedule.slice(0, Math.min(60, monthlySchedule.length)).map((_, index) => {
      if (index % 12 === 0) {
        return `Rok ${Math.floor(index / 12) + 1}`;
      }
      return '';
    });

    return {
      labels,
      datasets: [
        {
          label: 'Saldo pozostałe',
          data: monthlySchedule.slice(0, Math.min(60, monthlySchedule.length)).map(payment => payment.remainingBalance),
          borderColor: '#00ffff',
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointBackgroundColor: '#00ffff',
          pointBorderColor: '#ffffff',
          pointRadius: 2,
        }
      ]
    };
  };

  const generatePaymentBreakdownData = () => {
    const samplePayments = monthlySchedule.slice(0, Math.min(24, monthlySchedule.length));
    const labels = samplePayments.map((_, index) => `M${index + 1}`);

    return {
      labels,
      datasets: [
        {
          label: 'Kapitał',
          data: samplePayments.map(payment => payment.principalPayment - payment.overpayment),
          backgroundColor: 'rgba(0, 255, 255, 0.8)',
          borderColor: '#00ffff',
          borderWidth: 1,
        },
        {
          label: 'Odsetki',
          data: samplePayments.map(payment => payment.interestPayment),
          backgroundColor: 'rgba(255, 0, 128, 0.8)',
          borderColor: '#ff0080',
          borderWidth: 1,
        },
        {
          label: 'Nadpłaty',
          data: samplePayments.map(payment => payment.overpayment),
          backgroundColor: 'rgba(255, 255, 0, 0.8)',
          borderColor: '#ffff00',
          borderWidth: 1,
        }
      ]
    };
  };

  const generateInterestComparisonData = () => {
    const totalPrincipal = monthlySchedule.length > 0 ? monthlySchedule[0].remainingBalance + monthlySchedule[0].principalPayment : 0;

    return {
      labels: ['Kapitał', 'Odsetki z nadpłatami', 'Zaoszczędzone odsetki'],
      datasets: [
        {
          data: [totalPrincipal, totalInterest, interestSaved],
          backgroundColor: [
            'rgba(0, 255, 255, 0.8)',
            'rgba(255, 0, 128, 0.8)',
            'rgba(0, 255, 0, 0.8)',
          ],
          borderColor: [
            '#00ffff',
            '#ff0080',
            '#00ff00',
          ],
          borderWidth: 2,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: {
            family: 'Share Tech Mono',
            size: 12,
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.9)',
        titleColor: '#00ffff',
        bodyColor: '#ffffff',
        borderColor: '#00ffff',
        borderWidth: 1,
        titleFont: {
          family: 'Orbitron',
          size: 14,
        },
        bodyFont: {
          family: 'Share Tech Mono',
          size: 12,
        },
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y || context.parsed;
            return `${context.dataset.label}: ${new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#888888',
          font: {
            family: 'Share Tech Mono',
            size: 10,
          }
        },
        grid: {
          color: 'rgba(0, 255, 255, 0.1)',
        }
      },
      y: {
        ticks: {
          color: '#888888',
          font: {
            family: 'Share Tech Mono',
            size: 10,
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
          }
        },
        grid: {
          color: 'rgba(0, 255, 255, 0.1)',
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          font: {
            family: 'Share Tech Mono',
            size: 12,
          },
          padding: 20,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.9)',
        titleColor: '#00ffff',
        bodyColor: '#ffffff',
        borderColor: '#00ffff',
        borderWidth: 1,
        titleFont: {
          family: 'Orbitron',
          size: 14,
        },
        bodyFont: {
          family: 'Share Tech Mono',
          size: 12,
        },
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            return `${context.label}: ${new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value)}`;
          }
        }
      }
    }
  };

  if (monthlySchedule.length === 0) {
    return (
      <div className="charts-container">
        <div className="no-data-message">
          <h3>Wprowadź dane kredytu aby zobaczyć wykresy</h3>
          <p>Wypełnij formularz powyżej aby wygenerować wizualizacje</p>
        </div>
      </div>
    );
  }

  return (
    <div className="charts-container">
      <h3>Wizualizacje</h3>
      
      <div className="charts-grid">
        <div className="chart-card">
          <h4>Saldo kredytu w czasie</h4>
          <div className="chart-wrapper">
            <Line data={generateBalanceChartData()} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>Struktura płatności (pierwsze 2 lata)</h4>
          <div className="chart-wrapper">
            <Bar data={generatePaymentBreakdownData()} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>Porównanie kosztów</h4>
          <div className="chart-wrapper">
            <Doughnut data={generateInterestComparisonData()} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};