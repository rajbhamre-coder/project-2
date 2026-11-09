import React, { useState } from 'react';
import { X, Bell, CheckCircle2, Clock, Send } from 'lucide-react';
import { registerPushNotifications } from '../firebase/messaging';
import { useAuth } from '../context/AuthContext';
import { useLoans } from '../context/LoanContext';
import { formatINR } from '../utils/interest';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const { reminders } = useLoans();
  const [tokenStatus, setTokenStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const token = await registerPushNotifications(currentUser.uid);
      if (token) {
        setTokenStatus('Push notifications enabled successfully!');
      } else {
        setTokenStatus('Notification permission was not granted.');
      }
    } catch (e) {
      console.error(e);
      setTokenStatus('Failed to enable push notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestNotification = () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission === 'granted') {
      const urgentLoan = reminders[0];
      const body = urgentLoan
        ? `Reminder: ${urgentLoan.borrowerName} has ${formatINR(urgentLoan.calculation.pendingAmount)} ${urgentLoan.calculation.statusLabel.toLowerCase()}`
        : 'Daily Ledger: All borrowers are currently on track!';

      new Notification('Udhaar Book 9:00 AM Reminder', {
        body,
        icon: '/pwa-192x192.svg',
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Udhaar Book Daily Reminder', {
            body: 'Reminders enabled! You will be alerted at 9 AM IST for overdue loans.',
            icon: '/pwa-192x192.svg',
          });
          setTestSent(true);
        } else {
          alert('Please enable browser notification permission in your browser address bar.');
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Daily Push Reminders
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled daily at 9:00 AM IST (Asia/Kolkata)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Automated Schedule</span>
            </div>
            <p className="leading-relaxed">
              Every morning at <strong>9:00 AM IST</strong>, the cloud function scans your active loans and automatically sends a push notification for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-200">
              <li><span className="font-semibold text-red-600 dark:text-red-400">Overdue</span> loans</li>
              <li>Loans due <span className="font-semibold text-amber-600 dark:text-amber-400">today</span></li>
              <li>Loans due in <span className="font-semibold text-amber-600 dark:text-amber-400">3 days</span></li>
            </ul>
          </div>

          {tokenStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{tokenStatus}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>{loading ? 'Registering Device...' : 'Enable Device Push'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendTestNotification}
              className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-emerald-600" />
              <span>{testSent ? 'Test Alert Sent!' : 'Send Test Alert Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
