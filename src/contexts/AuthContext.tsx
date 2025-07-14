
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
  // Implement other methods and properties as needed, but they can be empty for this mock
  getIdToken: async () => 'mock-token',
  getIdTokenResult: async () => ({ token: 'mock-token', claims: {}, authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, expirationTime: '' }),
  reload: async () => {},
  delete: async () => {},
  toJSON: () => ({}),
  providerId: 'password',
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
  const [loading, setLoading] = useState(false); // Set to false as we are not fetching auth state
  const router = useRouter();

  const logout = useCallback(async () => {
    // In this mock setup, logout does nothing but log to console
    console.log("Logout function called, but authentication is currently disabled.");
    // alert("Authentication is currently disabled for development.");
  }, []);

  useEffect(() => {
    // We can still fetch branding settings
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
