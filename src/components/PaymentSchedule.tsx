import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/mortgageCalculations';
import type { MonthlyPayment } from '../utils/mortgageCalculations';

interface PaymentScheduleProps {
  schedule: MonthlyPayment[];
  baseOverpayment: number;
  onOverpaymentChange: (month: number, amount: number) => void;
}

export const PaymentSchedule: React.FC<PaymentScheduleProps> = ({
  schedule,
  baseOverpayment,
  onOverpaymentChange
}) => {
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const startEdit = (month: number, currentOverpayment: number) => {
    setEditingMonth(month);
    setEditValue(currentOverpayment.toString());
  };

  const saveEdit = () => {
    if (editingMonth !== null) {
      const newAmount = parseFloat(editValue) || 0;
      onOverpaymentChange(editingMonth, newAmount);
      setEditingMonth(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingMonth(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const resetToBase = (month: number) => {
    onOverpaymentChange(month, baseOverpayment);
  };

  return (
    <div className="payment-schedule">
      <h3>Harmonogram spłat</h3>
      
      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Nr</th>
              <th>Data spłaty</th>
              <th>Rata kapitałowa</th>
              <th>Rata odsetkowa</th>
              <th>Suma rat</th>
              <th>Nadpłata</th>
              <th>Saldo pozostałe</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((payment) => (
              <tr key={payment.month} className={payment.customOverpayment !== undefined ? 'custom-overpayment' : ''}>
                <td>{payment.month}</td>
                <td className="date-cell">{formatDate(payment.date)}</td>
                <td>{formatCurrency(payment.principalPayment - payment.overpayment)}</td>
                <td>{formatCurrency(payment.interestPayment)}</td>
                <td>{formatCurrency(payment.totalPayment - payment.overpayment)}</td>
                <td className="overpayment-cell">
                  {editingMonth === payment.month ? (
                    <div className="edit-overpayment">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={saveEdit}
                        autoFocus
                        min="0"
                        step="100"
                      />
                    </div>
                  ) : (
                    <div className="overpayment-display">
                      <span 
                        className={`overpayment-amount ${payment.customOverpayment !== undefined ? 'custom' : 'base'}`}
                        onClick={() => startEdit(payment.month, payment.overpayment)}
                      >
                        {formatCurrency(payment.overpayment)}
                      </span>
                      {payment.customOverpayment !== undefined && (
                        <span className="custom-indicator">*</span>
                      )}
                    </div>
                  )}
                </td>
                <td>{formatCurrency(payment.remainingBalance)}</td>
                <td className="actions-cell">
                  <button
                    onClick={() => startEdit(payment.month, payment.overpayment)}
                    className="edit-btn"
                    title="Edytuj nadpłatę"
                  >
                    ⚡
                  </button>
                  {payment.customOverpayment !== undefined && (
                    <button
                      onClick={() => resetToBase(payment.month)}
                      className="reset-btn"
                      title="Przywróć bazową nadpłatę"
                    >
                      ↺
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="legend">
        <p><span className="legend-item custom">*</span> - Kwota nadpłaty została zmieniona ręcznie</p>
        <p><span className="legend-item base">Kliknij na kwotę nadpłaty aby ją edytować</span></p>
      </div>
    </div>
  );
};