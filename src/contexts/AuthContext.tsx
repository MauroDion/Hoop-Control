
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
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

const PUBLIC_PATHS = ['/', '/login', '/register', '/reset-password'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const logout = useCallback(async (showToast = true) => {
    console.log("AuthContext: Logout initiated.");
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
      await signOut(auth);
      if (showToast) {
        toast({ title: "Sesión Cerrada", description: "Has cerrado sesión correctamente." });
      }
    } catch (error) {
       console.error("Logout API call or sign out failed:", error);
       toast({ variant: 'destructive', title: 'Error al cerrar sesión', description: 'Ocurrió un error.' });
    } finally {
        setUser(null);
        setProfile(null);
        router.push('/login');
        router.refresh();
    }
  }, [router, toast]);
  
  useEffect(() => {
    getBrandingSettings().then(setBranding);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/verify-session', { method: 'POST' });
        
        if (!res.ok) {
           throw new Error("Session invalid or server error");
        }

        const data = await res.json();
        
        if (data.isAuthenticated) {
          const userProfile = await getUserProfileById(data.uid);
          if (userProfile) {
            setUser(data as FirebaseUser);
            setProfile(userProfile);
            
            if (userProfile.profileTypeId === 'parent_guardian' && !userProfile.onboardingCompleted && !pathname.startsWith('/profile/my-children')) {
              router.replace('/profile/my-children');
            }
          } else {
            console.error("Inconsistent state: Valid auth but no profile. Forcing logout.");
            await logout(false);
          }
        } else {
            throw new Error("Session not authenticated");
        }
      } catch (error) {
        setUser(null);
        setProfile(null);
        const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p) && (p !== '/' || pathname === '/'));
        if (!isPublicPath) {
            console.log(`Redirecting from protected path "${pathname}" to login.`);
            router.replace('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Re-verify only when the path changes

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground mt-4">Verificando sesión...</p>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, branding }}>
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
