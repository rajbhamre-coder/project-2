import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Users,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { RemindersSection } from './components/RemindersSection';
import { BorrowerCard } from './components/BorrowerCard';
import { AddLoanModal } from './components/AddLoanModal';
import { BorrowerDetailModal } from './components/BorrowerDetailModal';
import { AddPaymentModal } from './components/AddPaymentModal';
import { AuthModal } from './components/AuthModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { useLoans } from './context/LoanContext';
import type { Loan, BorrowerSummary } from './types';

type FilterType = 'all' | 'overdue' | 'due_soon' | 'active' | 'paid';

export const App: React.FC = () => {
  const {
    loans,
    borrowerSummaries,
    loading,
    totalLent,
    totalInterest,
    totalPending,
    totalPaid,
    reminders,
    addLoan,
    updateLoan,
    deleteLoan,
    addPayment,
    deletePayment,
    seedSampleData,
  } = useLoans();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Modals state
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [initialBorrowerName, setInitialBorrowerName] = useState('');
  const [initialBorrowerPhone, setInitialBorrowerPhone] = useState('');

  const [selectedBorrowerSummary, setSelectedBorrowerSummary] = useState<BorrowerSummary | null>(null);
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    loanId: string;
    borrowerName: string;
    pendingAmount: number;
  }>({
    isOpen: false,
    loanId: '',
    borrowerName: '',
    pendingAmount: 0,
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Filtered borrower cards
  const filteredBorrowers = useMemo(() => {
    let result = borrowerSummaries;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.borrowerName.toLowerCase().includes(q) ||
          (b.borrowerPhone && b.borrowerPhone.includes(q))
      );
    }

    // Filter type
    if (filterType === 'overdue') {
      result = result.filter((b) => b.worstStatus === 'overdue');
    } else if (filterType === 'due_soon') {
      result = result.filter((b) => b.worstStatus === 'due_soon');
    } else if (filterType === 'active') {
      result = result.filter((b) => b.worstStatus !== 'paid');
    } else if (filterType === 'paid') {
      result = result.filter((b) => b.worstStatus === 'paid');
    }

    return result;
  }, [borrowerSummaries, searchQuery, filterType]);

  // Keep selectedBorrowerSummary in sync when loans update
  const currentActiveBorrowerSummary = useMemo(() => {
    if (!selectedBorrowerSummary) return null;
    const key = (selectedBorrowerSummary.borrowerPhone || selectedBorrowerSummary.borrowerName).trim().toLowerCase();
    return borrowerSummaries.find(
      (b) => (b.borrowerPhone || b.borrowerName).trim().toLowerCase() === key
    ) || null;
  }, [borrowerSummaries, selectedBorrowerSummary]);

  // Handlers
  const handleOpenAddPerson = () => {
    setEditingLoan(null);
    setInitialBorrowerName('');
    setInitialBorrowerPhone('');
    setIsAddLoanOpen(true);
  };

  const handleAddNewLoanForBorrower = (name: string, phone?: string) => {
    setEditingLoan(null);
    setInitialBorrowerName(name);
    setInitialBorrowerPhone(phone || '');
    setIsAddLoanOpen(true);
  };

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setIsAddLoanOpen(true);
  };

  const handleOpenPayment = (loanId: string) => {
    const target = loans.find((l) => l.id === loanId);
    if (target) {
      setPaymentModalState({
        isOpen: true,
        loanId,
        borrowerName: target.borrowerName,
        pendingAmount: target.calculation.pendingAmount,
      });
    }
  };

  const handleSelectLoanFromReminder = (loan: Loan) => {
    const key = (loan.borrowerPhone || loan.borrowerName).trim().toLowerCase();
    const summary = borrowerSummaries.find(
      (b) => (b.borrowerPhone || b.borrowerName).trim().toLowerCase() === key
    );
    if (summary) {
      setSelectedBorrowerSummary(summary);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <Navbar
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Loading your loan ledger...</p>
          </div>
        ) : (
          <>
            {/* Top Summary Cards */}
            <SummaryCards
              totalLent={totalLent}
              totalInterest={totalInterest}
              totalPending={totalPending}
              totalPaid={totalPaid}
            />

            {/* Reminders Section (Overdue & Due soon within 7 days) */}
            <RemindersSection
              reminders={reminders}
              onSelectLoan={handleSelectLoanFromReminder}
            />

            {/* Controls Bar: Search, Filters & Add Person button */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search borrower by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-xs text-sm sm:text-base font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Primary Add Person Button */}
                <button
                  type="button"
                  onClick={handleOpenAddPerson}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex-shrink-0"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span>+ Add Person</span>
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs sm:text-sm select-none">
                {[
                  { id: 'all', label: 'All', count: borrowerSummaries.length },
                  { id: 'overdue', label: 'Overdue', count: borrowerSummaries.filter(b => b.worstStatus === 'overdue').length, badgeColor: 'text-red-600' },
                  { id: 'due_soon', label: 'Due Soon', count: borrowerSummaries.filter(b => b.worstStatus === 'due_soon').length, badgeColor: 'text-amber-600' },
                  { id: 'active', label: 'Active', count: borrowerSummaries.filter(b => b.worstStatus !== 'paid').length },
                  { id: 'paid', label: 'Fully Paid', count: borrowerSummaries.filter(b => b.worstStatus === 'paid').length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id as FilterType)}
                    className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      filterType === tab.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${filterType === tab.id ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-100 dark:bg-slate-800'} ${tab.badgeColor || ''}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Square Cards, one per borrower */}
            {filteredBorrowers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBorrowers.map((borrower) => (
                  <BorrowerCard
                    key={borrower.borrowerName + (borrower.borrowerPhone || '')}
                    summary={borrower}
                    onClick={() => setSelectedBorrowerSummary(borrower)}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {searchQuery ? 'No matching borrowers found' : 'No borrowers in your ledger yet'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    {searchQuery
                      ? `No records match "${searchQuery}". Try searching by another name or phone number.`
                      : 'Get started by adding your first borrower or seed realistic sample loan records to test.'}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenAddPerson}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add First Person</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => seedSampleData()}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Seed Sample Data (5 Borrowers)</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© Udhaar Book • Simple Monthly Interest Money Lending Manager</p>
          <div className="flex items-center gap-4">
            <span>Formula: P × (R/100) × (Days/30)</span>
            <span>•</span>
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Push Notification Schedule (9 AM IST)
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Add Person Action Button for Fast Phone Access */}
      <div className="fixed bottom-6 right-6 sm:hidden z-30">
        <button
          type="button"
          onClick={handleOpenAddPerson}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-2xl flex items-center justify-center active:scale-95 transition-all"
          aria-label="Add Person"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {/* Modals */}
      {/* 1. Add / Edit Loan Modal */}
      <AddLoanModal
        isOpen={isAddLoanOpen}
        onClose={() => setIsAddLoanOpen(false)}
        onSubmit={async (loanData) => {
          if (editingLoan) {
            await updateLoan(editingLoan.id, loanData);
          } else {
            await addLoan(loanData);
          }
        }}
        editLoan={editingLoan}
        initialBorrowerName={initialBorrowerName}
        initialBorrowerPhone={initialBorrowerPhone}
      />

      {/* 2. Borrower Detail Modal */}
      {currentActiveBorrowerSummary && (
        <BorrowerDetailModal
          isOpen={Boolean(selectedBorrowerSummary)}
          loans={currentActiveBorrowerSummary.loans}
          onClose={() => setSelectedBorrowerSummary(null)}
          onAddPayment={(loanId) => handleOpenPayment(loanId)}
          onEditLoan={(loan) => handleEditLoan(loan)}
          onDeleteLoan={async (loanId) => {
            await deleteLoan(loanId);
          }}
          onDeletePayment={async (loanId, paymentId) => {
            await deletePayment(loanId, paymentId);
          }}
          onAddNewLoanForBorrower={(name, phone) => {
            handleAddNewLoanForBorrower(name, phone);
          }}
        />
      )}

      {/* 3. Add Part Payment Modal */}
      <AddPaymentModal
        isOpen={paymentModalState.isOpen}
        loanId={paymentModalState.loanId}
        borrowerName={paymentModalState.borrowerName}
        pendingAmount={paymentModalState.pendingAmount}
        onClose={() => setPaymentModalState((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={async (loanId, payment) => {
          await addPayment(loanId, payment);
        }}
      />

      {/* 4. Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* 5. Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* 6. PWA Install Prompt Banner */}
      <PWAInstallPrompt />
    </div>
  );
};

export default App;
