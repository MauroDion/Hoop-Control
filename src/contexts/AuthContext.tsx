'use client';

import { onIdTokenChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { getUserProfileById } from '@/lib/actions/users';
import { getBrandingSettings } from '@/lib/actions/admin/settings';
import type { UserFirestoreProfile, BrandingSettings } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: User | null;
  profile: UserFirestoreProfile | null;
  loading: boolean;
  branding: BrandingSettings;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Failed to clear server session on logout:", error);
    } finally {
      setUser(null);
      setProfile(null);
      // Ensure redirect happens after state is cleared
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Fetch branding settings once on initial load
    getBrandingSettings().then(setBranding);

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userProfile = await getUserProfileById(firebaseUser.uid);
        setProfile(userProfile);

        // Logic for redirection based on profile status
        if (userProfile) {
          if (userProfile.status !== 'approved') {
            await logout();
            // The login page will show the status message based on the query param
            router.push(`/login?status=${userProfile.status}`);
            return; // Stop further execution
          }
          if (!userProfile.onboardingCompleted) {
             const isSuperAdmin = userProfile.profileTypeId === 'super_admin';
              if (isSuperAdmin) {
                // Super admins are considered onboarded by default
              } else if (userProfile.profileTypeId === 'parent_guardian' && !pathname.startsWith('/profile/my-children')) {
                router.push('/profile/my-children');
              }
          }
        } else {
          // This case is for a brand new user who just signed up via email/password
          // and needs to complete their profile information.
          if (!pathname.startsWith('/profile/complete-registration')) {
            router.push('/profile/complete-registration');
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [logout, pathname, router]);

  // This loading screen is crucial to prevent flicker or showing protected content prematurely
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-4 text-lg font-medium text-muted-foreground">Verificando sesión...</p>
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
