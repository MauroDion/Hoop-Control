"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
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
  logout: () => Promise<void>;
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
  const [loading, setLoading] = useState(true); // Start as true
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' }); 
      await signOut(auth);
      router.push('/login');
    } catch (error) {
       console.error("Logout failed:", error);
       toast({ variant: 'destructive', title: 'Error al cerrar sesión' });
    }
  }, [toast, router]);

  // Effect 1: Handle auth state changes from Firebase
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
            setUser(firebaseUser);
            const userProfile = await getUserProfileById(firebaseUser.uid);
            setProfile(userProfile);
        } else {
            setUser(null);
            setProfile(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Effect 2: Handle business logic and redirections based on state
  useEffect(() => {
      if (loading) return; // Wait until initial auth check is done

      if (user) {
          if (!profile) {
              if (pathname !== '/profile/complete-registration') {
                  router.push('/profile/complete-registration');
              }
          } else if (profile.status !== 'approved') {
              handleLogout();
              router.push(`/login?status=${profile.status || 'not_approved'}`);
          } else if (profile.profileTypeId === 'parent_guardian' && !profile.onboardingCompleted) {
              if (pathname !== '/profile/my-children') {
                  router.push('/profile/my-children');
              }
          }
      }
  }, [user, profile, loading, pathname, router, handleLogout]);

  // Effect 3: Fetch branding settings once
  useEffect(() => {
    getBrandingSettings().then(setBranding);
  }, []);
  
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
