
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
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    getBrandingSettings().then(setBranding);

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userProfile = await getUserProfileById(firebaseUser.uid);
        setProfile(userProfile);

        if (userProfile) {
          if (userProfile.status !== 'approved') {
            await logout();
            router.push(`/login?status=${userProfile.status}`);
            return; 
          }

          if (!userProfile.onboardingCompleted) {
            const isParentOnboarding = userProfile.profileTypeId === 'parent_guardian' && !pathname.startsWith('/profile/my-children');
            const isGeneralOnboarding = !userProfile.profileTypeId && !pathname.startsWith('/profile/complete-registration');

            if (isParentOnboarding) {
              router.push('/profile/my-children');
            } else if (isGeneralOnboarding) {
              router.push('/profile/complete-registration');
            }
          }
        } else {
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

  useEffect(() => {
    let inactivityTimeout: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        if (auth.currentUser) {
          console.log("⏱️ Cerrando sesión por inactividad");
          logout();
        }
      }, 15 * 60 * 1000); // 15 minutos
    };

    if (typeof window !== "undefined" && auth.currentUser) {
      window.addEventListener("mousemove", resetInactivityTimer);
      window.addEventListener("keydown", resetInactivityTimer);
      resetInactivityTimer();
    }

    return () => {
      clearTimeout(inactivityTimeout);
      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", resetInactivityTimer);
        window.removeEventListener("keydown", resetInactivityTimer);
      }
    };
  }, [user, logout]);


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
