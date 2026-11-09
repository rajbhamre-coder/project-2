import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Layers,
  Share2,
} from 'lucide-react';
import type { Loan, LoanCalculation } from '../types';
import { formatINR, formatDisplayDate } from '../utils/interest';
import { ConfirmModal } from './ConfirmModal';

interface BorrowerDetailModalProps {
  isOpen: boolean;
  loans: (Loan & { calculation: LoanCalculation })[];
  onClose: () => void;
  onAddPayment: (loanId: string) => void;
  onEditLoan: (loan: Loan) => void;
  onDeleteLoan: (loanId: string) => void;
  onDeletePayment: (loanId: string, paymentId: string) => void;
  onAddNewLoanForBorrower: (borrowerName: string, borrowerPhone?: string) => void;
}

export const BorrowerDetailModal: React.FC<BorrowerDetailModalProps> = ({
  isOpen,
  loans,
  onClose,
  onAddPayment,
  onEditLoan,
  onDeleteLoan,
  onDeletePayment,
  onAddNewLoanForBorrower,
}) => {
  const [selectedLoanIndex, setSelectedLoanIndex] = useState(0);
  const [confirmDeleteLoanId, setConfirmDeleteLoanId] = useState<string | null>(null);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState<{ loanId: string; paymentId: string } | null>(null);
  const [copiedReminder, setCopiedReminder] = useState(false);

  if (!isOpen || loans.length === 0) return null;

  // Active loan in focus
  const activeLoan = loans[selectedLoanIndex] || loans[0];
  const { calculation } = activeLoan;
  const borrowerName = activeLoan.borrowerName;
  const borrowerPhone = activeLoan.borrowerPhone;

  // Aggregate stats across all loans of this borrower if multiple
  const aggregatePending = loans.reduce((s, l) => s + l.calculation.pendingAmount, 0);

  // Status badge styling
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800';
      case 'due_soon':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  // WhatsApp reminder generator
  const getWhatsAppReminderUrl = () => {
    const cleanPhone = (borrowerPhone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const message = `Hello ${borrowerName}, a gentle reminder from Udhaar Book that ${formatINR(calculation.pendingAmount)} is due on ${formatDisplayDate(activeLoan.dueDate)}. Please arrange the payment at your earliest convenience. Thank you!`;
    
    if (phoneWithCountry) {
      return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const copyReminderMessage = () => {
    const message = `Hello ${borrowerName}, a gentle reminder from Udhaar Book that ${formatINR(calculation.pendingAmount)} is due on ${formatDisplayDate(activeLoan.dueDate)}. Please arrange the payment at your earliest convenience. Thank you!`;
    navigator.clipboard.writeText(message);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div 
        className="w-full max-w-2xl my-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {borrowerName}
              </h2>
              {loans.length > 1 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {loans.length} Loans
                </span>
              )}
            </div>

            {borrowerPhone ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>+91 {borrowerPhone}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                No phone number added
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Bar: Call, WhatsApp, Add Another Loan */}
        <div className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {borrowerPhone ? (
              <a
                href={`tel:${borrowerPhone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Call</span>
              </a>
            ) : null}

            <a
              href={getWhatsAppReminderUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-600 text-white shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Send WhatsApp</span>
            </a>

            <button
              onClick={copyReminderMessage}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
              title="Copy reminder text to clipboard"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedReminder ? 'Copied!' : 'Copy Msg'}</span>
            </button>
          </div>

          <button
            onClick={() => onAddNewLoanForBorrower(borrowerName, borrowerPhone)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Another Loan</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Multiple Loan Tabs */}
          {loans.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Select Loan ({selectedLoanIndex + 1} of {loans.length})
                </span>
                <span className="text-xs text-slate-500">
                  Combined Pending: <strong className="text-red-600 dark:text-red-400">{formatINR(aggregatePending)}</strong>
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {loans.map((loan, idx) => (
                  <button
                    key={loan.id}
                    onClick={() => setSelectedLoanIndex(idx)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      selectedLoanIndex === idx
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Loan #{idx + 1}: {formatINR(loan.principal)} ({loan.calculation.statusLabel})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pending Banner & Status */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                  Pending Balance to Recover
                </span>
                <div className="text-3xl sm:text-4xl font-black font-numeric text-white mt-1 flex items-center gap-1">
                  <span className="text-emerald-400">{formatINR(calculation.pendingAmount)}</span>
                </div>
              </div>

              <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getBadgeStyle(calculation.status)}`}>
                {calculation.statusLabel}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Principal Given</span>
                <span className="text-sm font-bold text-white mt-0.5">{formatINR(activeLoan.principal)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Interest Accrued</span>
                <span className="text-sm font-bold text-amber-400 mt-0.5">+{formatINR(calculation.interestAccrued)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Payable</span>
                <span className="text-sm font-bold text-white mt-0.5">{formatINR(calculation.totalPayable)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Paid</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5">-{formatINR(calculation.totalPaid)}</span>
              </div>
            </div>
          </div>

          {/* Interest & Loan Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Monthly Interest Rate</span>
              <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
                {activeLoan.monthlyRate}% <span className="text-xs font-normal text-slate-500">/ month</span>
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
                = {formatINR(calculation.monthlyInterest)} / month
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Date Given</span>
              <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
                {formatDisplayDate(activeLoan.dateGiven)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                {calculation.daysElapsed} days elapsed
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Due Date</span>
              <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
                {formatDisplayDate(activeLoan.dueDate)}
              </span>
              <span className={`text-[11px] font-semibold mt-1 block ${calculation.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {calculation.statusLabel}
              </span>
            </div>
          </div>

          {/* Notes if present */}
          {activeLoan.notes && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              <strong className="block text-amber-800 dark:text-amber-300 font-semibold mb-0.5">Notes:</strong>
              {activeLoan.notes}
            </div>
          )}

          {/* Part Payments Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Payment History ({activeLoan.payments?.length || 0})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Payments subtracted from (principal + interest)
                </p>
              </div>

              <button
                type="button"
                onClick={() => onAddPayment(activeLoan.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Payment</span>
              </button>
            </div>

            {(!activeLoan.payments || activeLoan.payments.length === 0) ? (
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No payments recorded yet for this loan.
                </p>
                <button
                  onClick={() => onAddPayment(activeLoan.id)}
                  className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Record first payment
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {activeLoan.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white font-numeric text-base">
                            {formatINR(p.amount)}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            • {formatDisplayDate(p.date)}
                          </span>
                        </div>
                        {p.note && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {p.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setConfirmDeletePayment({ loanId: activeLoan.id, paymentId: p.id })}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      title="Delete wrongly entered payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions: Edit, Delete Loan */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setConfirmDeleteLoanId(activeLoan.id)}
            className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Loan</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditLoan(activeLoan)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Delete Loan Confirmation */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteLoanId)}
        title="Delete this loan entry?"
        message="Are you sure you want to permanently delete this loan record and all its associated payments? This action cannot be undone."
        confirmText="Yes, Delete Loan"
        onConfirm={() => {
          if (confirmDeleteLoanId) {
            onDeleteLoan(confirmDeleteLoanId);
            setConfirmDeleteLoanId(null);
            onClose();
          }
        }}
        onCancel={() => setConfirmDeleteLoanId(null)}
      />

      {/* Delete Payment Confirmation */}
      <ConfirmModal
        isOpen={Boolean(confirmDeletePayment)}
        title="Delete this payment?"
        message="Are you sure you want to delete this payment record? The pending loan balance will be re-calculated accordingly."
        confirmText="Yes, Delete Payment"
        onConfirm={() => {
          if (confirmDeletePayment) {
            onDeletePayment(confirmDeletePayment.loanId, confirmDeletePayment.paymentId);
            setConfirmDeletePayment(null);
          }
        }}
        onCancel={() => setConfirmDeletePayment(null)}
      />
    </div>
  );
};
