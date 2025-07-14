
'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getBrandingSettings } from '@/lib/actions/admin/settings';
import { getUserProfileById } from '@/lib/actions/users/get-user-profile';
import type { UserFirestoreProfile, BrandingSettings } from '@/types';
import { auth, signInWithEmailAndPassword } from '@/lib/firebase/client';

// --- MOCK USER DATA ---
const MOCK_SUPER_ADMIN_USER_CREDENTIALS = {
  email: "mauro@hotmail.com",
  password: "super-secret-password-for-dev", // Use a throwaway password
};

const MOCK_SUPER_ADMIN_PROFILE: UserFirestoreProfile = {
  uid: "7jCTpzm9aBbkz0KRk4qaiDsaKG32",
  email: "mauro@hotmail.com",
  displayName: "Mauro (Super Admin)",
  photoURL: null,
  profileTypeId: 'super_admin',
  clubId: null,
  status: 'approved',
  isSeeded: false,
  onboardingCompleted: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
// --- END MOCK USER DATA ---

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

  const logout = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    const signInDevUser = async () => {
      try {
        if (!auth.currentUser) {
          console.log("AuthContext: No user signed in, attempting to sign in dev user...");
          await signInWithEmailAndPassword(auth, MOCK_SUPER_ADMIN_USER_CREDENTIALS.email, MOCK_SUPER_ADMIN_USER_CREDENTIALS.password);
          console.log("AuthContext: Dev user signed in successfully.");
        } else {
            console.log("AuthContext: User already signed in.");
        }
      } catch (error) {
        console.error("AuthContext: Failed to sign in dev user. Please ensure the user exists in Firebase Auth.", error);
      }
    };
    
    signInDevUser();

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userProfile = await getUserProfileById(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    getBrandingSettings().then(setBranding);

    return () => unsubscribe();
  }, []);


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
