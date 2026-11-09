import React, { useState } from 'react';
import { Bell, AlertTriangle, Clock, ChevronDown, ChevronUp, MessageCircle, Phone, ArrowUpRight } from 'lucide-react';
import type { Loan, LoanCalculation } from '../types';
import { formatINR, formatDisplayDate } from '../utils/interest';

interface RemindersSectionProps {
  reminders: (Loan & { calculation: LoanCalculation })[];
  onSelectLoan: (loan: Loan & { calculation: LoanCalculation }) => void;
}

export const RemindersSection: React.FC<RemindersSectionProps> = ({ reminders, onSelectLoan }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (reminders.length === 0) {
    return null;
  }

  const overdueCount = reminders.filter((r) => r.calculation.status === 'overdue').length;
  const dueSoonCount = reminders.length - overdueCount;

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
            <Bell className="w-5 h-5 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {reminders.length}
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Action Required Reminders
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-semibold">
              {overdueCount > 0 && (
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {overdueCount} Overdue
                </span>
              )}
              {overdueCount > 0 && dueSoonCount > 0 && <span className="text-slate-300">•</span>}
              {dueSoonCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {dueSoonCount} Due within 7 days
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Reminders list */}
      {isExpanded && (
        <div className="p-3 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60">
          <div className="space-y-2 mt-3">
            {reminders.map((loan) => {
              const isOverdue = loan.calculation.status === 'overdue';
              const cleanPhone = (loan.borrowerPhone || '').replace(/\D/g, '');
              const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
              const waMessage = `Hello ${loan.borrowerName}, a gentle reminder from Udhaar Book that ${formatINR(loan.calculation.pendingAmount)} is due on ${formatDisplayDate(loan.dueDate)}. Please arrange the payment. Thank you!`;
              const waUrl = phoneWithCountry
                ? `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(waMessage)}`
                : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

              return (
                <div
                  key={loan.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOverdue
                      ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200/80 dark:border-red-900/40 hover:border-red-400'
                      : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400'
                  }`}
                >
                  {/* Left: Info */}
                  <div 
                    onClick={() => onSelectLoan(loan)}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-base hover:text-emerald-600">
                        {loan.borrowerName}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isOverdue
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                        }`}
                      >
                        {loan.calculation.statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>Due: <strong>{formatDisplayDate(loan.dueDate)}</strong></span>
                      <span>•</span>
                      <span>Pending: <strong className="text-slate-900 dark:text-white font-numeric">{formatINR(loan.calculation.pendingAmount)}</strong></span>
                      {loan.borrowerPhone && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">Ph: {loan.borrowerPhone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {loan.borrowerPhone && (
                      <a
                        href={`tel:${loan.borrowerPhone}`}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:text-emerald-600 text-xs font-semibold flex items-center gap-1 shadow-xs"
                        title="Call borrower"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onSelectLoan(loan)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
