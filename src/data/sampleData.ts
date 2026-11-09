import type { Loan } from '../types';
import { addDaysToDate, getTodayString } from '../utils/interest';

export function getSampleLoans(userId: string): Loan[] {
  const today = getTodayString();

  return [
    {
      id: 'loan-sample-1',
      userId,
      borrowerId: 'borrower-ramesh',
      borrowerName: 'Ramesh Patel',
      borrowerPhone: '9876543210',
      principal: 60000,
      monthlyRate: 2.0, // 2% per month
      dateGiven: addDaysToDate(today, -50),
      dueDate: addDaysToDate(today, -10), // Overdue by 10 days
      notes: 'Grain store renovation. Promised repayment post harvest.',
      payments: [
        {
          id: 'pay-1-1',
          amount: 15000,
          date: addDaysToDate(today, -20),
          note: 'Cash payment after wheat sale',
          createdAt: Date.now() - 20 * 86400000,
        },
      ],
      createdAt: Date.now() - 50 * 86400000,
      updatedAt: Date.now() - 20 * 86400000,
    },
    {
      id: 'loan-sample-2',
      userId,
      borrowerId: 'borrower-priya',
      borrowerName: 'Priya Verma',
      borrowerPhone: '9822334455',
      principal: 45000,
      monthlyRate: 2.5, // 2.5% per month
      dateGiven: addDaysToDate(today, -26),
      dueDate: addDaysToDate(today, 4), // Due in 4 days
      notes: 'Boutique festive stock purchase. Regular on interest.',
      payments: [
        {
          id: 'pay-2-1',
          amount: 5000,
          date: addDaysToDate(today, -5),
          note: 'UPI payment GPay',
          createdAt: Date.now() - 5 * 86400000,
        },
      ],
      createdAt: Date.now() - 26 * 86400000,
      updatedAt: Date.now() - 5 * 86400000,
    },
    {
      id: 'loan-sample-3',
      userId,
      borrowerId: 'borrower-sunita',
      borrowerName: 'Sunita Sharma',
      borrowerPhone: '9412345678',
      principal: 30000,
      monthlyRate: 2.0,
      dateGiven: addDaysToDate(today, -30),
      dueDate: today, // Due today!
      notes: 'Home medical emergency. Promised to clear on payday.',
      payments: [],
      createdAt: Date.now() - 30 * 86400000,
      updatedAt: Date.now() - 30 * 86400000,
    },
    {
      id: 'loan-sample-4a',
      userId,
      borrowerId: 'borrower-rajesh',
      borrowerName: 'Rajesh Kumar',
      borrowerPhone: '9899112233',
      principal: 150000,
      monthlyRate: 2.0,
      dateGiven: addDaysToDate(today, -40),
      dueDate: addDaysToDate(today, 20), // Active, due in 20 days
      notes: 'Hardware store stock expansion. Post-dated cheque given.',
      payments: [
        {
          id: 'pay-4a-1',
          amount: 30000,
          date: addDaysToDate(today, -10),
          note: 'Part payment cash',
          createdAt: Date.now() - 10 * 86400000,
        },
      ],
      createdAt: Date.now() - 40 * 86400000,
      updatedAt: Date.now() - 10 * 86400000,
    },
    {
      id: 'loan-sample-4b',
      userId,
      borrowerId: 'borrower-rajesh',
      borrowerName: 'Rajesh Kumar',
      borrowerPhone: '9899112233',
      principal: 50000,
      monthlyRate: 1.5,
      dateGiven: addDaysToDate(today, -15),
      dueDate: addDaysToDate(today, 45), // Active, due in 45 days
      notes: 'Second loan: Transport vehicle repairs.',
      payments: [],
      createdAt: Date.now() - 15 * 86400000,
      updatedAt: Date.now() - 15 * 86400000,
    },
    {
      id: 'loan-sample-5',
      userId,
      borrowerId: 'borrower-amit',
      borrowerName: 'Amit Singh',
      borrowerPhone: '9711223344',
      principal: 20000,
      monthlyRate: 2.0,
      dateGiven: addDaysToDate(today, -45),
      dueDate: addDaysToDate(today, -15),
      notes: 'Short term loan for tractor servicing. Fully settled on time.',
      payments: [
        {
          id: 'pay-5-1',
          amount: 20600, // 20000 principal + 600 interest
          date: addDaysToDate(today, -15),
          note: 'Full settlement via NEFT bank transfer',
          createdAt: Date.now() - 15 * 86400000,
        },
      ],
      createdAt: Date.now() - 45 * 86400000,
      updatedAt: Date.now() - 15 * 86400000,
    },
  ];
}
