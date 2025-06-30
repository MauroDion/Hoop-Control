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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const { toast } = useToast();

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' }); 
      await signOut(auth);
      toast({ title: "Sesión Cerrada" });
      router.push('/login');
    } catch (error) {
       console.error("Logout failed:", error);
       toast({ variant: 'destructive', title: 'Error al cerrar sesión' });
    }
  }, [toast, router]);

  useEffect(() => {
    getBrandingSettings().then(setBranding);
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
            try {
                const idToken = await firebaseUser.getIdToken(true);
                const response = await fetch('/api/auth/session-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });

                if (!response.ok) {
                    throw new Error("Session login failed");
                }
                
                const userProfile = await getUserProfileById(firebaseUser.uid);
                setUser(firebaseUser);
                setProfile(userProfile);
                
            } catch(error) {
                console.error("Error during auth state sync:", error);
                await handleLogout();
            }
        } else {
            setUser(null);
            setProfile(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [handleLogout]);

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
