'use client';

import { onIdTokenChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
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
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Failed to clear server session on logout:", error);
    } finally {
      setUser(null);
      setProfile(null);
      router.push('/login');
    }
  };

  useEffect(() => {
    getBrandingSettings().then(setBranding);

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const sessionLoginResponse = await fetch('/api/auth/session-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          if (!sessionLoginResponse.ok) {
            const errorData = await sessionLoginResponse.json();
            await logout();
            router.push(`/login?status=${errorData.reason || 'session_error'}`);
            return;
          }
          
          setUser(firebaseUser);
          const userProfile = await getUserProfileById(firebaseUser.uid);
          setProfile(userProfile);

          if (userProfile) {
            if (userProfile.status !== 'approved') {
              await logout();
              router.push(`/login?status=${userProfile.status}`);
            } else if (!userProfile.onboardingCompleted) {
              const isSuperAdmin = userProfile.profileTypeId === 'super_admin';
              const isParentOnboarding = userProfile.profileTypeId === 'parent_guardian' && !pathname.startsWith('/profile/my-children');
              
              if (isParentOnboarding) {
                  router.push('/profile/my-children');
              } else if (!isSuperAdmin && !isParentOnboarding) {
                  // For other roles that need onboarding but aren't parent or super_admin.
                  // This case can be expanded later if needed.
              }
            }
          } else {
            if (pathname !== '/profile/complete-registration') {
              router.push('/profile/complete-registration');
            }
          }
        } catch (error) {
          console.error("Error during auth state sync:", error);
          await logout();
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
