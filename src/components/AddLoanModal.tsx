import React, { useState, useEffect } from 'react';
import { X, Check, Phone, User, Percent, IndianRupee, FileText } from 'lucide-react';
import type { Loan } from '../types';
import { formatINR, getTodayString, addDaysToDate, parseDate } from '../utils/interest';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (loanData: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'payments'>) => Promise<void>;
  editLoan?: Loan | null;
  initialBorrowerName?: string;
  initialBorrowerPhone?: string;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editLoan = null,
  initialBorrowerName = '',
  initialBorrowerPhone = '',
}) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [principal, setPrincipal] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('2.0'); // 2% per month default in India
  const [dateGiven, setDateGiven] = useState(getTodayString());
  const [dueDate, setDueDate] = useState(addDaysToDate(getTodayString(), 30));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens or editLoan changes
  useEffect(() => {
    if (editLoan) {
      setBorrowerName(editLoan.borrowerName);
      setBorrowerPhone(editLoan.borrowerPhone || '');
      setPrincipal(String(editLoan.principal));
      setMonthlyRate(String(editLoan.monthlyRate));
      setDateGiven(editLoan.dateGiven);
      setDueDate(editLoan.dueDate);
      setNotes(editLoan.notes || '');
    } else {
      const today = getTodayString();
      setBorrowerName(initialBorrowerName || '');
      setBorrowerPhone(initialBorrowerPhone || '');
      setPrincipal('');
      setMonthlyRate('2.0');
      setDateGiven(today);
      setDueDate(addDaysToDate(today, 30));
      setNotes('');
    }
    setError(null);
  }, [isOpen, editLoan, initialBorrowerName, initialBorrowerPhone]);

  if (!isOpen) return null;

  const numPrincipal = parseFloat(principal) || 0;
  const numRate = parseFloat(monthlyRate) || 0;
  const monthlyInterestPreview = (numPrincipal * (numRate / 100));

  const setDueInMonths = (months: number) => {
    const days = Math.round(months * 30.41);
    setDueDate(addDaysToDate(dateGiven, days));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowerName.trim()) {
      setError('Please enter borrower name');
      return;
    }
    if (numPrincipal <= 0) {
      setError('Amount given must be greater than ₹0');
      return;
    }
    if (numRate < 0) {
      setError('Interest rate cannot be negative');
      return;
    }
    if (!dateGiven || !dueDate) {
      setError('Please provide both Date Given and Due Date');
      return;
    }

    const dGiven = parseDate(dateGiven);
    const dDue = parseDate(dueDate);
    if (dDue < dGiven) {
      setError('Due date must be on or after the date given');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        borrowerName: borrowerName.trim(),
        borrowerPhone: borrowerPhone.trim() || undefined,
        principal: numPrincipal,
        monthlyRate: numRate,
        dateGiven,
        dueDate,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to save loan. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div 
        className="w-full max-w-lg my-8 rounded-2xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {editLoan ? 'Edit Loan Record' : 'Add New Person / Loan'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Enter loan details, monthly interest rate, and repayment due date.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Borrower Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Borrower Name *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel, Rajesh Bhai"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phone Number (Optional for WhatsApp reminders)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={borrowerPhone}
                onChange={(e) => setBorrowerPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Amount and Rate row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Amount Given (Principal) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="50,000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-lg font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Interest Rate (% per month) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Percent className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="100"
                  placeholder="2.0"
                  value={monthlyRate}
                  onChange={(e) => setMonthlyRate(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-lg font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Monthly Interest calculation hint */}
          {numPrincipal > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>Monthly Interest: <strong>{formatINR(monthlyInterestPreview)}/month</strong></span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                (~{formatINR(monthlyInterestPreview / 30)}/day)
              </span>
            </div>
          )}

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date Given *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateGiven}
                  onChange={(e) => setDateGiven(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Due Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick preset due dates */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Quick Due:</span>
            {[
              { label: '+1 Month', months: 1 },
              { label: '+3 Months', months: 3 },
              { label: '+6 Months', months: 6 },
              { label: '+1 Year', months: 12 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDueInMonths(preset.months)}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes (Optional)
            </label>
            <div className="relative">
              <span className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <textarea
                rows={2}
                placeholder="e.g. Purpose of loan, cheque number, guarantor details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              {submitting ? 'Saving...' : editLoan ? 'Save Changes' : 'Create Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
