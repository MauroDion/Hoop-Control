
"use client";

import { auth, onIdTokenChanged, signOut, type FirebaseUser } from '@/lib/firebase/client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/app/users/actions';
import { getBrandingSettings } from '@/app/admin/settings/actions';
import type { UserFirestoreProfile, BrandingSettings } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserFirestoreProfile | null;
  loading: boolean;
  branding: BrandingSettings;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = async () => {
      try {
        await fetch('/api/auth/session-logout', { method: 'POST' });
      } catch (error) {
        console.error("Failed to clear server session on logout:", error);
      } finally {
        await signOut(auth);
        router.push('/login');
      }
  };

  useEffect(() => {
    getBrandingSettings().then(setBranding);

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userProfile = await getUserProfileById(firebaseUser.uid);
        setProfile(userProfile);

        if (userProfile && !userProfile.onboardingCompleted) {
           if (userProfile.profileTypeId === 'parent_guardian') {
               router.push('/profile/my-children');
           }
        } else if (!userProfile) { // A new user from social sign in
            router.push('/profile/complete-registration');
        } else if (userProfile.status === 'pending_approval') {
            await logout();
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-20 items-center">
            <Skeleton className="h-8 w-40" />
            <div className="ml-auto flex items-center space-x-4">
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, branding, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
