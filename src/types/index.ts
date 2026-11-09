export interface Payment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: number;
}

export interface Loan {
  id: string;
  userId: string;
  borrowerId?: string;
  borrowerName: string;
  borrowerPhone?: string;
  principal: number;
  monthlyRate: number; // % per month (e.g. 2 for 2%/month)
  dateGiven: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  notes?: string;
  payments: Payment[];
  createdAt: number;
  updatedAt: number;
}

export interface Borrower {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type LoanStatus = 'paid' | 'overdue' | 'due_soon' | 'ok';

export interface LoanCalculation {
  principal: number;
  monthlyRate: number;
  monthlyInterest: number;
  daysElapsed: number;
  interestAccrued: number;
  totalPayable: number;
  totalPaid: number;
  pendingAmount: number;
  status: LoanStatus;
  statusLabel: string;
  daysUntilDue: number; // negative means overdue
  isOverdue: boolean;
  isDueSoon: boolean;
  isDueToday: boolean;
  isPaid: boolean;
}

export interface BorrowerSummary {
  borrowerName: string;
  borrowerPhone?: string;
  loanCount: number;
  totalPrincipal: number;
  totalInterest: number;
  totalPayable: number;
  totalPaid: number;
  totalPending: number;
  worstStatus: LoanStatus;
  worstStatusLabel: string;
  loans: (Loan & { calculation: LoanCalculation })[];
  nearestDueDate?: string;
}
