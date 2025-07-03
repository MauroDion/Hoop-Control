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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/session-logout', { method: 'POST' });
    await signOut(auth);
    // onIdTokenChanged listener will handle state cleanup
  }, []);

  useEffect(() => {
    getBrandingSettings().then(setBranding);
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
            setUser(firebaseUser);
            try {
                const idToken = await firebaseUser.getIdToken();
                await fetch('/api/auth/session-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });
                
                const userProfile = await getUserProfileById(firebaseUser.uid);
                setProfile(userProfile);

            } catch (error: any) {
                console.error("Auth context error:", error.message);
                await handleLogout();
            }
        } else {
            setUser(null);
            setProfile(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [handleLogout]);

  useEffect(() => {
      if (loading) return;

      if (user && !profile) {
          if (pathname !== '/profile/complete-registration') {
              router.push('/profile/complete-registration');
          }
      } else if (user && profile && profile.onboardingCompleted === false) {
          if (profile.profileTypeId === 'parent_guardian' && pathname !== '/profile/my-children') {
              router.push('/profile/my-children');
          }
      }
  }, [user, profile, loading, pathname, router]);
  
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
