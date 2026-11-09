import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';

interface UdhaarUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  currentUser: UdhaarUser | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UdhaarUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('udhaar_demo_session') === 'true' || !isFirebaseConfigured;
  });

  useEffect(() => {
    if (isDemoMode) {
      const demoEmail = localStorage.getItem('udhaar_demo_email') || 'lender@udhaarbook.in';
      setCurrentUser({
        uid: 'demo-money-lender-uid',
        email: demoEmail,
        displayName: 'Mahajan Ji (Lender)',
        isDemo: true,
      });
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured) {
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Lender',
          isDemo: false,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isDemoMode]);

  const login = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || isDemoMode) {
      localStorage.setItem('udhaar_demo_session', 'true');
      localStorage.setItem('udhaar_demo_email', email);
      setIsDemoMode(true);
      setCurrentUser({
        uid: 'demo-money-lender-uid',
        email,
        displayName: email.split('@')[0],
        isDemo: true,
      });
      return;
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, name?: string) => {
    if (!isFirebaseConfigured) {
      localStorage.setItem('udhaar_demo_session', 'true');
      localStorage.setItem('udhaar_demo_email', email);
      setIsDemoMode(true);
      setCurrentUser({
        uid: 'demo-money-lender-uid',
        email,
        displayName: name || email.split('@')[0],
        isDemo: true,
      });
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
  };

  const logout = async () => {
    if (isDemoMode) {
      localStorage.removeItem('udhaar_demo_session');
      setIsDemoMode(false);
      setCurrentUser(null);
      return;
    }
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured || isDemoMode) {
      // In demo mode, simulate success
      await new Promise((resolve) => setTimeout(resolve, 600));
      return;
    }
    await sendPasswordResetEmail(auth, email);
  };

  const enterDemoMode = () => {
    localStorage.setItem('udhaar_demo_session', 'true');
    setIsDemoMode(true);
    setCurrentUser({
      uid: 'demo-money-lender-uid',
      email: 'lender@udhaarbook.in',
      displayName: 'Demo Money Lender',
      isDemo: true,
    });
  };

  const exitDemoMode = () => {
    localStorage.removeItem('udhaar_demo_session');
    setIsDemoMode(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isDemoMode,
        login,
        signup,
        logout,
        resetPassword,
        enterDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
