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
    // Just sign out client-side. The onIdTokenChanged listener will handle the rest.
    await signOut(auth);
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            // User is signed in or token has refreshed.
            setUser(firebaseUser); // Set Firebase user immediately
            try {
                // Create or refresh server session cookie
                const idToken = await firebaseUser.getIdToken();
                const response = await fetch('/api/auth/session-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.reason || 'Session login failed');
                }
                
                const userProfile = await getUserProfileById(firebaseUser.uid);
                setProfile(userProfile);

            } catch (error: any) {
                console.error("Auth context error:", error.message);
                if (error.message === 'pending_approval' || error.message === 'rejected' || error.message === 'not_found') {
                    // Force a full logout and redirect with status
                    await handleLogout(); 
                    router.push(`/login?status=${error.message}`);
                } else {
                    // For other errors, just log out
                    await handleLogout();
                }
            }
        } else {
            // User is signed out.
            setUser(null);
            setProfile(null);
            // Ensure server cookie is also cleared
            await fetch('/api/auth/session-logout', { method: 'POST' });
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [router, handleLogout]);

  useEffect(() => {
      if (loading) return; // Wait until initial auth check and profile fetch are done

      // Onboarding / state-based redirection logic
      if (user) { // Only run redirection logic if a user is definitively logged in
          if (!profile) {
              // Auth user exists, but no profile in DB -> needs to complete registration
              if (pathname !== '/profile/complete-registration') {
                  router.push('/profile/complete-registration');
              }
          } else if (profile.profileTypeId === 'parent_guardian' && !profile.onboardingCompleted) {
              // Parent who hasn't added their children yet
              if (pathname !== '/profile/my-children') {
                  router.push('/profile/my-children');
              }
          }
      }
  }, [user, profile, loading, pathname, router]);

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
