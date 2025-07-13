
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
    console.log("AuthContext: Iniciando logout...");
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
      await firebaseSignOut(auth);
      console.log("AuthContext: Logout completado.");
    } catch (error) {
      console.error("AuthContext: Error durante el logout:", error);
    } finally {
      setUser(null);
      setProfile(null);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    console.log('AuthContext: Montado. Obteniendo ajustes de branding...');
    getBrandingSettings().then(setBranding);

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      console.log('AuthContext: onIdTokenChanged disparado.');
      setLoading(true);
      if (firebaseUser) {
        console.log(`AuthContext: Usuario de Firebase detectado (UID: ${firebaseUser.uid}). Obteniendo perfil...`);
        setUser(firebaseUser);
        const userProfile = await getUserProfileById(firebaseUser.uid);
        setProfile(userProfile);
        console.log('AuthContext: Perfil de Firestore obtenido:', userProfile);

        if (userProfile) {
          if (userProfile.status !== 'approved') {
            console.log(`AuthContext: Estado del perfil es '${userProfile.status}'. Redirigiendo a login.`);
            await logout();
            router.push(`/login?status=${userProfile.status}`);
            return; 
          }

          if (!userProfile.onboardingCompleted) {
            console.log('AuthContext: Onboarding no completado.');
            const isParentOnboarding = userProfile.profileTypeId === 'parent_guardian' && !pathname.startsWith('/profile/my-children');
            const isGeneralOnboarding = !userProfile.profileTypeId && !pathname.startsWith('/profile/complete-registration');
            
            if (isParentOnboarding) {
              console.log('AuthContext: Redirigiendo a onboarding de padre/tutor.');
              router.push('/profile/my-children');
            } else if (isGeneralOnboarding) {
              console.log('AuthContext: Redirigiendo a onboarding general.');
              router.push('/profile/complete-registration');
            }
          } else {
             console.log('AuthContext: Usuario aprobado y onboarding completado.');
          }
        } else {
          console.log(`AuthContext: Usuario de Firebase existe pero no tiene perfil en Firestore. Redirigiendo a completar registro.`);
          if (!pathname.startsWith('/profile/complete-registration')) {
            router.push('/profile/complete-registration');
          }
        }
      } else {
        console.log('AuthContext: No hay usuario de Firebase.');
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
      console.log('AuthContext: Carga finalizada.');
    });

    return () => {
      console.log("AuthContext: Desmontado. Limpiando listener de onIdTokenChanged.");
      unsubscribe();
    }
  }, [logout, pathname, router]);

  useEffect(() => {
    let inactivityTimeout: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        if (auth.currentUser) {
          console.log("⏱️ AuthContext: Cerrando sesión por inactividad");
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
