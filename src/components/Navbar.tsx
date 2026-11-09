import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Download,
  LogOut,
  Bell,
  Sparkles,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLoans } from '../context/LoanContext';
import { exportLoansToExcel, exportLoansToCSV } from '../utils/export';

interface NavbarProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications, onOpenAuth }) => {
  const { currentUser, isDemoMode, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { loans, seedSampleData, clearAllLoans } = useLoans();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleExportExcel = () => {
    exportLoansToExcel(loans);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    exportLoansToCSV(loans);
    setShowExportMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <span className="text-xl sm:text-2xl font-black font-numeric">₹</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Udhaar Book
              </h1>
              {isDemoMode && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase tracking-wider">
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Private Money Lending & Simple Interest Ledger
            </p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notification Button */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Push Notification Settings"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Export Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                setShowUserMenu(false);
              }}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
              title="Export Loans to Excel / CSV"
            >
              <Download className="w-5 h-5" />
              <ChevronDown className="w-3.5 h-3.5 hidden sm:block text-slate-400" />
            </button>

            {showExportMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-fadeIn text-sm"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <div className="px-3 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Backup / Export Data
                </div>
                <button
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Download CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* User Menu / Account */}
          <div className="relative">
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowExportMenu(false);
                }}
                className="p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors text-xs sm:text-sm font-semibold"
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {currentUser.displayName || 'Lender'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm"
              >
                Sign In
              </button>
            )}

            {showUserMenu && currentUser && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fadeIn text-sm"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.displayName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    seedSampleData();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Seed Sample Test Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all loan records?')) {
                      clearAllLoans();
                    }
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Clear All Loans</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
