const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

/**
 * Parses YYYY-MM-DD into a date at midnight in IST
 */
function parseDateIST(dateStr) {
  const parts = dateStr.split('-');
  return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
}

/**
 * Calculates calendar day difference
 */
function getDayDiff(d1, d2) {
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Scheduled Cloud Function running daily at 9:00 AM IST (Asia/Kolkata)
 * Scans active loans for every registered money lender and sends push alerts
 * for: Overdue loans, Loans due today, and Loans due in 3 days.
 */
exports.dailyMorningLoanReminders = onSchedule(
  {
    schedule: '0 9 * * *',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1', // Mumbai region for lowest latency in India
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async (event) => {
    const today = new Date();
    // Get current date formatted in IST
    const istDateString = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    const todayIST = parseDateIST(istDateString);

    console.log(`Starting 9:00 AM IST Daily Loan Reminder check for date: ${istDateString}`);

    try {
      // Get all lenders with loans
      const usersSnapshot = await db.collection('users').get();
      if (usersSnapshot.empty) {
        console.log('No registered users found.');
        return;
      }

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Fetch user's registered FCM tokens
        const tokensSnap = await db.collection(`users/${userId}/fcmTokens`).get();
        if (tokensSnap.empty) {
          continue; // No push devices registered for this user
        }

        const tokens = tokensSnap.docs.map((d) => d.id);

        // Fetch all loans for this lender
        const loansSnap = await db.collection(`users/${userId}/loans`).get();
        if (loansSnap.empty) {
          continue;
        }

        const overdueBorrowers = [];
        const dueTodayBorrowers = [];
        const dueIn3DaysBorrowers = [];

        for (const loanDoc of loansSnap.docs) {
          const loan = loanDoc.data();
          const principal = Number(loan.principal) || 0;
          const monthlyRate = Number(loan.monthlyRate) || 0;
          const dateGiven = parseDateIST(loan.dateGiven);
          const dueDate = parseDateIST(loan.dueDate);

          // Calculate interest
          const daysElapsed = Math.max(0, getDayDiff(dateGiven, todayIST));
          const interest = principal * (monthlyRate / 100) * (daysElapsed / 30);
          const totalPayable = principal + interest;

          // Subtract payments
          const totalPaid = (loan.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const pending = Math.max(0, totalPayable - totalPaid);

          // If loan is settled (pending <= 0.5), skip notification
          if (pending <= 0.5) continue;

          const daysUntilDue = getDayDiff(todayIST, dueDate);

          if (daysUntilDue < 0) {
            overdueBorrowers.push({
              name: loan.borrowerName,
              days: Math.abs(daysUntilDue),
              pending: Math.round(pending),
            });
          } else if (daysUntilDue === 0) {
            dueTodayBorrowers.push({
              name: loan.borrowerName,
              pending: Math.round(pending),
            });
          } else if (daysUntilDue === 3) {
            dueIn3DaysBorrowers.push({
              name: loan.borrowerName,
              pending: Math.round(pending),
            });
          }
        }

        // Build notification message if any reminders exist
        const totalReminders = overdueBorrowers.length + dueTodayBorrowers.length + dueIn3DaysBorrowers.length;
        if (totalReminders === 0) {
          continue;
        }

        let title = `Udhaar Book Reminder: ${totalReminders} loan${totalReminders > 1 ? 's' : ''} need attention`;
        let lines = [];

        if (overdueBorrowers.length > 0) {
          const top = overdueBorrowers[0];
          lines.push(`🚨 Overdue: ${top.name} (₹${top.pending.toLocaleString('en-IN')}) by ${top.days}d${overdueBorrowers.length > 1 ? ` +${overdueBorrowers.length - 1} more` : ''}`);
        }

        if (dueTodayBorrowers.length > 0) {
          const top = dueTodayBorrowers[0];
          lines.push(`⏰ Due Today: ${top.name} (₹${top.pending.toLocaleString('en-IN')})${dueTodayBorrowers.length > 1 ? ` +${dueTodayBorrowers.length - 1} more` : ''}`);
        }

        if (dueIn3DaysBorrowers.length > 0) {
          const top = dueIn3DaysBorrowers[0];
          lines.push(`📅 Due in 3 days: ${top.name} (₹${top.pending.toLocaleString('en-IN')})`);
        }

        const body = lines.join(' • ');

        // Dispatch multicast FCM message to all user devices
        try {
          const response = await messaging.sendEachForMulticast({
            tokens,
            notification: {
              title,
              body,
            },
            webpush: {
              notification: {
                icon: '/pwa-192x192.svg',
                badge: '/pwa-192x192.svg',
                vibrate: [200, 100, 200],
              },
              fcmOptions: {
                link: '/',
              },
            },
          });

          console.log(`Sent notifications to user ${userId}: ${response.successCount} succeeded, ${response.failureCount} failed.`);

          // Clean up invalid/stale tokens
          if (response.failureCount > 0) {
            response.responses.forEach(async (resp, idx) => {
              if (!resp.success) {
                const staleToken = tokens[idx];
                console.log(`Removing stale FCM token for user ${userId}:`, staleToken);
                await db.doc(`users/${userId}/fcmTokens/${staleToken}`).delete();
              }
            });
          }
        } catch (pushErr) {
          console.error(`Failed to dispatch FCM message for user ${userId}:`, pushErr);
        }
      }

      console.log('Finished 9:00 AM IST daily reminders successfully.');
    } catch (err) {
      console.error('Error in dailyMorningLoanReminders function:', err);
    }
  }
);
