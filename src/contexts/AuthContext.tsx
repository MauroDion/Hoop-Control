"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const logout = useCallback(async () => {
    console.log("AuthProvider: Logout process initiated.");
    try {
      // Clear server session first
      await fetch('/api/auth/session-logout', { method: 'POST' });
    } catch (error: any) {
      console.error('AuthProvider: API call to /api/auth/session-logout failed:', error);
      // Don't stop the logout process, but inform the user.
      toast({ variant: "destructive", title: "Logout Warning", description: "Could not clear server session. Logging out locally." });
    }
    
    // Then sign out from Firebase client
    try {
        await firebaseSignOut(auth);
        console.log("AuthProvider: Client-side firebaseSignOut() completed.");
        toast({ title: "Sesión Cerrada", description: "Has cerrado sesión correctamente." });
        // Use router to navigate and refresh state
        router.push('/login');
        router.refresh(); // Ensure state is fully reset
    } catch (clientSignOutError: any) {
        console.error('AuthProvider: Critical error during client-side signOut:', clientSignOutError);
        toast({ variant: "destructive", title: "Fallo en Cierre de Sesión Local", description: clientSignOutError.message });
        // Still force redirect even if client signout fails.
        router.push('/login');
        router.refresh();
    }
  }, [toast, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setUser(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    // Simple full-page loading skeleton
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center">
            <Skeleton className="h-8 w-32" />
            <div className="ml-auto flex items-center space-x-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }
  

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
