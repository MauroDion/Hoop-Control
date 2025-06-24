"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  logout: (isAutoLogout?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const inactivityTimer = useRef<NodeJS.Timeout>();

  const logout = useCallback(async (isAutoLogout: boolean = false) => {
    if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
    }
    
    console.log("AuthProvider: Logout process initiated.");
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
    } catch (error: any) {
      console.error('AuthProvider: API call to /api/auth/session-logout failed:', error);
    } finally {
      try {
        await firebaseSignOut(auth);
        console.log("AuthProvider: Client-side firebaseSignOut() completed.");
        if (isAutoLogout) {
            toast({ title: "Sesión Cerrada Automáticamente", description: "Has sido desconectado por inactividad." });
        } else {
            toast({ title: "Sesión Cerrada", description: "Has cerrado sesión correctamente." });
        }
        router.push('/login');
        router.refresh();
      } catch (clientSignOutError: any) {
        console.error('AuthProvider: Critical error during client-side signOut:', clientSignOutError);
        toast({ variant: "destructive", title: "Fallo en Cierre de Sesión Local", description: clientSignOutError.message });
        router.push('/login');
        router.refresh();
      }
    }
  }, [router, toast]);

  useEffect(() => {
    const handleInactivity = () => {
        logout(true);
    };

    const resetInactivityTimer = () => {
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }
        inactivityTimer.current = setTimeout(handleInactivity, INACTIVITY_TIMEOUT_MS);
    };

    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    const setupInactivityListeners = () => {
        events.forEach(event => window.addEventListener(event, resetInactivityTimer));
        resetInactivityTimer();
    };

    const cleanupInactivityListeners = () => {
        events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        setupInactivityListeners();
      } else {
        cleanupInactivityListeners();
      }
    }, (error) => {
      console.error("Auth state change error:", error);
      setUser(null);
      setLoading(false);
      cleanupInactivityListeners();
    });

    return () => {
        unsubscribe();
        cleanupInactivityListeners();
    };
  }, [logout]);


  if (loading) {
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
