"use client";

import { auth, onIdTokenChanged, signOut, type FirebaseUser } from '@/lib/firebase/client';
import { useRouter, usePathname } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserFirestoreProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
    } catch (error) {
        console.error("Failed to call server logout", error);
    } finally {
        await signOut(auth);
        router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in.
        setUser(firebaseUser);
        try {
          const idToken = await firebaseUser.getIdToken(true); // Force refresh
          const response = await fetch('/api/auth/session-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.reason || 'Session rejected by server.');
          }

          const userProfile = await getUserProfileById(firebaseUser.uid);
          setProfile(userProfile);
          
          if (!userProfile) {
            if (pathname !== '/profile/complete-registration') {
              router.push('/profile/complete-registration');
            }
          }
        } catch (error: any) {
          console.error("Auth context error:", error.message);
          toast({ variant: 'destructive', title: "Error de Sesión", description: error.message });
          await logout();
        } finally {
            setLoading(false);
        }
      } else {
        // User is signed out.
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [logout, pathname, router, toast]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground mt-4">Cargando aplicación...</p>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
