
"use client";

import { auth, onIdTokenChanged, signOut, type FirebaseUser } from '@/lib/firebase/client';
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
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(async () => {
    await fetch('/api/auth/session-logout', { method: 'POST' });
    await signOut(auth);
    // The onIdTokenChanged listener will handle state cleanup and navigation.
  }, []);

  useEffect(() => {
    const fetchBranding = async () => {
        const settings = await getBrandingSettings();
        setBranding(settings);
    };
    fetchBranding();
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in.
        setUser(firebaseUser);
        try {
          // Verify session on the server
          const idToken = await firebaseUser.getIdToken();
          const response = await fetch('/api/auth/session-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
          });
          
          if (!response.ok) {
            // Server rejected the session (e.g. user not approved yet)
            throw new Error('Session rejected by server.');
          }

          const userProfile = await getUserProfileById(firebaseUser.uid);
          setProfile(userProfile);
          
          // Onboarding redirection logic
          if (!userProfile) {
            if (pathname !== '/profile/complete-registration') {
              router.push('/profile/complete-registration');
            }
          } else if (userProfile.onboardingCompleted === false) {
             if (userProfile.profileTypeId === 'parent_guardian' && pathname !== '/profile/my-children') {
              router.push('/profile/my-children');
            }
          }

        } catch (error: any) {
          console.error("Auth context error:", error.message);
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
  }, [logout, pathname, router]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground mt-4">Cargando aplicación...</p>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, branding }}>
      {children}
    </AuthContext.Provider>
  );
};
