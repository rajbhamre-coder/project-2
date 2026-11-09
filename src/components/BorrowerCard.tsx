import React from 'react';
import { Phone, ChevronRight, Layers, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import type { BorrowerSummary } from '../types';
import { formatINR } from '../utils/interest';

interface BorrowerCardProps {
  summary: BorrowerSummary;
  onClick: () => void;
}

export const BorrowerCard: React.FC<BorrowerCardProps> = ({ summary, onClick }) => {
  const {
    borrowerName,
    borrowerPhone,
    loanCount,
    totalPending,
    worstStatus,
    worstStatusLabel,
    totalPrincipal,
  } = summary;

  // Status styling
  const getStatusBadge = () => {
    switch (worstStatus) {
      case 'overdue':
        return {
          bg: 'bg-red-50 dark:bg-red-950/70 border-red-200 dark:border-red-900',
          text: 'text-red-700 dark:text-red-400',
          dot: 'bg-red-500',
          icon: AlertCircle,
        };
      case 'due_soon':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-900',
          text: 'text-amber-700 dark:text-amber-400',
          dot: 'bg-amber-500',
          icon: Clock,
        };
      case 'paid':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-900',
          text: 'text-emerald-700 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          text: 'text-slate-700 dark:text-slate-300',
          dot: 'bg-slate-400',
          icon: Clock,
        };
    }
  };

  const badge = getStatusBadge();
  const IconComponent = badge.icon;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200 cursor-pointer active:scale-[0.98] select-none text-left"
    >
      {/* Top row: Name & Phone */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {borrowerName}
            </h3>
            {borrowerPhone ? (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{borrowerPhone}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                No phone
              </p>
            )}
          </div>

          {loanCount > 1 && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex-shrink-0">
              <Layers className="w-3 h-3" />
              {loanCount} loans
            </span>
          )}
        </div>

        {/* Center: Pending Amount */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
            Pending Balance
          </span>
          <div className="text-2xl sm:text-3xl font-black font-numeric text-slate-900 dark:text-white mt-0.5 tracking-tight">
            {formatINR(totalPending)}
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">
            Lent: {formatINR(totalPrincipal)}
          </span>
        </div>
      </div>

      {/* Bottom row: Status tag and arrow */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} animate-pulse`} />
          <IconComponent className="w-3.5 h-3.5" />
          <span>{worstStatusLabel}</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-slate-700 transition-colors">
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
