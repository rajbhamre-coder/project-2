import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { useAuth } from './AuthContext';
import type { Loan, Payment, BorrowerSummary, LoanCalculation } from '../types';
import { calculateLoanDetails } from '../utils/interest';
import { getSampleLoans } from '../data/sampleData';

interface LoanWithCalculation extends Loan {
  calculation: LoanCalculation;
}

interface LoanContextType {
  loans: LoanWithCalculation[];
  borrowerSummaries: BorrowerSummary[];
  loading: boolean;
  totalLent: number;
  totalInterest: number;
  totalPending: number;
  totalPaid: number;
  reminders: LoanWithCalculation[];
  addLoan: (loan: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'payments'>) => Promise<string>;
  updateLoan: (id: string, updates: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  addPayment: (loanId: string, payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  deletePayment: (loanId: string, paymentId: string) => Promise<void>;
  seedSampleData: () => Promise<void>;
  clearAllLoans: () => Promise<void>;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isDemoMode } = useAuth();
  const [rawLoans, setRawLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync loans based on current user / mode
  useEffect(() => {
    if (!currentUser) {
      setRawLoans([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // If using Firestore in real mode
    if (isFirebaseConfigured && !isDemoMode) {
      const loansRef = collection(db, 'users', currentUser.uid, 'loans');
      const unsubscribe = onSnapshot(
        loansRef,
        (snapshot) => {
          const list: Loan[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Loan);
          });
          setRawLoans(list);
          setLoading(false);
        },
        (error) => {
          console.error('Firestore listener error:', error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }

    // Demo / Local storage mode
    const storageKey = `udhaar_loans_${currentUser.uid}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setRawLoans(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing local loans:', e);
        const samples = getSampleLoans(currentUser.uid);
        setRawLoans(samples);
        localStorage.setItem(storageKey, JSON.stringify(samples));
      }
    } else {
      // First time in demo mode: seed initial sample data
      const samples = getSampleLoans(currentUser.uid);
      setRawLoans(samples);
      localStorage.setItem(storageKey, JSON.stringify(samples));
    }
    setLoading(false);
  }, [currentUser, isDemoMode]);

  // Helper to persist in local mode
  const persistLocally = (newList: Loan[]) => {
    if (!currentUser) return;
    const storageKey = `udhaar_loans_${currentUser.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(newList));
    setRawLoans(newList);
  };

  // Add Loan
  const addLoan = async (
    loanInput: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'payments'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('Not logged in');

    const id = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newLoan: Loan = {
      ...loanInput,
      id,
      userId: currentUser.uid,
      payments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (isFirebaseConfigured && !isDemoMode) {
      await setDoc(doc(db, 'users', currentUser.uid, 'loans', id), newLoan);
    } else {
      persistLocally([newLoan, ...rawLoans]);
    }

    return id;
  };

  // Update Loan
  const updateLoan = async (
    id: string,
    updates: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt'>>
  ) => {
    if (!currentUser) throw new Error('Not logged in');

    const updatedTime = Date.now();
    if (isFirebaseConfigured && !isDemoMode) {
      await setDoc(
        doc(db, 'users', currentUser.uid, 'loans', id),
        { ...updates, updatedAt: updatedTime },
        { merge: true }
      );
    } else {
      const nextList = rawLoans.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: updatedTime } : l
      );
      persistLocally(nextList);
    }
  };

  // Delete Loan
  const deleteLoan = async (id: string) => {
    if (!currentUser) throw new Error('Not logged in');

    if (isFirebaseConfigured && !isDemoMode) {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'loans', id));
    } else {
      const nextList = rawLoans.filter((l) => l.id !== id);
      persistLocally(nextList);
    }
  };

  // Add Part Payment
  const addPayment = async (
    loanId: string,
    paymentInput: Omit<Payment, 'id' | 'createdAt'>
  ) => {
    if (!currentUser) throw new Error('Not logged in');

    const targetLoan = rawLoans.find((l) => l.id === loanId);
    if (!targetLoan) throw new Error('Loan not found');

    const newPayment: Payment = {
      ...paymentInput,
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };

    const nextPayments = [...(targetLoan.payments || []), newPayment];

    if (isFirebaseConfigured && !isDemoMode) {
      await setDoc(
        doc(db, 'users', currentUser.uid, 'loans', loanId),
        { payments: nextPayments, updatedAt: Date.now() },
        { merge: true }
      );
    } else {
      const nextList = rawLoans.map((l) =>
        l.id === loanId
          ? { ...l, payments: nextPayments, updatedAt: Date.now() }
          : l
      );
      persistLocally(nextList);
    }
  };

  // Delete Payment (allow deleting wrongly entered payment)
  const deletePayment = async (loanId: string, paymentId: string) => {
    if (!currentUser) throw new Error('Not logged in');

    const targetLoan = rawLoans.find((l) => l.id === loanId);
    if (!targetLoan) throw new Error('Loan not found');

    const nextPayments = (targetLoan.payments || []).filter((p) => p.id !== paymentId);

    if (isFirebaseConfigured && !isDemoMode) {
      await setDoc(
        doc(db, 'users', currentUser.uid, 'loans', loanId),
        { payments: nextPayments, updatedAt: Date.now() },
        { merge: true }
      );
    } else {
      const nextList = rawLoans.map((l) =>
        l.id === loanId
          ? { ...l, payments: nextPayments, updatedAt: Date.now() }
          : l
      );
      persistLocally(nextList);
    }
  };

  // Seed sample data
  const seedSampleData = async () => {
    if (!currentUser) return;
    const samples = getSampleLoans(currentUser.uid);

    if (isFirebaseConfigured && !isDemoMode) {
      for (const sample of samples) {
        await setDoc(doc(db, 'users', currentUser.uid, 'loans', sample.id), sample);
      }
    } else {
      persistLocally(samples);
    }
  };

  // Clear all data
  const clearAllLoans = async () => {
    if (!currentUser) return;
    if (isFirebaseConfigured && !isDemoMode) {
      for (const loan of rawLoans) {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'loans', loan.id));
      }
    } else {
      persistLocally([]);
    }
  };

  // Compute calculated values for every loan
  const loans: LoanWithCalculation[] = useMemo(() => {
    return rawLoans.map((loan) => {
      const calc = calculateLoanDetails(
        loan.principal,
        loan.monthlyRate,
        loan.dateGiven,
        loan.dueDate,
        loan.payments || []
      );
      return {
        ...loan,
        calculation: calc,
      };
    });
  }, [rawLoans]);

  // Summaries
  const { totalLent, totalInterest, totalPending, totalPaid } = useMemo(() => {
    let lent = 0;
    let interest = 0;
    let pending = 0;
    let paid = 0;

    for (const l of loans) {
      lent += l.principal;
      interest += l.calculation.interestAccrued;
      pending += l.calculation.pendingAmount;
      paid += l.calculation.totalPaid;
    }

    return {
      totalLent: Math.round(lent),
      totalInterest: Math.round(interest),
      totalPending: Math.round(pending),
      totalPaid: Math.round(paid),
    };
  }, [loans]);

  // Reminders: borrowers/loans who are overdue (red) or due within 7 days (amber), sorted by urgency
  const reminders = useMemo(() => {
    return loans
      .filter((l) => l.calculation.status === 'overdue' || l.calculation.status === 'due_soon')
      .sort((a, b) => {
        // Overdue first (lowest/most negative daysUntilDue first)
        // e.g. -15 comes before -3, then 0, then 1, 2, 3...
        return a.calculation.daysUntilDue - b.calculation.daysUntilDue;
      });
  }, [loans]);

  // Borrower Summaries grouped by borrower name / phone
  const borrowerSummaries: BorrowerSummary[] = useMemo(() => {
    const map = new Map<string, BorrowerSummary>();

    loans.forEach((loan) => {
      // Group key: normalize name and phone
      const key = (loan.borrowerPhone || loan.borrowerName).trim().toLowerCase();
      
      let summary = map.get(key);
      if (!summary) {
        summary = {
          borrowerName: loan.borrowerName,
          borrowerPhone: loan.borrowerPhone,
          loanCount: 0,
          totalPrincipal: 0,
          totalInterest: 0,
          totalPayable: 0,
          totalPaid: 0,
          totalPending: 0,
          worstStatus: 'ok',
          worstStatusLabel: 'Active',
          loans: [],
          nearestDueDate: loan.dueDate,
        };
        map.set(key, summary);
      }

      summary.loanCount += 1;
      summary.totalPrincipal += loan.principal;
      summary.totalInterest += loan.calculation.interestAccrued;
      summary.totalPayable += loan.calculation.totalPayable;
      summary.totalPaid += loan.calculation.totalPaid;
      summary.totalPending += loan.calculation.pendingAmount;
      summary.loans.push(loan);

      // Status urgency priority: overdue > due_soon > ok > paid
      const priority = { overdue: 4, due_soon: 3, ok: 2, paid: 1 };
      if (priority[loan.calculation.status] > priority[summary.worstStatus]) {
        summary.worstStatus = loan.calculation.status;
        summary.worstStatusLabel = loan.calculation.statusLabel;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      // Sort by worst status urgency then pending amount
      const priority = { overdue: 4, due_soon: 3, ok: 2, paid: 1 };
      const diff = priority[b.worstStatus] - priority[a.worstStatus];
      if (diff !== 0) return diff;
      return b.totalPending - a.totalPending;
    });
  }, [loans]);

  return (
    <LoanContext.Provider
      value={{
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
        clearAllLoans,
      }}
    >
      {children}
    </LoanContext.Provider>
  );
};

export function useLoans() {
  const context = useContext(LoanContext);
  if (!context) {
    throw new Error('useLoans must be used within a LoanProvider');
  }
  return context;
}
