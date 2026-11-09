import * as XLSX from 'xlsx';
import type { Loan, LoanCalculation } from '../types';
import { formatDisplayDate } from './interest';

interface LoanForExport extends Loan {
  calculation: LoanCalculation;
}

export function exportLoansToExcel(loans: LoanForExport[], filename = 'Udhaar_Book_Report') {
  const rows = loans.map((loan, idx) => {
    const paymentsSummary = (loan.payments || [])
      .map((p) => `${formatDisplayDate(p.date)}: ₹${p.amount}${p.note ? ` (${p.note})` : ''}`)
      .join('; ');

    return {
      'S.No': idx + 1,
      'Borrower Name': loan.borrowerName,
      'Phone Number': loan.borrowerPhone || '-',
      'Principal (₹)': loan.principal,
      'Monthly Rate (%)': `${loan.monthlyRate}%`,
      'Monthly Interest (₹)': loan.calculation.monthlyInterest,
      'Date Given': formatDisplayDate(loan.dateGiven),
      'Due Date': formatDisplayDate(loan.dueDate),
      'Days Elapsed': loan.calculation.daysElapsed,
      'Interest Accrued (₹)': loan.calculation.interestAccrued,
      'Total Payable (₹)': loan.calculation.totalPayable,
      'Total Paid (₹)': loan.calculation.totalPaid,
      'Pending Balance (₹)': loan.calculation.pendingAmount,
      'Status': loan.calculation.statusLabel,
      'Payments Count': loan.payments ? loan.payments.length : 0,
      'Payment History': paymentsSummary || 'No payments recorded',
      'Notes': loan.notes || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for readable Excel display
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Borrower Name
    { wch: 15 }, // Phone Number
    { wch: 14 }, // Principal
    { wch: 16 }, // Monthly Rate
    { wch: 18 }, // Monthly Interest
    { wch: 14 }, // Date Given
    { wch: 14 }, // Due Date
    { wch: 13 }, // Days Elapsed
    { wch: 18 }, // Interest Accrued
    { wch: 16 }, // Total Payable
    { wch: 14 }, // Total Paid
    { wch: 18 }, // Pending Balance
    { wch: 18 }, // Status
    { wch: 15 }, // Payments Count
    { wch: 40 }, // Payment History
    { wch: 30 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Udhaar Book');

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
}

export function exportLoansToCSV(loans: LoanForExport[], filename = 'Udhaar_Book_Report') {
  const headers = [
    'Borrower Name',
    'Phone',
    'Principal',
    'Monthly Rate %',
    'Date Given',
    'Due Date',
    'Days Elapsed',
    'Interest Accrued',
    'Total Payable',
    'Total Paid',
    'Pending Balance',
    'Status',
    'Notes'
  ];

  const rows = loans.map((loan) => [
    `"${loan.borrowerName.replace(/"/g, '""')}"`,
    `"${(loan.borrowerPhone || '').replace(/"/g, '""')}"`,
    loan.principal,
    loan.monthlyRate,
    loan.dateGiven,
    loan.dueDate,
    loan.calculation.daysElapsed,
    loan.calculation.interestAccrued,
    loan.calculation.totalPayable,
    loan.calculation.totalPaid,
    loan.calculation.pendingAmount,
    `"${loan.calculation.statusLabel}"`,
    `"${(loan.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().split('T')[0];
  a.download = `${filename}_${timestamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
