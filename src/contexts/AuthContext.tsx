"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserFirestoreProfile | null;
  loading: boolean;
  logout: (showToast?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/', '/login', '/register', '/reset-password'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const logout = useCallback(async (showToast = true) => {
    console.log("AuthContext: Logout initiated.");
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
      await signOut(auth); // This will trigger the onAuthStateChanged listener below
      if (showToast) {
        toast({ title: "Sesión Cerrada", description: "Has cerrado sesión correctamente." });
      }
    } catch (error) {
       console.error("Logout API call or sign out failed:", error);
       toast({ variant: 'destructive', title: 'Error al cerrar sesión', description: 'Ocurrió un error.' });
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await getUserProfileById(firebaseUser.uid);
          if (userProfile) {
            setUser(firebaseUser);
            setProfile(userProfile);
            if (userProfile.profileTypeId === 'parent_guardian' && !userProfile.onboardingCompleted) {
              const currentPath = window.location.pathname;
              if (currentPath !== '/profile/my-children') {
                router.replace('/profile/my-children');
              }
            }
          } else {
            console.error(`Auth Error: No profile found for UID ${firebaseUser.uid}. Forcing logout.`);
            await logout(false);
          }
        } catch (err) {
          console.error("Auth Error: Failed to fetch user profile.", err);
          await logout(false);
        } finally {
          setLoading(false);
        }
      } else {
        // No firebase user
        setUser(null);
        setProfile(null);
        setLoading(false);
        const currentPath = window.location.pathname;
        if (!PUBLIC_PATHS.some(path => currentPath.startsWith(path) && (path === '/' || currentPath.length === path.length || currentPath.startsWith(path + '/')))) {
            console.warn(`AuthContext: Unauthenticated user on protected route ${currentPath}. Redirecting.`);
            router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [router, logout]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
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
