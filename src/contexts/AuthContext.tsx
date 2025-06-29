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

const PUBLIC_PATHS = ['/', '/login', '/register', '/reset-password'];
const isPublicPath = (path: string) => PUBLIC_PATHS.some(p => path.startsWith(p) && (p !== '/' || path === '/'));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = useCallback(async () => {
    console.log("AuthContext: Logout initiated.");
    try {
      await signOut(auth); // This will trigger onIdTokenChanged, which handles the rest.
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión correctamente." });
    } catch (error) {
       console.error("Logout failed:", error);
       toast({ variant: 'destructive', title: 'Error al cerrar sesión', description: 'Ocurrió un error.' });
    } finally {
        router.push('/login');
    }
  }, [router, toast]);

  useEffect(() => {
    getBrandingSettings().then(setBranding);
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // User is signed in.
        setUser(firebaseUser);
        
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await fetch('/api/auth/session-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          
          if (!response.ok) throw new Error("Server session login failed.");

          const userProfile = await getUserProfileById(firebaseUser.uid);
          if (userProfile) {
            setProfile(userProfile);
            if (userProfile.profileTypeId === 'parent_guardian' && !userProfile.onboardingCompleted && !pathname.startsWith('/profile/my-children')) {
              router.replace('/profile/my-children');
            }
          } else {
            console.error("CRITICAL: Profile not found for authenticated user. Forcing logout.");
            await handleLogout();
          }
        } catch (error) {
            console.error("Error during session sync or profile fetch:", error);
            await handleLogout();
        }
      } else {
        // User is signed out.
        setUser(null);
        setProfile(null);
        await fetch('/api/auth/session-logout', { method: 'POST' });
        if (!isPublicPath(pathname)) {
            router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleLogout, pathname, router]);

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

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
