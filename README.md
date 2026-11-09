# 📖 Udhaar Book (उधार बुक)

> **Production-ready, mobile-first responsive web application for small private money lenders in India to track loans, monthly simple interest, repayments, and automated WhatsApp/Push reminders.**

[![Live Web App](https://img.shields.io/badge/Live_App-project--2--a4615.web.app-059669?style=for-the-badge&logo=firebase&logoColor=white)](https://project-2-a4615.web.app)
[![PWA Installable](https://img.shields.io/badge/PWA-Installable-blue?style=for-the-badge&logo=pwa&logoColor=white)](https://project-2-a4615.web.app)

🌐 **Live Deployed URL:** **[https://project-2-a4615.web.app](https://project-2-a4615.web.app)**

---

## 🌟 Key Highlights

- **Mobile-First & Clean UX**: Large tap targets (min 48px), high contrast, designed for older users and mobile screens with zero horizontal scrolling.
- **Monthly Simple Interest Calculation**: Dedicated, unit-tested calculation utility adhering strictly to Indian money lending customs:
  $$\text{Interest} = \text{Principal} \times \left(\frac{\text{Rate}}{100}\right) \times \left(\frac{\text{Days Elapsed}}{30}\right)$$
- **₹ Currency with Indian Number Formatting**: e.g., `₹1,50,000` / `₹25,500.50` (`en-IN` format).
- **Multi-Device Cloud Sync**: Powered by Firebase Authentication and Cloud Firestore with offline IndexedDB caching.
- **Ironclad Data Privacy**: User-scoped Firestore security rules ensure each lender can **only read and write their own documents**.
- **Instant Demo Mode**: Test the app immediately in local storage without configuring Firebase credentials, plus 1-click test data seeding!
- **PWA (Progressive Web App)**: Installable on Android & iOS ("Add to Home Screen"), custom app icons, service worker offline caching.
- **Part Payments**: Record unlimited repayments per loan, automatically deducted from $(\text{Principal} + \text{Interest})$.
- **Multiple Loans Per Borrower**: Track multiple distinct loans for the same borrower with individual schedules and unified summaries.
- **WhatsApp & Call Reminders**: 1-tap call button and 1-tap WhatsApp message with pre-filled reminder template.
- **Scheduled Push Notifications**: Firebase Cloud Function running daily at **9:00 AM IST** to alert the lender of overdue, today's due, and 3-day upcoming loans.
- **Excel & CSV Export**: Download all borrower records and payment histories with one click for offline backups.
- **Dark Mode**: High contrast dark theme with auto system preference detection.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS v3 (Dark Mode enabled) |
| **Icons** | Lucide React |
| **Database & Auth** | Firebase Auth + Cloud Firestore (v13 modular SDK) |
| **Cloud Storage / Offline** | Firestore `persistentLocalCache` + Service Worker precaching |
| **PWA Engine** | `vite-plugin-pwa` with web manifest & custom app icons |
| **Push Notifications** | Firebase Cloud Messaging (FCM) + Cloud Function Scheduler (9 AM IST) |
| **Reporting / Export** | SheetJS (`xlsx`) for Excel & RFC-4180 CSV export |
| **Testing** | Vitest (11/11 unit tests covering all interest edge cases) |

---

## 🧮 Interest Calculation Logic

The calculation lives in [`src/utils/interest.ts`](file:///c:/Users/DELL/OneDrive/Desktop/project-2/src/utils/interest.ts) and is verified by comprehensive unit tests:

```ts
// 1. Calendar days elapsed (never negative)
const daysElapsed = Math.max(0, getCalendarDaysDiff(dateGiven, today));

// 2. Simple interest based on monthly rate
const interestAccrued = principal * (monthlyRate / 100) * (daysElapsed / 30);

// 3. Total amount to be returned
const totalPayable = principal + interestAccrued;

// 4. Pending balance after all part payments
const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
const pendingAmount = Math.max(0, totalPayable - totalPaid);

// 5. Status determination
// - "Fully paid" if pending <= 0.05
// - "Overdue by X days" if today is strictly after due date
// - "Due today" if due date is today
// - "Due in X days" if due within 7 days
// - "Active" otherwise
```

Run test suite anytime:
```bash
npm run test
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ installed on your computer.

### 2. Clone / Open Directory
```bash
cd project-2
```

### 3. Install Dependencies
```powershell
npm.cmd install
```
*(On Windows PowerShell, use `npm.cmd` if script execution policy is restricted).*

### 4. Run Development Server
```powershell
npm.cmd run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The app runs immediately in **Instant Demo Mode** with sample Indian borrowers pre-loaded!

---

## 🔥 Firebase Setup Guide (Step-by-Step)

To connect your own production Firebase project:

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Name it `udhaar-book` (or any name you prefer) and disable Google Analytics for simplicity.
3. Click **Create project**.

### Step 2: Enable Email/Password Authentication
1. In the left sidebar, click **Build > Authentication**.
2. Click **Get Started**.
3. Under **Sign-in method**, choose **Email/Password**, toggle **Enable**, and click **Save**.

### Step 3: Create Firestore Database
1. In the sidebar, click **Build > Firestore Database**.
2. Click **Create database**.
3. Choose location **`asia-south1` (Mumbai)** for lowest latency in India.
4. Select **Start in test mode** (we will deploy our secure rules in the next step).

### Step 4: Register Web App & Get API Keys
1. In Firebase Console, click the **Settings gear icon (⚙️) > Project settings**.
2. Under the **General** tab, scroll to **Your apps** and click the Web icon (`</>`).
3. Enter App nickname: `Udhaar Book Web`, click **Register app**.
4. Copy the `firebaseConfig` keys into a `.env` file in your project root:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=udhaar-book.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=udhaar-book
VITE_FIREBASE_STORAGE_BUCKET=udhaar-book.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:...
VITE_FIREBASE_VAPID_KEY=BK... # (From Cloud Messaging Web Push certificates)
```

### Step 5: (Optional) Setup Web Push Certificates (FCM)
1. In **Project settings**, go to the **Cloud Messaging** tab.
2. Under **Web configuration**, click **Generate key pair**.
3. Copy the public key into `VITE_FIREBASE_VAPID_KEY` in `.env`.

---

## 🔒 Firestore Security Rules

The application includes user-scoped security rules in [`firestore.rules`](file:///c:/Users/DELL/OneDrive/Desktop/project-2/firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This guarantees that:
- Any unauthenticated request is completely rejected.
- Each user can **only access and modify data under `/users/{their_own_uid}`**.
- Lender A can never view or edit loans belonging to Lender B.

---

## 🌐 Deployment to Firebase Hosting

### 1. Install Firebase CLI globally (if not installed)
```powershell
npm.cmd install -g firebase-tools
```

### 2. Login to Firebase
```powershell
firebase login
```

### 3. Build the Production Bundle
```powershell
npm.cmd run build
```

### 4. Deploy Firestore Rules & Hosting
```powershell
firebase deploy --only firestore:rules,hosting
```

Once completed, your app will be live at:
`https://<your-project-id>.web.app`

---

## ⏰ Deploying Daily 9:00 AM IST Cloud Function

The repository comes with a scheduled Cloud Function in [`functions/index.js`](file:///c:/Users/DELL/OneDrive/Desktop/project-2/functions/index.js):

1. Switch to Blaze (Pay-as-you-go) plan in Firebase Console (Firebase requires Blaze for outbound scheduler, but generous free tier applies: 2M invocations/month).
2. Install functions dependencies:
   ```powershell
   cd functions
   npm.cmd install
   cd ..
   ```
3. Deploy functions:
   ```powershell
   firebase deploy --only functions
   ```
4. The Cloud Function `dailyMorningLoanReminders` will automatically execute every morning at **09:00 AM Indian Standard Time** and deliver push notifications to all registered lender devices.

---

## 🚀 Alternative Deployment: Vercel

1. Push your repository to GitHub or GitLab.
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Select this repository.
4. Add the environment variables from your `.env` under **Environment Variables**.
5. Click **Deploy**. Vercel will automatically build Vite and deploy the PWA!

---

## 📱 How to Install as PWA on Phone & Laptop

### On Android (Chrome / Brave / Edge)
1. Open the deployed website URL in Chrome on your Android phone.
2. An **"Install Udhaar Book"** banner will automatically appear at the bottom.
3. Tap **Install** (or tap the 3 dots menu `⋮` in Chrome and tap **"Add to Home Screen"** / **"Install App"**).
4. The Udhaar Book icon will now appear on your home screen and open in full screen without browser address bars!

### On iPhone / iPad (iOS Safari)
1. Open the website in **Safari**.
2. Tap the **Share button** (the square with an arrow pointing up at the bottom).
3. Scroll down and tap **"Add to Home Screen"** (`+`).
4. Tap **Add** in top right. Udhaar Book is now installed like a native iOS app.

### On Laptop / PC (Google Chrome / Microsoft Edge)
1. Open the website in Chrome or Edge.
2. Look at the address bar on the right side: an **Install icon (computer with down arrow)** will appear.
3. Click it and click **Install**. The app will launch in its own standalone desktop window.

---

## 🧪 Testing with Sample Data

Click the **User avatar** in the top-right header and select **"Seed Sample Test Data"**, or click the seed button on the empty state. This immediately populates:
1. **Ramesh Patel**: ₹60,000 at 2%/mo, **Overdue by 10 days** (part payment of ₹15,000 recorded).
2. **Priya Verma**: ₹45,000 at 2.5%/mo, **Due in 4 days** (UPI payment of ₹5,000 recorded).
3. **Sunita Sharma**: ₹30,000 at 2%/mo, **Due today**.
4. **Rajesh Kumar**: **Multiple loans** (Loan 1: ₹1,50,000 shop expansion; Loan 2: ₹50,000 transport repair).
5. **Amit Singh**: ₹20,000 at 2%/mo, **Fully paid** with settlement interest.

---

## 📁 Project Directory Structure

```
project-2/
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.svg           # High-res PWA 192px app icon
│   ├── pwa-512x512.svg           # High-res PWA 512px app icon
│   └── firebase-messaging-sw.js  # Background FCM Push Service Worker
├── src/
│   ├── components/
│   │   ├── AddLoanModal.tsx      # Add & Edit person / loan modal
│   │   ├── AddPaymentModal.tsx   # Part payment modal with quick chips
│   │   ├── AuthModal.tsx         # Sign up, Log in, Password reset, Demo
│   │   ├── BorrowerCard.tsx      # Square card with status tag & INR format
│   │   ├── BorrowerDetailModal.tsx # Full detail screen, multi-loan, WhatsApp, Call
│   │   ├── ConfirmModal.tsx      # Safe delete confirmations
│   │   ├── Navbar.tsx            # Header, dark toggle, Excel/CSV export
│   │   ├── NotificationSettingsModal.tsx # FCM 9 AM IST scheduler setup
│   │   ├── PWAInstallPrompt.tsx  # Native "Add to Home Screen" prompt
│   │   ├── RemindersSection.tsx  # Urgency-sorted overdue/due soon banner
│   │   └── SummaryCards.tsx      # Lent, interest accrued, pending totals
│   ├── context/
│   │   ├── AuthContext.tsx       # Auth state & demo fallback
│   │   ├── LoanContext.tsx       # Real-time Firestore sync & aggregations
│   │   └── ThemeContext.tsx      # Dark mode provider with localStorage
│   ├── data/
│   │   └── sampleData.ts         # Realistic Indian borrower test seeds
│   ├── firebase/
│   │   ├── config.ts             # Modular Firebase v13 + offline IndexedDB
│   │   └── messaging.ts          # FCM token registration & notifications
│   ├── types/
│   │   └── index.ts              # Loan, Payment, Borrower, Calculation types
│   ├── utils/
│   │   ├── export.ts             # Excel (.xlsx) & CSV export utilities
│   │   ├── interest.ts           # Core simple interest calculation logic
│   │   └── interest.test.ts      # 11 unit tests for interest math
│   ├── App.tsx                   # Main mobile-first responsive layout
│   ├── index.css                 # Tailwind directives & typography
│   └── main.tsx                  # App root entry point
├── functions/                    # Firebase Cloud Functions (Node.js 20)
│   ├── index.js                  # Daily 9 AM IST push reminder scheduler
│   └── package.json
├── firebase.json                 # Firebase Hosting & Firestore config
├── firestore.rules               # User-scoped data isolation rules
├── .env.example                  # Environment variable blueprint
├── tailwind.config.js            # Tailwind configuration
├── vite.config.ts                # Vite config with PWA plugin
└── package.json
```
