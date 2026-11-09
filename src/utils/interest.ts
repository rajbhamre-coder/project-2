import type { Payment, LoanCalculation, LoanStatus } from '../types';

/**
 * Parses YYYY-MM-DD or ISO string into local Date object at 00:00:00 local time
 * to prevent any timezone offset issues.
 */
export function parseDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) {
    return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
  }

  // Handle YYYY-MM-DD
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Calculates calendar day difference (d2 - d1).
 * Positive if d2 is in the future compared to d1.
 */
export function getCalendarDaysDiff(d1: Date, d2: Date): number {
  const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
  const diffMs = t2 - t1;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Core Interest & Status Calculation
 * Formula:
 * - SIMPLE interest, rate is PER MONTH.
 * - interest = principal * (rate / 100) * (days_elapsed / 30)
 * - days_elapsed = number of days from date given to today (never negative)
 * - total_payable = principal + interest
 * - pending = max(0, total_payable - sum(payments))
 * - status: "paid" if pending is about 0; "overdue" if today is after the due date; "due soon" if due within 7 days; else "ok"
 */
export function calculateLoanDetails(
  principal: number,
  monthlyRate: number,
  dateGiven: string | Date,
  dueDate: string | Date,
  payments: Payment[] = [],
  asOfDate: string | Date = new Date()
): LoanCalculation {
  const pGiven = parseDate(dateGiven);
  const pDue = parseDate(dueDate);
  const pAsOf = parseDate(asOfDate);

  // days_elapsed = number of days from the date given to today (never negative)
  const rawElapsed = getCalendarDaysDiff(pGiven, pAsOf);
  const daysElapsed = Math.max(0, rawElapsed);

  // Monthly interest amount = principal * (rate / 100)
  const monthlyInterest = Number((principal * (monthlyRate / 100)).toFixed(2));

  // interest = principal * (rate / 100) * (days_elapsed / 30)
  const rawInterest = principal * (monthlyRate / 100) * (daysElapsed / 30);
  const interestAccrued = Number(rawInterest.toFixed(2));

  // total_payable = principal + interest
  const totalPayable = Number((principal + interestAccrued).toFixed(2));

  // sum(payments)
  const totalPaid = Number(
    payments
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      .toFixed(2)
  );

  // pending = max(0, total_payable - sum(payments))
  const pendingAmount = Math.max(0, Number((totalPayable - totalPaid).toFixed(2)));

  // Days until due date (negative means overdue)
  const daysUntilDue = getCalendarDaysDiff(pAsOf, pDue);

  // status determination
  // Paid if pending is about 0 (allow 0.01 tolerance for float rounding)
  const isPaid = pendingAmount <= 0.05;
  const isOverdue = !isPaid && daysUntilDue < 0;
  const isDueToday = !isPaid && daysUntilDue === 0;
  const isDueSoon = !isPaid && daysUntilDue > 0 && daysUntilDue <= 7;

  let status: LoanStatus = 'ok';
  let statusLabel = '';

  if (isPaid) {
    status = 'paid';
    statusLabel = 'Fully paid';
  } else if (isOverdue) {
    status = 'overdue';
    const absDays = Math.abs(daysUntilDue);
    statusLabel = `Overdue by ${absDays} ${absDays === 1 ? 'day' : 'days'}`;
  } else if (isDueToday) {
    status = 'due_soon';
    statusLabel = 'Due today';
  } else if (isDueSoon) {
    status = 'due_soon';
    statusLabel = `Due in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`;
  } else {
    status = 'ok';
    statusLabel = `Due in ${daysUntilDue} days`;
  }

  return {
    principal,
    monthlyRate,
    monthlyInterest,
    daysElapsed,
    interestAccrued,
    totalPayable,
    totalPaid,
    pendingAmount,
    status,
    statusLabel,
    daysUntilDue,
    isOverdue,
    isDueSoon: isDueSoon || isDueToday,
    isDueToday,
    isPaid,
  };
}

/**
 * Format Indian Rupee currency (e.g. ₹1,50,000 or ₹1,50,000.50)
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const rounded = showDecimals ? amount : Math.round(amount);
  
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(rounded);

    // Standardize symbol with a space or keep standard
    return formatted;
  } catch {
    return `₹${rounded.toLocaleString('en-IN')}`;
  }
}

/**
 * Format date in standard Indian business style: "09 Nov 2026"
 */
export function formatDisplayDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date in short style: "09/11/2026"
 */
export function formatShortDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  const d = parseDate(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Generates today's date in YYYY-MM-DD for form defaults
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a YYYY-MM-DD date string
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
