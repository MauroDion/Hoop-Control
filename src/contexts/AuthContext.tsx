"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile, BrandingSettings } from '@/types';
import { getBrandingSettings } from '@/app/admin/settings/actions';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserFirestoreProfile | null;
  loading: boolean;
  logout: (silent?: boolean) => Promise<void>;
  branding: BrandingSettings;
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
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = useCallback(async (silent = false) => {
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' }); 
      await signOut(auth);
      if (!silent) {
        toast({ title: "Sesión Cerrada" });
        router.push('/login');
      }
    } catch (error) {
       console.error("Logout failed:", error);
       if (!silent) toast({ variant: 'destructive', title: 'Error al cerrar sesión' });
    }
  }, [toast, router]);

  useEffect(() => {
    getBrandingSettings().then(setBranding);
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
            const userProfile = await getUserProfileById(firebaseUser.uid);

            if (!userProfile) {
                // This can happen if a user is created in Auth but the profile creation fails.
                // Or if a user is from a previous version of the app without a profile.
                if (window.location.pathname !== '/profile/complete-registration') {
                    router.push('/profile/complete-registration');
                }
                setUser(firebaseUser); // Set user so they can complete registration
                setProfile(null);
                setLoading(false);
                return;
            }

            if (userProfile.status !== 'approved') {
                await handleLogout(true); // Silent logout
                const reason = userProfile.status || 'not_approved';
                router.push(`/login?status=${reason}`);
                setLoading(false);
                return;
            }
            
            if (userProfile.profileTypeId === 'parent_guardian' && !userProfile.onboardingCompleted) {
                 if (window.location.pathname !== '/profile/my-children') {
                    router.push('/profile/my-children');
                 }
            }
            
            setUser(firebaseUser);
            setProfile(userProfile);
            
        } else {
            setUser(null);
            setProfile(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [handleLogout, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground mt-4">Cargando aplicación...</p>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={{ user, profile, loading, logout: handleLogout, branding }}>
      {children}
    </AuthContext.Provider>
  );
};
