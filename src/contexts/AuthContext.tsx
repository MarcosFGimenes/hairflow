
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth'; // Import User type directly
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // auth might be undefined if initialization failed
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  firebaseAuthAvailable: boolean; // New state to indicate if Firebase Auth is usable
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseAuthAvailable, setFirebaseAuthAvailable] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      console.error("AuthContext: Firebase auth instance is not available. Firebase might not have initialized correctly. Check API keys and server restart.");
      setLoading(false); // Stop loading, but auth is not available
      setFirebaseAuthAvailable(false);
      return;
    }

    setFirebaseAuthAvailable(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []); // Removed auth from dependency array to prevent re-runs if auth instance changes, rely on initial check

  const logout = async () => {
    if (!auth) {
      toast({ title: "Error", description: "Firebase is not available to logout.", variant: "destructive" });
      return;
    }
    try {
      await firebaseSignOut(auth);
      setUser(null); // Explicitly set user to null
      toast({ title: "Logged out successfully." });
      if (!pathname.startsWith('/auth')) {
        router.push('/auth/login');
      }
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, firebaseAuthAvailable }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
