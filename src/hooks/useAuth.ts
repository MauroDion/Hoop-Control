"use client";
// This file is deprecated and will be removed in a future update.
// Please use `import { useAuth } from '@/contexts/AuthContext';` instead.
import { useAuth as useAuthFromContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  return useAuthFromContext();
};
