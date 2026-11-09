import { describe, it, expect } from 'vitest';
import {
  calculateLoanDetails,
  formatINR,
} from './interest';
import type { Payment } from '../types';

describe('Interest and Loan Calculations', () => {
  it('correctly calculates 0 interest when 0 days have elapsed', () => {
    const result = calculateLoanDetails(
      100000,
      2, // 2% per month
      '2026-11-01',
      '2026-12-01',
      [],
      '2026-11-01'
    );

    expect(result.daysElapsed).toBe(0);
    expect(result.interestAccrued).toBe(0);
    expect(result.totalPayable).toBe(100000);
    expect(result.pendingAmount).toBe(100000);
    expect(result.status).toBe('ok');
  });

  it('correctly calculates simple interest for exactly 30 days (1 full month)', () => {
    // 100,000 at 2% per month for 30 days = 2,000
    const result = calculateLoanDetails(
      100000,
      2,
      '2026-10-01',
      '2026-11-15',
      [],
      '2026-10-31'
    );

    expect(result.daysElapsed).toBe(30);
    expect(result.monthlyInterest).toBe(2000);
    expect(result.interestAccrued).toBe(2000);
    expect(result.totalPayable).toBe(102000);
    expect(result.pendingAmount).toBe(102000);
  });

  it('correctly calculates proportional interest for 15 days (half month)', () => {
    // 50,000 at 3% per month for 15 days:
    // 50,000 * 0.03 * (15 / 30) = 50,000 * 0.03 * 0.5 = 750
    const result = calculateLoanDetails(
      50000,
      3,
      '2026-10-01',
      '2026-11-01',
      [],
      '2026-10-16'
    );

    expect(result.daysElapsed).toBe(15);
    expect(result.monthlyInterest).toBe(1500);
    expect(result.interestAccrued).toBe(750);
    expect(result.totalPayable).toBe(50750);
    expect(result.pendingAmount).toBe(50750);
  });

  it('never has negative days_elapsed if dateGiven is in the future', () => {
    const result = calculateLoanDetails(
      50000,
      2,
      '2026-11-15',
      '2026-12-15',
      [],
      '2026-11-01'
    );

    expect(result.daysElapsed).toBe(0);
    expect(result.interestAccrued).toBe(0);
    expect(result.totalPayable).toBe(50000);
  });

  it('correctly subtracts multiple part payments from principal + interest', () => {
    // Principal: 50,000, Rate: 2%, Days: 60 (2 full 30-day periods)
    // Interest = 50,000 * 0.02 * (60 / 30) = 2,000
    // Total payable = 52,000
    const payments: Payment[] = [
      { id: '1', amount: 10000, date: '2026-10-15', createdAt: 1 },
      { id: '2', amount: 15000, date: '2026-11-01', createdAt: 2 },
    ];

    const result = calculateLoanDetails(
      50000,
      2,
      '2026-09-01',
      '2026-11-15',
      payments,
      '2026-10-31'
    );

    expect(result.daysElapsed).toBe(60);
    expect(result.interestAccrued).toBe(2000);
    expect(result.totalPayable).toBe(52000);
    expect(result.totalPaid).toBe(25000);
    expect(result.pendingAmount).toBe(27000); // 52,000 - 25,000
  });

  it('identifies Fully paid when pending is zero or overpaid', () => {
    const payments: Payment[] = [
      { id: '1', amount: 52000, date: '2026-10-30', createdAt: 1 },
    ];

    const result = calculateLoanDetails(
      50000,
      2,
      '2026-09-01',
      '2026-10-01', // Due date was in past!
      payments,
      '2026-10-31' // Today is past due date, BUT fully paid
    );

    expect(result.pendingAmount).toBe(0);
    expect(result.status).toBe('paid');
    expect(result.statusLabel).toBe('Fully paid');
    expect(result.isPaid).toBe(true);
    expect(result.isOverdue).toBe(false);
  });

  it('identifies Overdue when today is after due date and pending > 0', () => {
    const result = calculateLoanDetails(
      50000,
      2,
      '2026-10-01',
      '2026-10-25', // Due 25th Oct
      [],
      '2026-10-30' // 5 days past due date
    );

    expect(result.status).toBe('overdue');
    expect(result.daysUntilDue).toBe(-5);
    expect(result.statusLabel).toBe('Overdue by 5 days');
    expect(result.isOverdue).toBe(true);
  });

  it('identifies Due today when today matches due date', () => {
    const result = calculateLoanDetails(
      50000,
      2,
      '2026-10-01',
      '2026-10-31',
      [],
      '2026-10-31'
    );

    expect(result.status).toBe('due_soon');
    expect(result.daysUntilDue).toBe(0);
    expect(result.statusLabel).toBe('Due today');
    expect(result.isDueToday).toBe(true);
  });

  it('identifies Due soon when within 7 days', () => {
    const result = calculateLoanDetails(
      50000,
      2,
      '2026-10-01',
      '2026-11-05',
      [],
      '2026-11-01' // 4 days remaining
    );

    expect(result.status).toBe('due_soon');
    expect(result.daysUntilDue).toBe(4);
    expect(result.statusLabel).toBe('Due in 4 days');
    expect(result.isDueSoon).toBe(true);
  });

  it('identifies OK status when due in more than 7 days', () => {
    const result = calculateLoanDetails(
      50000,
      2,
      '2026-10-01',
      '2026-11-20',
      [],
      '2026-11-01' // 19 days remaining
    );

    expect(result.status).toBe('ok');
    expect(result.daysUntilDue).toBe(19);
    expect(result.statusLabel).toBe('Due in 19 days');
    expect(result.isDueSoon).toBe(false);
    expect(result.isOverdue).toBe(false);
  });

  it('formats Indian currency properly with ₹ symbol and commas', () => {
    expect(formatINR(150000)).toMatch(/₹\s?1,50,000/);
    expect(formatINR(5000)).toMatch(/₹\s?5,000/);
    expect(formatINR(1000000)).toMatch(/₹\s?10,00,000/);
  });
});
