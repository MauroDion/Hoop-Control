
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
  logout: (showToast?: boolean) => Promise<void>;
  branding: BrandingSettings;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/', '/login', '/register', '/reset-password', '/profile/complete-registration'];
const isPublicPath = (path: string) => PUBLIC_PATHS.some(p => path.startsWith(p));


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = useCallback(async (showToast = true) => {
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' }); 
      await signOut(auth);
      if (showToast) {
        toast({ title: "Sesión Cerrada" });
      }
    } catch (error) {
       console.error("Logout failed:", error);
       if(showToast) {
         toast({ variant: 'destructive', title: 'Error al cerrar sesión' });
       }
    } finally {
      setUser(null);
      setProfile(null);
      if (!isPublicPath(pathname)) {
        router.push('/login');
      }
    }
  }, [toast, pathname, router]);

  useEffect(() => {
    getBrandingSettings().then(setBranding);
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          // Verify session with server to align client/server state
          const idToken = await firebaseUser.getIdToken();
          const response = await fetch('/api/auth/session-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          
          const responseData = await response.json();

          if (response.ok) {
              const userProfile = await getUserProfileById(firebaseUser.uid);
              if (!userProfile) throw new Error("Profile inconsistent with session.");
              setProfile(userProfile);
              
              if (userProfile.profileTypeId === 'parent_guardian' && !userProfile.onboardingCompleted && pathname !== '/profile/my-children') {
                router.replace('/profile/my-children');
              } else if (isPublicPath(pathname) || pathname === '/profile/complete-registration') {
                router.replace('/dashboard');
              }
          } else {
              if (responseData.reason === 'not_found') {
                  if (pathname !== '/profile/complete-registration') {
                      router.replace('/profile/complete-registration');
                  }
              } else {
                  await handleLogout(false);
                  router.push(`/login?status=${responseData.reason || 'login_required'}`);
                  return;
              }
          }
        } catch (error: any) {
            console.error("Error during authentication flow:", error);
            await handleLogout(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        if (!isPublicPath(pathname)) {
            router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router, handleLogout]);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
