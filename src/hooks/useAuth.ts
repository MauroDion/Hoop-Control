"use client";
import { useContext } from 'react';
// The actual context is defined in AuthContext.tsx, this is just a hook wrapper
// But we need to define the context type here for the hook to be typed correctly.
import type { User } from 'firebase/auth';
import type { UserFirestoreProfile, BrandingSettings } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserFirestoreProfile | null;
  loading: boolean;
  branding: BrandingSettings;
  logout: () => Promise<void>;
}

// We need a placeholder context for the type system.
// The real context is in AuthProvider, but we can't import it here directly
// without causing circular dependencies or other issues.
const AuthContext = require('@/contexts/AuthContext').AuthContext as React.Context<AuthContextType | undefined>;


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
