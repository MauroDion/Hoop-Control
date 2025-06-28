"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  logout: (showToast?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

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

  const logout = async (showToast = true) => {
    console.log("AuthContext: Logout initiated.");
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
      console.log("AuthContext: Server session cookie cleared.");
    } catch (error) {
       console.error("Logout API call failed, proceeding with client-side cleanup:", error);
       if (showToast) {
         toast({ variant: 'destructive', title: 'Error de Red', description: "No se pudo contactar con el servidor para cerrar sesión."});
       }
    } finally {
      await signOut(auth);
      console.log("AuthContext: Client-side signOut complete.");
      if (showToast) {
        toast({ title: "Sesión Cerrada", description: "Has cerrado sesión correctamente." });
      }
      router.push('/login');
      router.refresh();
      console.log("AuthContext: Redirected to /login and refreshed state.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Verificando sesión...</p>
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
