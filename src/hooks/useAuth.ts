"use client";

import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import type { UserFirestoreProfile, BrandingSettings } from '@/types';

// The actual context is defined in AuthContext.tsx, this is just a hook wrapper
interface AuthContextType {
  user: User | null;
  profile: UserFirestoreProfile | null;
  loading: boolean;
  branding: BrandingSettings;
  logout: () => Promise<void>;
}

// We can't import the actual context here easily, but we can get its type for the hook
// The real provider is in AuthProvider. This avoids circular dependencies.
const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const useAuth = () => {
  // We re-import the actual context here inside the hook to ensure it works correctly
  // without creating module-level circular dependencies.
  const AuthContextConsumer = require('@/contexts/AuthContext').AuthContext;
  const context = useContext(AuthContextConsumer);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
