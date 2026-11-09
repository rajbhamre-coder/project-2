import React, { useState } from 'react';
import { X, Check, IndianRupee } from 'lucide-react';
import { formatINR, getTodayString } from '../utils/interest';

interface AddPaymentModalProps {
  isOpen: boolean;
  loanId: string;
  borrowerName: string;
  pendingAmount: number;
  onClose: () => void;
  onSubmit: (loanId: string, payment: { amount: number; date: string; note?: string }) => Promise<void>;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  loanId,
  borrowerName,
  pendingAmount,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const remainingPending = Math.max(0, pendingAmount - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Please enter a valid payment amount greater than ₹0');
      return;
    }
    if (!date) {
      setError('Please select a payment date');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(loanId, {
        amount: numAmount,
        date,
        note: note.trim() || undefined,
      });
      // reset and close
      setAmount('');
      setNote('');
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const setFullAmount = () => {
    setAmount(String(Math.round(pendingAmount)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Record Payment
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              for <span className="font-semibold text-emerald-600 dark:text-emerald-400">{borrowerName}</span>
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Payment Amount (₹) *
              </label>
              <button
                type="button"
                onClick={setFullAmount}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Pay Full ({formatINR(pendingAmount)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <IndianRupee className="w-5 h-5" />
              </span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="w-full pl-10 pr-4 py-3 text-xl font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[1000, 2000, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 transition-colors"
                >
                  +{formatINR(preset)}
                </button>
              ))}
            </div>

            {/* Remaining amount preview */}
            {numAmount > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Remaining Balance:</span>
                <span className={`font-bold ${remainingPending === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {formatINR(remainingPending)} {remainingPending === 0 && '(Fully Paid!)'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Note / Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cash, GPay, PhonePe, Bank NEFT"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
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
              disabled={submitting || numAmount <= 0}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              {submitting ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
