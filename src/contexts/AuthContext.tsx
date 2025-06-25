"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  logout: (showToast?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const logout = useCallback(async (showToast = true) => {
    console.log("AuthProvider: Logout process initiated.");
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
    } catch (error) {
      console.error("Logout API call failed, proceeding with client-side cleanup:", error);
    } finally {
      await firebaseSignOut(auth);
      if (showToast) {
        toast({ title: "Sesión Cerrada", description: "Has cerrado sesión correctamente." });
      }
    }
  }, [toast]);

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

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-headline font-semibold">Verificando sesión...</h1>
            <p className="text-muted-foreground">Por favor, espera.</p>
        </div>
      ) : (
        children
      )}
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
