'use client';

import {
  onIdTokenChanged,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const logout = async () => {
      try {
        await fetch('/api/auth/session-logout', { method: 'POST' });
      } catch (error) {
        console.error("Failed to clear server session on logout:", error);
      } finally {
        await firebaseSignOut(auth);
        router.push('/login');
      }
  };

  useEffect(() => {
    getBrandingSettings().then(setBranding);
    
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("AuthContext: ⏳ Firebase auth state check timed out after 5 seconds. This could be due to network issues or Firebase being blocked. Proceeding with no authenticated user.");
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        clearTimeout(timeout);
        if (firebaseUser) {
            setUser(firebaseUser);
            const userProfile = await getUserProfileById(firebaseUser.uid);
            setProfile(userProfile);

            if (userProfile) {
                if (userProfile.status !== 'approved') {
                    await logout();
                    router.push(`/login?status=${userProfile.status}`);
                    return;
                } else if (!userProfile.onboardingCompleted && !pathname.startsWith('/profile')) {
                    router.push('/profile/my-children'); // Or the first onboarding step
                    return;
                }
            } else {
                 if (pathname !== '/profile/complete-registration') {
                    router.push('/profile/complete-registration');
                    return;
                }
            }
        } else {
            setUser(null);
            setProfile(null);
        }
        setLoading(false);
    }, (error) => {
        console.error("AuthContext: ❌ Error in onIdTokenChanged:", error);
        setUser(null);
        setProfile(null);
        setLoading(false);
        clearTimeout(timeout);
    });

    return () => {
        unsubscribe();
        clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
