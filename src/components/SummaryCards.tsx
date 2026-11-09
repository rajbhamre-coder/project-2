import React from 'react';
import { IndianRupee, TrendingUp, AlertCircle } from 'lucide-react';
import { formatINR } from '../utils/interest';

interface SummaryCardsProps {
  totalLent: number;
  totalInterest: number;
  totalPending: number;
  totalPaid: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalLent,
  totalInterest,
  totalPending,
  totalPaid,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
      {/* 1. Total Lent */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Lent (Principal)
          </span>
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black font-numeric text-slate-900 dark:text-white tracking-tight">
            {formatINR(totalLent)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total principal deployed
          </p>
        </div>
      </div>

      {/* 2. Total Interest Accrued So Far */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Interest Accrued
          </span>
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black font-numeric text-indigo-600 dark:text-indigo-400 tracking-tight">
            +{formatINR(totalInterest)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simple monthly interest earned
          </p>
        </div>
      </div>

      {/* 3. Total Pending */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border border-amber-200/70 dark:border-amber-900/60 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
            Total Pending (To Recover)
          </span>
          <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black font-numeric text-amber-600 dark:text-amber-400 tracking-tight">
            {formatINR(totalPending)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Recovered: <strong>{formatINR(totalPaid)}</strong></span>
          </p>
        </div>
      </div>
    </div>
  );
};
