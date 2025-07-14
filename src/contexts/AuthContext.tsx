
'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getBrandingSettings } from '@/lib/actions/admin/settings';
import type { UserFirestoreProfile, BrandingSettings } from '@/types';

// --- MOCK USER DATA ---
const MOCK_SUPER_ADMIN_USER: User = {
  uid: "7jCTpzm9aBbkz0KRk4qaiDsaKG32",
  email: "mauro@hotmail.com",
  displayName: "Mauro (Super Admin)",
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => '',
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({}),
  providerId: 'password'
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
  const [user, setUser] = useState<User | null>(MOCK_SUPER_ADMIN_USER);
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(MOCK_SUPER_ADMIN_PROFILE);
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [loading, setLoading] = useState(false); // No longer loading from Firebase

  const logout = useCallback(async () => {
    // In mock mode, this does nothing but could clear the state if needed
    setUser(null);
    setProfile(null);
    console.log("User logged out (mock).");
  }, []);

  useEffect(() => {
    // Fetch branding settings on initial load
    getBrandingSettings().then(setBranding);
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
