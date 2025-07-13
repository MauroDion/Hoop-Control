
'use server';

import { adminDb } from '@/lib/firebase/admin';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus, Child } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

// This file is now empty because all its contents were moved to either
// `src/lib/actions/users/index.ts` (for client-callable actions)
// or `src/lib/actions/admin/users.ts` (for admin-only actions)
// to resolve a server/client module boundary issue.

// You can safely delete this file, but for now it's just been cleared.
    
