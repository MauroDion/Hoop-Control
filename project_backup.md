
# Backup del Proyecto BCSJD Web App

Este archivo contiene una copia de seguridad del código fuente del proyecto en el estado actual.

---

## .vscode/settings.json
```json
{
    "IDX.aI.enableInlineCompletion": true,
    "IDX.aI.enableCodebaseIndexing": true
}
```

---

## README.md
```md
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
```

---

## apphosting.yaml
```yaml
# Settings to manage and configure a Firebase App Hosting backend.
# https://firebase.google.com/docs/app-hosting/configure

runConfig:
  # Increase this value if you'd like to automatically spin up
  # more instances in response to increased traffic.
  maxInstances: 1
```

---

## components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

---

## next.config.js
```js

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
    webpack: (config, { isServer }) => {
        // This is to polyfill `process` which is not available in the browser.
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                process: require.resolve('process/browser'),
            };

            config.plugins.push(
                new (require('webpack').ProvidePlugin)({
                    process: 'process/browser',
                })
            );
        }
        
        // Exclude server-side packages from the bundle for both client and server.
        // This prevents Webpack from trying to parse native Node.js addons like `farmhash.node`
        // which are dependencies of `firebase-admin`.
        config.externals.push('firebase-admin', 'farmhash');
        
        return config;
    },
};

module.exports = nextConfig;
```

---

## package.json
```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "4.1.0",
    "@radix-ui/react-accordion": "1.2.0",
    "@radix-ui/react-alert-dialog": "1.1.0",
    "@radix-ui/react-avatar": "1.1.0",
    "@radix-ui/react-checkbox": "1.1.0",
    "@radix-ui/react-dialog": "1.1.0",
    "@radix-ui/react-dropdown-menu": "2.1.0",
    "@radix-ui/react-label": "2.1.0",
    "@radix-ui/react-menubar": "1.1.0",
    "@radix-ui/react-popover": "1.1.0",
    "@radix-ui/react-progress": "1.1.0",
    "@radix-ui/react-radio-group": "1.2.0",
    "@radix-ui/react-scroll-area": "1.2.0",
    "@radix-ui/react-select": "2.1.0",
    "@radix-ui/react-separator": "1.1.0",
    "@radix-ui/react-slider": "1.2.0",
    "@radix-ui/react-slot": "1.0.2",
    "@radix-ui/react-switch": "1.1.0",
    "@radix-ui/react-tabs": "1.1.0",
    "@radix-ui/react-toast": "1.2.0",
    "@radix-ui/react-tooltip": "1.1.0",
    "class-variance-authority": "0.7.0",
    "clsx": "2.1.0",
    "date-fns": "3.5.0",
    "firebase": "10.12.2",
    "firebase-admin": "12.1.1",
    "lucide-react": "0.395.0",
    "next": "14.2.4",
    "process": "^0.11.10",
    "react": "18.3.1",
    "react-day-picker": "8.10.0",
    "react-dom": "18.3.1",
    "recharts": "2.14.0",
    "tailwind-merge": "2.3.0",
    "tailwindcss-animate": "1.0.6",
    "zod": "3.24.0"
  },
  "devDependencies": {
    "@types/node": "20.12.5",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "postcss": "^8",
    "tailwindcss": "3.4.1",
    "typescript": "5.3.3"
  }
}
```

---

## src/ai/dev.ts
```ts
// Genkit configuration has been temporarily removed to stabilize the server.
```

---

## src/ai/genkit.ts
```ts
// Genkit configuration has been temporarily removed to stabilize the server.
```

---

## src/app/admin/competition-categories/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/app/users/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';
import { getGameFormats } from '@/app/game-formats/actions';
import type { CompetitionCategory, GameFormat } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Tag, PlusCircle, ListOrdered } from 'lucide-react';
import { CompetitionCategoryForm } from '@/components/competition-categories/CompetitionCategoryForm';
import { format } from 'date-fns';

export default function ManageCategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        if (!user) {
            throw new Error("Authentication required.");
        }
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId !== 'super_admin') {
        throw new Error('Access Denied. You must be a Super Admin to view this page.');
      }
      setIsSuperAdmin(true);

      const [fetchedCategories, fetchedGameFormats] = await Promise.all([
          getCompetitionCategories(),
          getGameFormats()
      ]);
      setCategories(fetchedCategories);
      setGameFormats(fetchedGameFormats);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin/competition-categories');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading category data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <Tag className="mr-3 h-10 w-10" /> Manage Competition Categories
        </h1>
        <p className="text-lg text-muted-foreground mt-1">View existing categories or create a new one.</p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            Below is a list of all competition categories in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Categories Found</h2>
                <p className="text-muted-foreground">Create one below to get started.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Default Format</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>
                        {gameFormats.find(f => f.id === cat.gameFormatId)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{cat.description || 'N/A'}</TableCell>
                      <TableCell>{cat.level || 'N/A'}</TableCell>
                      <TableCell>{cat.createdAt ? format(cat.createdAt, 'PPP') : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <PlusCircle className="mr-3 h-8 w-8 text-primary" />
            Create New Category
          </CardTitle>
          <CardDescription>Fill in the details to register a new category.</CardDescription>
        </CardHeader>
        <CardContent>
          <CompetitionCategoryForm onFormSubmit={fetchData} gameFormats={gameFormats} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/admin/game-formats/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/app/users/actions';
import { getGameFormats } from '@/app/game-formats/actions';
import type { GameFormat } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ListOrdered, PlusCircle } from 'lucide-react';
import { GameFormatForm } from '@/components/game-formats/GameFormatForm';

export default function ManageGameFormatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formats, setFormats] = useState<GameFormat[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        if (!user) throw new Error("Authentication required.");
        
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId !== 'super_admin') {
        throw new Error('Access Denied. You must be a Super Admin to view this page.');
      }
      setIsSuperAdmin(true);

      const fetchedFormats = await getGameFormats();
      setFormats(fetchedFormats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin/game-formats');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading game format data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <ListOrdered className="mr-3 h-10 w-10" /> Manage Game Formats
        </h1>
        <p className="text-lg text-muted-foreground mt-1">View existing formats or create a new one.</p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>All Game Formats</CardTitle>
          <CardDescription>Below is a list of all game formats in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {formats.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Formats Found</h2>
                <p className="text-muted-foreground">Create one below to get started.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Format Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Periods</TableHead>
                    <TableHead>Duration (min)</TableHead>
                    <TableHead>Timeouts</TableHead>
                    <TableHead>Min Play</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formats.map((format) => (
                    <TableRow key={format.id}>
                      <TableCell className="font-medium">{format.name}</TableCell>
                      <TableCell>{format.description || 'N/A'}</TableCell>
                      <TableCell>{format.numPeriods ?? 'N/A'}</TableCell>
                      <TableCell>{format.periodDurationMinutes ?? 'N/A'}</TableCell>
                      <TableCell>{format.defaultTotalTimeouts ?? 'N/A'}</TableCell>
                      <TableCell>{format.minPeriodsPlayerMustPlay ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <PlusCircle className="mr-3 h-8 w-8 text-primary" />
            Create New Game Format
          </CardTitle>
          <CardDescription>Fill in the details to register a new format.</CardDescription>
        </CardHeader>
        <CardContent>
          <GameFormatForm onFormSubmit={fetchData} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/admin/user-management/actions.ts
```ts
'use server';

import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { UserFirestoreProfile, UserProfileStatus } from '@/types';
import { revalidatePath } from 'next/cache';

// IMPORTANT: These actions now use the Admin SDK, bypassing Firestore rules.
// Access to the page invoking these actions must be strictly controlled.

export async function getAllUserProfiles(): Promise<UserFirestoreProfile[]> {
  console.log("AdminUserManagementActions: Attempting to fetch all user profiles from 'user_profiles' using Admin SDK.");

  if (!adminDb) {
    console.error("AdminUserManagementActions: Firebase Admin SDK is not initialized. Cannot fetch user profiles.");
    return [];
  }

  try {
    const usersCollectionRef = adminDb.collection('user_profiles');
    // Order by creation date, newest first. This may require an index in Firestore.
    const q = usersCollectionRef.orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("AdminUserManagementActions: No documents found in 'user_profiles' collection.");
      return [];
    }
    
    console.log(`AdminUserManagementActions: Found ${querySnapshot.docs.length} user profiles.`);
    
    const allProfiles = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Timestamps to serializable JS Date objects
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserFirestoreProfile;
    });
    
    console.log("AdminUserManagementActions: Successfully fetched all user profiles.");
    return allProfiles;
  } catch (error: any) {
    console.error('AdminUserManagementActions: Error fetching all user profiles with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("AdminUserManagementActions: Firestore query failed. This is likely due to a missing Firestore index. Please create an index on the 'createdAt' field (descending) for the 'user_profiles' collection in your Firebase console.");
    }
    return []; // Return empty array on error
  }
}

export async function updateUserProfileStatus(
  uid: string,
  status: UserProfileStatus
): Promise<{ success: boolean; error?: string }> {
  console.log(`AdminUserManagementActions: Attempting to update status for UID: ${uid} to '${status}'.`);
  if (!uid || !status) {
    return { success: false, error: 'UID and new status are required.' };
  }

  if (!adminDb) {
    console.error("AdminUserManagementActions: Firebase Admin SDK is not initialized. Cannot update user profile.");
    return { success: false, error: 'Server configuration error.' };
  }

  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    await userProfileRef.update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`AdminUserManagementActions: Successfully updated status for UID: ${uid} to '${status}'.`);
    revalidatePath('/admin/user-management'); // Revalidate the admin page to show updated data
    return { success: true };
  } catch (error: any) {
    console.error(`AdminUserManagementActions: Error updating status for UID ${uid}:`, error.message, error.stack);
    return { success: false, error: error.message || 'Failed to update user status.' };
  }
}
```

---

## src/app/admin/user-management/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getAllUserProfiles, updateUserProfileStatus } from './actions';
import { getUserProfileById } from '@/app/users/actions';
import { getApprovedClubs } from '@/app/clubs/actions';
import { getProfileTypeOptions } from '@/app/profile-types/actions';
import type { UserFirestoreProfile, UserProfileAdminView, Club, ProfileTypeOption, UserProfileStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Users, ShieldCheck, ShieldX, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UserManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(true);
  const [profiles, setProfiles] = useState<UserProfileAdminView[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [profileTypes, setProfileTypes] = useState<ProfileTypeOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPageData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      console.log("UserManagementPage: Fetching all required data (profiles, clubs, types)...");
      const [fetchedProfiles, fetchedClubs, fetchedProfileTypes] = await Promise.all([
        getAllUserProfiles(),
        getApprovedClubs(),
        getProfileTypeOptions(),
      ]);
      
      console.log(`UserManagementPage: Data fetched. Profiles: ${fetchedProfiles.length}, Clubs: ${fetchedClubs.length}, Types: ${fetchedProfileTypes.length}`);
      setProfiles(fetchedProfiles);
      setClubs(fetchedClubs);
      setProfileTypes(fetchedProfileTypes);

    } catch (err: any) {
      console.error("Error fetching user management data:", err);
      setError(err.message || "Failed to load data. Check Firestore rules and server logs for details.");
      toast({ variant: "destructive", title: "Data Load Error", description: err.message || "Could not load necessary data." });
    } finally {
      setLoadingData(false);
      console.log("UserManagementPage: Finished fetching data.");
    }
  };
  
  useEffect(() => {
    const checkPermissionsAndFetchData = async () => {
      if (!user) {
        router.replace('/login?redirect=/admin/user-management');
        return;
      }
      
      setIsVerifyingAdmin(true);
      setLoadingData(true);
      setError(null);

      try {
        console.log("UserManagementPage: Verifying admin status for user:", user.uid);
        const profile = await getUserProfileById(user.uid);
        console.log("UserManagementPage: Fetched profile:", profile);

        if (profile && profile.profileTypeId === 'super_admin') {
          console.log("UserManagementPage: User is Super Admin.");
          setIsAdmin(true);
          setIsVerifyingAdmin(false);
          await fetchPageData();
        } else {
          console.warn("UserManagementPage: Access denied. User is not a super_admin or profile not found.");
          setIsAdmin(false);
          setError("Access Denied. You must be a Super Admin to view this page.");
          setIsVerifyingAdmin(false);
          setLoadingData(false);
        }
      } catch (err: any) {
        console.error("UserManagementPage: Error verifying admin status:", err);
        setError("Could not verify admin status. Check console for details.");
        setIsAdmin(false);
        setIsVerifyingAdmin(false);
        setLoadingData(false);
      }
    };

    if (!authLoading) {
      checkPermissionsAndFetchData();
    }
  }, [user, authLoading, router]);


  const handleStatusUpdate = async (uid: string, newStatus: UserProfileStatus, displayName: string | null) => {
    const result = await updateUserProfileStatus(uid, newStatus);
    if (result.success) {
      toast({ title: "Status Updated", description: `User ${displayName || uid}'s status changed to ${newStatus}.` });
      fetchPageData(); // Refresh data
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: result.error });
    }
  };

  const displayProfiles = useMemo(() => {
    return profiles.map(profile => {
      const club = clubs.find(c => c.id === profile.clubId);
      const profileType = profileTypes.find(pt => pt.id === profile.profileTypeId);
      return {
        ...profile,
        clubName: club?.name || profile.clubId,
        profileTypeLabel: profileType?.label || profile.profileTypeId,
      };
    });
  }, [profiles, clubs, profileTypes]);


  if (authLoading || isVerifyingAdmin || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          {authLoading ? "Authenticating..." : isVerifyingAdmin ? "Verifying admin status..." : "Loading user data..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        {!isAdmin && error.startsWith("Access Denied") && (
             <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        )}
      </div>
    );
  }
  
  if (!isAdmin) {
      // This case should ideally be caught by the error state above, but as a fallback:
      return (
           <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Access Denied</h1>
                <p className="text-muted-foreground mb-4">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </div>
      )
  }

  const getStatusBadgeVariant = (status: UserProfileStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved': return 'default'; // Default is primary, which is often green-ish or blue
      case 'pending_approval': return 'secondary'; // Secondary for pending
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <Users className="mr-3 h-10 w-10" /> User Management
          </h1>
          <p className="text-lg text-muted-foreground mt-1">Approve or reject new user registrations.</p>
        </div>
        <Button onClick={fetchPageData} disabled={loadingData} variant="outline" className="mt-4 sm:mt-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
          Refresh List
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">User Registrations</CardTitle>
          <CardDescription>
            Review pending user profiles and manage their access.
            Firestore rules must be configured to allow SUPER_ADMIN to list users and update status.
            An index on 'user_profiles' by 'createdAt' (desc) might be required by Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayProfiles.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No User Profiles Found</h2>
                <p className="text-muted-foreground">There are no user profiles to display at this time, or you might not have permission to view them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Profile Type</TableHead>
                    <TableHead>Registered At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayProfiles.map((profile) => (
                    <TableRow key={profile.uid} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{profile.displayName || 'N/A'}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>{profile.clubName}</TableCell>
                      <TableCell>{profile.profileTypeLabel}</TableCell>
                      <TableCell>{profile.createdAt ? format(profile.createdAt, 'PPpp') : 'Invalid Date'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(profile.status)} className="capitalize">
                          {profile.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {profile.status === 'pending_approval' && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                                  <ShieldCheck className="mr-1 h-4 w-4" /> Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve User?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to approve user {profile.displayName || profile.email}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(profile.uid, 'approved', profile.displayName)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <ShieldX className="mr-1 h-4 w-4" /> Deny
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deny User Access?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to deny access for {profile.displayName || profile.email}? Their status will be set to 'rejected'.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(profile.uid, 'rejected', profile.displayName)}
                                    className="bg-destructive hover:bg-destructive/80"
                                  >
                                    Deny Access
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        {profile.status === 'approved' && (
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <ShieldX className="mr-1 h-4 w-4" /> Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Approved User?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to change status for {profile.displayName || profile.email} to 'rejected'?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(profile.uid, 'rejected', profile.displayName)}
                                     className="bg-destructive hover:bg-destructive/80"
                                  >
                                    Reject User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        )}
                         {profile.status === 'rejected' && (
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                                  <ShieldCheck className="mr-1 h-4 w-4" /> Re-Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Re-Approve User?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to change status for {profile.displayName || profile.email} to 'approved'?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(profile.uid, 'approved', profile.displayName)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Re-Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/api/auth/session-login/route.ts
```ts
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin'; // Import adminInitError
import { getUserProfileById } from '@/app/users/actions';

export async function POST(request: NextRequest) {
  // Add a defensive check right at the beginning
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error. Check server startup logs for details.'}`;
    console.warn(`API (session-login): CRITICAL WARNING - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    return NextResponse.json({ error: detailedError }, { status: 500 });
  }

  try {
    const { idToken } = await request.json();
    if (!idToken) {
      console.log("API (session-login): Request failed because ID token is missing.");
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }
    
    console.log(`API (session-login): Received ID token, verifying and checking profile status...`);

    // Verify the token to get the user's UID
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log(`API (session-login): ID token verified for UID: ${uid}.`);
    
    // Check the user's profile status in Firestore.
    const userProfile = await getUserProfileById(uid);

    // Only create a session if the user's profile is found and status is 'approved'
    if (userProfile && userProfile.status === 'approved') {
      console.log(`API (session-login): Profile status for UID ${uid} is 'approved'. Proceeding to create session cookie.`);
      
      // Set session expiration to 5 days.
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
      
      // Create the session cookie.
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      
      const options = {
        name: 'session',
        value: sessionCookie,
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: true, // Must be true for SameSite=None
        path: '/',
        sameSite: 'none' as const,
      };
      
      const response = NextResponse.json({ status: 'success', message: 'Session cookie created.' }, { status: 200 });
      response.cookies.set(options);
      
      console.log("API (session-login): Session cookie successfully created and set with SameSite=None.");
      return response;

    } else {
      // If user is not approved or has no profile, deny session creation.
      const reason = userProfile ? `status is '${userProfile.status}'` : 'profile not found';
      console.warn(`API (session-login): Session creation DENIED for UID: ${uid} because ${reason}.`);
      
      // Return a specific error that the client can use to show an informative message.
      return NextResponse.json({ 
          error: 'User account not active.',
          reason: userProfile?.status || 'not_found' // e.g., 'pending_approval', 'rejected'
      }, { status: 403 }); // 403 Forbidden is appropriate here.
    }

  } catch (error: any) {
    console.error('API (session-login): CRITICAL ERROR processing login. Full error object:', error);
    
    let errorMessage = 'Failed to create session.';
    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Firebase ID token has expired. Please re-authenticate.';
    } else if (error.code === 'auth/invalid-id-token') {
        errorMessage = 'Firebase ID token is invalid. Please re-authenticate.';
    } else if (error.message) {
        errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 401 });
  }
}
```

---

## src/app/api/auth/session-logout/route.ts
```ts
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin'; // Use admin SDK

export async function POST(request: NextRequest) {
  // Add a defensive check right at the beginning
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error. Check server startup logs for details.'}`;
    console.warn(`API (session-logout): CRITICAL WARNING - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    // Still attempt to clear the client-side cookie even if server auth is down
  }

  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie && adminAuth) { // Only attempt verification if adminAuth is available
      console.log("API (session-logout): Found session cookie, attempting to revoke tokens.");
      // Verify the session cookie. This is important to prevent CSRF attacks.
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */)
        .catch(error => {
          console.warn("API (session-logout): Error verifying session cookie during logout (possibly expired/revoked):", error.message);
          return null; // Treat as if cookie wasn't valid or present
        });

      if (decodedClaims) {
        await adminAuth.revokeRefreshTokens(decodedClaims.sub); // Revoke refresh tokens for the user
        console.log(`API (session-logout): Successfully revoked refresh tokens for UID: ${decodedClaims.sub}`);
      } else {
        console.log("API (session-logout): Could not decode session cookie, skipping token revocation.");
      }
    } else if (sessionCookie && !adminAuth) {
        console.warn("API (session-logout): Firebase Admin not initialized. Cannot revoke tokens. Proceeding to clear cookie.");
    } else {
        console.log("API (session-logout): No session cookie found to revoke.");
    }
    
    // Always clear the session cookie by setting its Max-Age to 0
    const response = NextResponse.json({ status: 'success', message: 'Session cookie cleared.' }, { status: 200 });
    response.cookies.set({
      name: 'session',
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: true, // Must be true for SameSite=None
      path: '/',
      sameSite: 'none',
    });

    console.log("API (session-logout): Session cookie successfully cleared from response with SameSite=None.");
    return response;

  } catch (error: any)
{
    console.error('API (session-logout): Error during logout process:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to clear session.', details: error.message }, { status: 500 });
  }
}
```

---

## src/app/api/auth/verify-session/route.ts
```ts
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin';
import { getUserProfileById } from '@/app/users/actions';

export async function POST(request: NextRequest) {
  // Add a defensive check right at the beginning
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error. Check server startup logs for details.'}`;
    console.warn(`API (verify-session): CRITICAL WARNING - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    return NextResponse.json({ isAuthenticated: false, error: detailedError }, { status: 500 });
  }

  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    console.log("API (verify-session): Request received, but 'session' cookie was not found.");
    return NextResponse.json({ isAuthenticated: false, error: 'Session cookie not found.' }, { status: 401 });
  }
  console.log("API (verify-session): Request received with a 'session' cookie. Attempting to verify...");

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /* checkRevoked */);
    console.log(`API (verify-session): Cookie verification SUCCESS for UID: ${decodedClaims.uid}. Now checking profile status...`);

    // --- NEW LOGIC: Check Firestore profile status ---
    const userProfile = await getUserProfileById(decodedClaims.uid);

    if (userProfile && userProfile.status === 'approved') {
      console.log(`API (verify-session): Profile status is 'approved' for UID: ${decodedClaims.uid}. Authentication successful.`);
      return NextResponse.json({ isAuthenticated: true, uid: decodedClaims.uid, email: decodedClaims.email }, { status: 200 });
    } else {
      const reason = userProfile ? `status is '${userProfile.status}'` : 'profile not found';
      console.warn(`API (verify-session): Authentication FAILED for UID: ${decodedClaims.uid} because ${reason}.`);
      // User is not approved or doesn't have a profile. Send back a structured error.
      return NextResponse.json({ 
          isAuthenticated: false, 
          error: 'User account not active.', 
          reason: userProfile?.status || 'not_found' // e.g., 'pending_approval', 'rejected'
        }, { status: 403 }); // 403 Forbidden is appropriate for a valid user who lacks rights
    }

  } catch (error: any) {
    console.warn(`API (verify-session): Cookie verification FAILED. Error Code: ${error.code}. Message: ${error.message}`);
    // This catches invalid/expired cookies.
    return NextResponse.json({ 
        isAuthenticated: false, 
        error: 'Invalid session cookie.', 
        reason: 'invalid_cookie',
        details: `Code: ${error.code}, Message: ${error.message}` 
    }, { status: 401 });
  }
}
```

---

## src/app/bcsjd-api-data/page.tsx
```tsx
"use client"; // This page needs to be a client component for useEffect and useState

import React, { useEffect, useState } from 'react';
import { getBcsjdKeyMetrics } from '@/lib/bcsjdApi';
import type { BcsjdApiDataItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, AlertTriangle, Loader2, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {format} from 'date-fns';

export default function BcsjdApiDataPage() {
  const [data, setData] = useState<BcsjdApiDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbiddenError, setIsForbiddenError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsForbiddenError(false);
    try {
      const apiData = await getBcsjdKeyMetrics();
      setData(apiData);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch data from BCSJD API.";
      setError(errorMessage);
      if (errorMessage.includes('403') || errorMessage.toLowerCase().includes('forbidden')) {
        setIsForbiddenError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading BCSJD API Data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg p-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-destructive">Error Fetching Data</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          {isForbiddenError && (
            <div className="mt-4 mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-sm text-left">
              <div className="flex">
                <div className="py-1"><HelpCircle className="h-5 w-5 text-yellow-500 mr-3" /></div>
                <div>
                  A <strong>403 Forbidden</strong> error means the server is refusing access.
                  Common reasons for this when accessing the BCSJD API include:
                  <ul className="list-disc list-inside mt-2">
                    <li>The API Key (<code>NEXT_PUBLIC_BCSJD_API_KEY</code>) might be incorrect, missing, or not authorized for this action.</li>
                    <li>The BCSJD API server might have IP restrictions or other security measures in place.</li>
                  </ul>
                  <p className="mt-2">Please check your <code>.env.local</code> file for the API key and consult the BCSJD API documentation or administrator.</p>
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-4">
            Tip: Open your browser's Developer Tools (F12), go to the "Network" tab, and refresh. Look for failed requests (often red) to see more details about the error and the specific URL that failed.
          </p>
          <Button onClick={fetchData} variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      );
    }
    
    if (data.length === 0) {
        return (
             <div className="text-center py-10 border-2 border-dashed rounded-lg p-6">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Data Available</h2>
                <p className="text-muted-foreground mb-4">Could not retrieve any data from the BCSJD API at this time.</p>
                <Button onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
                </Button>
            </div>
        );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric Name</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.value.toString()}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{format(new Date(item.lastUpdated), 'PPpp')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <BarChart3 className="mr-3 h-10 w-10" /> BCSJD API Data
          </h1>
          <p className="text-lg text-muted-foreground mt-1">Live data from the external BCSJD system.</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" className="mt-4 sm:mt-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Key Metrics Overview</CardTitle>
          <CardDescription>
            Displaying important information retrieved directly from the BCSJD API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/clubs/[clubId]/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Actions
import { getUserProfileById } from '@/app/users/actions';
import { getClubById } from '@/app/clubs/actions'; // Assuming this will be created
import { getTeamsByClubId } from '@/app/teams/actions';

// Types
import type { Club, Team, UserFirestoreProfile } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, ChevronLeft, Building, Users, PlusCircle, Shield, Settings } from 'lucide-react';

export default function ClubManagementPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const clubId = typeof params.clubId === 'string' ? params.clubId : '';

    const [club, setClub] = useState<Club | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
    const [hasPermission, setHasPermission] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPageData = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            if (!clubId) {
                throw new Error("Club ID is missing from the URL.");
            }
            
            const profile = await getUserProfileById(userId);
            setUserProfile(profile);

            const isSuperAdmin = profile?.profileTypeId === 'super_admin';
            const isClubAdmin = profile?.profileTypeId === 'club_admin' && profile.clubId === clubId;

            if (!isSuperAdmin && !isClubAdmin) {
                throw new Error("Access Denied. You do not have permission to manage this club.");
            }
            setHasPermission(true);

            // Fetch club and team data in parallel
            const [clubData, teamsData] = await Promise.all([
                getClubById(clubId),
                getTeamsByClubId(clubId)
            ]);

            if (!clubData) {
                throw new Error("Club not found.");
            }
            
            setClub(clubData);
            setTeams(teamsData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clubId]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/clubs/${clubId}`);
            return;
        }
        loadPageData(user.uid);
    }, [clubId, user, authLoading, router, loadPageData]);
    
    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading club details...</p>
            </div>
        );
    }
    
    if (error || !hasPermission) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error || "An unknown error occurred."}</p>
                 <Button asChild variant="outline">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    if (!club) {
        return null; // Should be covered by error state
    }

    return (
        <div className="space-y-8">
            <Button variant="outline" size="sm" asChild>
                <Link href="/clubs">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to All Clubs
                </Link>
            </Button>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline font-bold text-primary flex items-center">
                       <Building className="mr-4 h-10 w-10"/> {club.name}
                    </CardTitle>
                    <CardDescription className="text-lg">
                       {club.city_name}, {club.province_name}
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6"/>Club Teams</CardTitle>
                        <CardDescription>
                            Manage the teams associated with this club.
                        </CardDescription>
                    </div>
                     <Button asChild>
                        <Link href={`/clubs/${clubId}/teams/new`}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New Team
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {teams.length === 0 ? (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No Teams Found</h2>
                            <p className="text-muted-foreground">This club doesn't have any teams yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Team Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teams.map(team => (
                                    <TableRow key={team.id}>
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell>{team.competitionCategoryId || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                             <Button asChild size="sm" variant="outline">
                                                <Link href={`/clubs/${clubId}/teams/${team.id}`}>
                                                   <Settings className="mr-2 h-4 w-4" /> Manage Team
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
```

---

## src/app/clubs/[clubId]/teams/[teamId]/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Actions
import { getUserProfileById } from '@/app/users/actions';
import { getTeamById } from '@/app/teams/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import { getClubById } from '@/app/clubs/actions';

// Types
import type { Club, Team, UserFirestoreProfile, Player } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, ChevronLeft, Users, PlusCircle, UserPlus, Home } from 'lucide-react';
import { PlayerForm } from '@/components/players/PlayerForm';
import { useToast } from '@/hooks/use-toast';

export default function TeamManagementPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const clubId = typeof params.clubId === 'string' ? params.clubId : '';
    const teamId = typeof params.teamId === 'string' ? params.teamId : '';

    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
    const [hasPermission, setHasPermission] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPageData = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            if (!clubId || !teamId) {
                throw new Error("Club or Team ID is missing from the URL.");
            }
            
            const profile = await getUserProfileById(userId);
            setUserProfile(profile);

            // Fetch team first to check its clubId
            const teamData = await getTeamById(teamId);
            if (!teamData) {
                throw new Error("Team not found.");
            }
            if (teamData.clubId !== clubId) {
                throw new Error("Team does not belong to this club.");
            }
            setTeam(teamData);

            const isSuperAdmin = profile?.profileTypeId === 'super_admin';
            const isClubAdmin = profile?.profileTypeId === 'club_admin' && profile.clubId === clubId;
            const isCoach = profile?.profileTypeId === 'coach' && teamData.coachIds?.includes(userId);

            if (!isSuperAdmin && !isClubAdmin && !isCoach) {
                throw new Error("Access Denied. You do not have permission to manage this team.");
            }
            setHasPermission(true);
            
            const playersData = await getPlayersByTeamId(teamId);
            setPlayers(playersData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clubId, teamId]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/clubs/${clubId}/teams/${teamId}`);
            return;
        }
        loadPageData(user.uid);
    }, [clubId, teamId, user, authLoading, router, loadPageData]);
    
    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading team details...</p>
            </div>
        );
    }
    
    if (error || !hasPermission) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error || "An unknown error occurred."}</p>
                 <Button asChild variant="outline">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    if (!team) return null;

    return (
        <div className="space-y-8">
            <nav className="flex items-center text-sm text-muted-foreground">
                <Link href={`/clubs/${clubId}`} className="hover:text-primary flex items-center"><Home className="mr-1 h-4 w-4"/>Club Home</Link>
                <span className="mx-2">/</span>
                <span>Team: {team.name}</span>
            </nav>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline font-bold text-primary">
                       Team: {team.name}
                    </CardTitle>
                    <CardDescription className="text-lg">
                       Manage players for this team.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6"/>Player Roster</CardTitle>
                    <CardDescription>
                        List of all players registered to this team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {players.length === 0 ? (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No Players Found</h2>
                            <p className="text-muted-foreground">This team doesn't have any players yet. Add one below.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>First Name</TableHead>
                                    <TableHead>Last Name</TableHead>
                                    <TableHead>Jersey #</TableHead>
                                    <TableHead>Position</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {players.map(player => (
                                    <TableRow key={player.id}>
                                        <TableCell className="font-medium">{player.firstName}</TableCell>
                                        <TableCell>{player.lastName}</TableCell>
                                        <TableCell>{player.jerseyNumber || 'N/A'}</TableCell>
                                        <TableCell>{player.position || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><UserPlus className="mr-3 h-6 w-6"/>Add New Player</CardTitle>
                    <CardDescription>
                        Fill in the details to add a new player to the roster.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PlayerForm 
                        teamId={teamId} 
                        clubId={clubId} 
                        onFormSubmit={() => loadPageData(user!.uid)} 
                    />
                </CardContent>
            </Card>
        </div>
    );
}
```

---

## src/app/clubs/[clubId]/teams/new/page.tsx
```tsx
"use client";

import { TeamForm } from "@/components/teams/TeamForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2, AlertTriangle, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import type { GameFormat, CompetitionCategory, UserFirestoreProfile, Club } from "@/types";
import { getGameFormats } from "@/app/game-formats/actions";
import { getCompetitionCategories } from "@/app/competition-categories/actions";
import { getUserProfileById } from "@/app/users/actions";
import { getClubById } from "@/app/clubs/actions";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewTeamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clubId = typeof params.clubId === 'string' ? params.clubId : '';

  const [club, setClub] = useState<Club | null>(null);
  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
  const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=/clubs/${clubId}/teams/new`);
      return;
    }

    const loadPageData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const [profile, fetchedClub, formats, categories] = await Promise.all([
          getUserProfileById(user.uid),
          getClubById(clubId),
          getGameFormats(),
          getCompetitionCategories()
        ]);
        
        const isSuperAdmin = profile?.profileTypeId === 'super_admin';
        const isClubAdmin = profile?.profileTypeId === 'club_admin' && profile.clubId === clubId;

        if (!isSuperAdmin && !isClubAdmin) {
            setError("Access Denied. You must be an admin for this club to create teams.");
            return;
        }

        if (!fetchedClub) {
          setError("The parent club could not be found.");
          return;
        }

        setUserProfile(profile);
        setClub(fetchedClub);
        setGameFormats(formats);
        setCompetitionCategories(categories);

      } catch (err: any) {
        setError("Failed to load data required for team creation.");
      } finally {
        setLoadingData(false);
      }
    };
    loadPageData();
  }, [user, authLoading, router, clubId]);
  
  if (authLoading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading team creator...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push(`/clubs/${clubId}`)} className="mt-4">Back to Club</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href={`/clubs/${clubId}`}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Club Management
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Create New Team for {club?.name}
          </CardTitle>
          <CardDescription>Fill in the details below to register a new team under this club.</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamForm 
            clubId={clubId} 
            gameFormats={gameFormats}
            competitionCategories={competitionCategories}
            onFormSubmit={() => {
                router.push(`/clubs/${clubId}`);
                router.refresh();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/clubs/actions.ts
```ts
'use server';

import type { Club, ClubFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// This function will be used by the registration form to populate the clubs dropdown.
// It fetches all clubs to ensure new users can register.
export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch all clubs from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("ClubActions (getApprovedClubs): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const clubsCollectionRef = adminDb.collection('clubs');
    // Query for all clubs and order them alphabetically by name
    const q = clubsCollectionRef.orderBy('name', 'asc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("ClubActions: No clubs found in 'clubs' collection. An index on 'name' (asc) may be required.");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} clubs.`);
    
    const allClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Club (ID: ${doc.id})`,
        shortName: data.shortName,
        province_name: data.province_name,
        city_name: data.city_name,
        logoUrl: data.logoUrl,
        approved: data.approved,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
      } as Club; 
    });
    
    console.log("ClubActions: Successfully fetched and sorted all clubs using Admin SDK.");
    return allClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching clubs with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("ClubActions: Firestore query failed. This is likely due to a missing Firestore index. Please create an index on the 'name' field (ascending) for the 'clubs' collection.");
    }
    return []; // Return empty array on error
  }
}

// Action to create a new club (likely for an admin)
export async function createClub(
  formData: ClubFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  // In a real app, you would also check if the user has permission (e.g., is a super_admin)
  if (!adminDb) {
    return { success: false, error: 'Firebase Admin SDK not initialized.' };
  }
  try {
    const newClubData = {
      ...formData,
      approved: false, // New clubs should require approval
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('clubs').add(newClubData);
    revalidatePath('/clubs'); // Revalidate admin clubs page if it exists
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating club:', error);
    return { success: false, error: error.message || 'Failed to create club.' };
  }
}

// New action to update club approval status
export async function updateClubStatus(
  clubId: string,
  approved: boolean
): Promise<{ success: boolean; error?: string }> {
  console.log(`ClubActions: Attempting to update approved status for club ID: ${clubId} to '${approved}'.`);
  if (!clubId) {
    return { success: false, error: 'Club ID is required.' };
  }

  if (!adminDb) {
    console.error("ClubActions: Firebase Admin SDK is not initialized.");
    return { success: false, error: 'Server configuration error.' };
  }

  try {
    const clubRef = adminDb.collection('clubs').doc(clubId);
    await clubRef.update({
      approved: approved
    });
    console.log(`ClubActions: Successfully updated approved status for club ID: ${clubId} to '${approved}'.`);
    revalidatePath('/clubs'); // Revalidate the admin page
    revalidatePath(`/clubs/${clubId}`); // Revalidate the detail page
    return { success: true };
  } catch (error: any) {
    console.error(`ClubActions: Error updating status for club ID ${clubId}:`, error.message, error.stack);
    return { success: false, error: error.message || 'Failed to update club status.' };
  }
}

export async function getClubById(clubId: string): Promise<Club | null> {
    if (!adminDb) {
      console.error("ClubActions (getClubById): Admin SDK not initialized.");
      return null;
    }
    if (!clubId) {
      return null;
    }
    try {
        const clubDocRef = adminDb.collection('clubs').doc(clubId);
        const docSnap = await clubDocRef.get();

        if (!docSnap.exists) {
            console.warn(`ClubActions: No club found with ID: ${clubId}`);
            return null;
        }

        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            name: data.name || `Unnamed Club (ID: ${docSnap.id})`,
            shortName: data.shortName,
            province_name: data.province_name,
            city_name: data.city_name,
            logoUrl: data.logoUrl,
            approved: data.approved,
            createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
        } as Club;

    } catch (error: any) {
        console.error(`ClubActions: Error fetching club by ID ${clubId}:`, error.message, error.stack);
        return null;
    }
}
```

---

## src/app/clubs/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfileById } from '@/app/users/actions';
import { getApprovedClubs, updateClubStatus } from '@/app/clubs/actions';
import type { Club } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Building, PlusCircle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { ClubForm } from '@/components/clubs/ClubForm';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ManageClubsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        throw new Error("Authentication required.");
      }
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId !== 'super_admin') {
        throw new Error('Access Denied. You must be a Super Admin to view this page.');
      }
      setIsSuperAdmin(true);

      const fetchedClubs = await getApprovedClubs(); // This now fetches all clubs
      setClubs(fetchedClubs);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/clubs');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  const handleStatusUpdate = async (clubId: string, clubName: string, newStatus: boolean) => {
    const result = await updateClubStatus(clubId, newStatus);
    if (result.success) {
      toast({ title: "Status Updated", description: `Club ${clubName} has been ${newStatus ? 'approved' : 'un-approved'}.` });
      fetchData(); // Refresh data
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: result.error });
    }
  };

  const getStatusBadgeVariant = (approved?: boolean): "default" | "destructive" | "secondary" => {
    if (approved === true) return 'default';
    if (approved === false) return 'destructive';
    return 'secondary'; // for undefined/null status
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading club data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <Building className="mr-3 h-10 w-10" /> Manage Clubs
        </h1>
        <p className="text-lg text-muted-foreground mt-1">View, approve, or create new clubs.</p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>All Clubs</CardTitle>
          <CardDescription>
            Below is a list of all clubs in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clubs.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">No Clubs Found</h2>
              <p className="text-muted-foreground">Create one below to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Club Name</TableHead>
                        <TableHead>Short Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {clubs.map((club) => (
                        <TableRow key={club.id}>
                        <TableCell className="font-medium">{club.name}</TableCell>
                        <TableCell>{club.shortName || 'N/A'}</TableCell>
                        <TableCell>{club.city_name || 'N/A'}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusBadgeVariant(club.approved)}>
                                {club.approved === true ? 'Approved' : club.approved === false ? 'Pending/Rejected' : 'Unknown'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                             <Button asChild variant="outline" size="sm">
                                <Link href={`/clubs/${club.id}`}>
                                  <Settings className="mr-1 h-4 w-4" /> Manage
                                </Link>
                              </Button>
                             {club.approved !== true && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                                      <CheckCircle className="mr-1 h-4 w-4" /> Approve
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Approve Club?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to approve club {club.name}?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleStatusUpdate(club.id, club.name, true)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Approve
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            )}
                             {club.approved === true && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <XCircle className="mr-1 h-4 w-4" /> Un-Approve
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Revoke Approval?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to revoke approval for {club.name}? Users may not be able to register for this club.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleStatusUpdate(club.id, club.name, false)}
                                        className="bg-destructive hover:bg-destructive/80"
                                      >
                                        Revoke
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <PlusCircle className="mr-3 h-8 w-8 text-primary" />
            Create New Club
          </CardTitle>
          <CardDescription>Fill in the details to register a new club. It will require approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClubForm onFormSubmit={fetchData} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/competition-categories/actions.ts
```ts
'use server';

import type { CompetitionCategory } from '@/types';
import { adminDb } from '@/lib/firebase/admin';

export async function getCompetitionCategories(): Promise<CompetitionCategory[]> {
  console.log("CompetitionCategoryActions: Attempting to fetch competition categories from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("CompetitionCategoryActions (getCompetitionCategories): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const categoriesCollectionRef = adminDb.collection('competitionCategories');
    const querySnapshot = await categoriesCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("CompetitionCategoryActions: No documents found in 'competitionCategories' collection.");
      return [];
    }
    
    console.log(`CompetitionCategoryActions: Found ${querySnapshot.docs.length} documents in 'competitionCategories' collection.`);
    
    const allCategories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Category (ID: ${doc.id})`,
        description: data.description,
        level: data.level,
        gameFormatId: data.gameFormatId,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
      } as CompetitionCategory; 
    });
    
    // Sort the results alphabetically by name here in the action
    allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log("CompetitionCategoryActions: Successfully fetched and sorted categories using Admin SDK.");
    return allCategories;
  } catch (error: any) {
    console.error('CompetitionCategoryActions: Error fetching competition categories with Admin SDK:', error.message, error.stack);
    return []; // Return empty array on error
  }
}
```

---

## src/app/dashboard/page.tsx
```tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Building, CheckSquare, Users, AlertTriangle, PlusCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile } from '@/types';
import { useRouter } from 'next/navigation';

// Dummy data - replace with actual data fetching
const summaryData = {
  activeProjects: 5,
  completedTasks: 120,
  teamMembers: 15,
  alerts: 2,
};

// Placeholder for API data state
interface ApiData {
  keyMetric: string;
  value: number | string;
}
const bcsjdApiSampleData: ApiData[] = [
  { keyMetric: "Overall Progress", value: "75%" },
  { keyMetric: "Budget Utilization", value: "60%" },
];


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    // The middleware is now responsible for ensuring only authenticated users reach this page.
    // So, we expect the `user` object to be available shortly after `authLoading` is false.
    if (user) {
      console.log(`Dashboard: User authenticated. Fetching profile for UID: ${user.uid}`);
      setLoadingProfile(true);
      setProfileError(null);
      getUserProfileById(user.uid)
        .then(profile => {
          if (profile) {
            console.log("Dashboard: Successfully fetched profile data:", profile);
            setUserProfile(profile);
          } else {
            console.error("Dashboard: getUserProfileById returned null. This means no profile document was found for the UID in 'user_profiles' collection or there was a permission issue.");
            setProfileError("Your user profile could not be found in the database. This might be a permission issue. Please contact an administrator.");
            setUserProfile(null);
          }
        })
        .catch(err => {
          console.error("Dashboard: An error occurred while fetching user profile:", err);
          setProfileError("An error occurred while loading your profile. Please try again later.");
          setUserProfile(null);
        })
        .finally(() => {
          console.log("Dashboard: Finished fetching profile.");
          setLoadingProfile(false);
        });
    } else if (!authLoading && !user) {
      // This is a failsafe. If for any reason an unauthenticated user gets here
      // (e.g., session expires while on page), redirect them.
      console.warn("Dashboard: Failsafe triggered. Unauthenticated user detected. Redirecting to login.");
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // A single, reliable loading state. Middleware ensures we don't need an "unauthenticated" UI here.
  // We wait for auth to be confirmed (`!authLoading && user`) before proceeding to render the dashboard.
  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-headline font-semibold">Verifying Session...</h1>
        <p className="text-muted-foreground">Please wait.</p>
      </div>
    );
  }

  const renderClubManagement = () => {
    if (loadingProfile) {
      return (
        <div className="flex items-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>Loading user information...</span>
        </div>
      );
    }

    if (profileError) {
      return (
        <div className="flex items-center text-destructive p-4 bg-destructive/10 rounded-md">
          <AlertTriangle className="mr-3 h-5 w-5 flex-shrink-0" />
          <span>{profileError}</span>
        </div>
      );
    }
    
    if (userProfile?.profileTypeId === 'super_admin') {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            As a Super Admin, you have full control over clubs and teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild>
              <Link href={`/clubs/new`}>
                <PlusCircle className="mr-2 h-5 w-5" /> Create New Club
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/clubs`}>
                <Building className="mr-2 h-5 w-5" /> Manage Clubs
              </Link>
            </Button>
          </div>
        </>
      );
    }
    
    if (userProfile?.clubId) {
       return (
        <>
          <p className="text-sm text-muted-foreground">
            You are associated with club <code className="font-mono bg-muted px-1 py-0.5 rounded">{userProfile.clubId}</code>.
            You can create a new team for your club now.
          </p>
          <Button asChild>
            <Link href={`/clubs/${userProfile.clubId}/teams/new`}>
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Team
            </Link>
          </Button>
        </>
      );
    }

    // Fallback for non-super-admin users without a clubId, or if profile is somehow empty but not errored.
    return (
      <div className="flex items-center text-muted-foreground">
        <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
        <span>Your profile is not associated with a club. Team creation is disabled.</span>
      </div>
    );
  };
  
  // From here on, we can safely assume `user` exists.
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card rounded-lg shadow-lg">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Welcome, {user.displayName || user.email}!</h1>
          <p className="text-lg text-muted-foreground mt-1">Here&apos;s a summary of your BCSJD workspace.</p>
        </div>
        <Image 
          src="https://placehold.co/150x150.png" 
          alt="User avatar or decorative image" 
          width={100} 
          height={100} 
          className="rounded-full shadow-md hidden sm:block"
          data-ai-hint="professional avatar"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.activeProjects}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.completedTasks}</div>
            <p className="text-xs text-muted-foreground">+15 this week</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.teamMembers}</div>
            <p className="text-xs text-muted-foreground">All active</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts (Sample)</CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summaryData.alerts}</div>
            <p className="text-xs text-muted-foreground">This is a sample card</p>
          </CardContent>
        </Card>
      </div>

      {/* Club & Team Management Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            Club & Team Management
          </CardTitle>
          <CardDescription>Manage your club details and create new teams.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderClubManagement()}
        </CardContent>
      </Card>

      {/* BCSJD API Data Section (Placeholder) */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <BarChart className="mr-3 h-6 w-6 text-accent" />
            BCSJD API Overview
          </CardTitle>
          <CardDescription>Key metrics from the integrated BCSJD API.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {bcsjdApiSampleData.map((item) => (
            <div key={item.keyMetric} className="p-4 border rounded-md bg-secondary/30">
              <h3 className="text-sm font-medium text-muted-foreground">{item.keyMetric}</h3>
              <p className="text-2xl font-bold text-primary">{item.value}</p>
            </div>
          ))}
           <div className="p-4 border rounded-md bg-secondary/30 flex items-center justify-center">
             <Image 
                src="https://placehold.co/300x150.png" 
                alt="Chart Placeholder" 
                width={300} 
                height={150} 
                className="rounded shadow"
                data-ai-hint="data chart"
              />
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/game-formats/actions.ts
```ts
'use server';

import type { GameFormat } from '@/types';
import { adminDb } from '@/lib/firebase/admin';

export async function getGameFormats(): Promise<GameFormat[]> {
  console.log("GameFormatActions: Attempting to fetch game formats from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("GameFormatActions (getGameFormats): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const gameFormatsCollectionRef = adminDb.collection('gameFormats');
    const querySnapshot = await gameFormatsCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("GameFormatActions: No documents found in 'gameFormats' collection.");
      return [];
    }
    
    console.log(`GameFormatActions: Found ${querySnapshot.docs.length} documents in 'gameFormats' collection.`);
    
    const allGameFormats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Format (ID: ${doc.id})`,
        description: data.description,
        numPeriods: data.numPeriods,
        periodDurationMinutes: data.periodDurationMinutes,
        defaultTotalTimeouts: data.defaultTotalTimeouts,
        minPeriodsPlayerMustPlay: data.minPeriodsPlayerMustPlay,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
      } as GameFormat; 
    });
    
    // Sort the results alphabetically by name here in the action
    allGameFormats.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log("GameFormatActions: Successfully fetched and sorted game formats using Admin SDK.");
    return allGameFormats;
  } catch (error: any) {
    console.error('GameFormatActions: Error fetching game formats with Admin SDK:', error.message, error.stack);
    return []; // Return empty array on error
  }
}
```

---

## src/app/games/[gameId]/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Actions
import { getGameById, updateGameRoster } from '@/app/games/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import { getTeamsByCoach } from '@/app/teams/actions';

// Types
import type { Game, Player, Team } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, ChevronLeft, Users, Save, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ManageGamePage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';

    const [game, setGame] = useState<Game | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [managedTeam, setManagedTeam] = useState<Team | null>(null);
    const [isHomeTeam, setIsHomeTeam] = useState(false);
    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
    
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPageData = useCallback(async (userId: string) => {
        setLoadingData(true);
        setError(null);
        try {
            if (!gameId) {
                setError("Game ID is missing from the URL.");
                return;
            }
            
            const [gameData, coachTeams] = await Promise.all([
                getGameById(gameId),
                getTeamsByCoach(userId),
            ]);

            if (!gameData) {
                setError("Game not found.");
                setLoadingData(false);
                return;
            }
            setGame(gameData);

            const homeTeamIsManaged = coachTeams.some(t => t.id === gameData.homeTeamId);
            const awayTeamIsManaged = coachTeams.some(t => t.id === gameData.awayTeamId);

            let teamToManageId: string | null = null;
            let isHome = false;

            if (homeTeamIsManaged) {
                teamToManageId = gameData.homeTeamId;
                isHome = true;
            } else if (awayTeamIsManaged) {
                teamToManageId = gameData.awayTeamId;
                isHome = false;
            }
            
            setIsHomeTeam(isHome);

            if (!teamToManageId) {
                setError("You are not the coach for either team in this game.");
                setLoadingData(false);
                return;
            }
            
            const teamToManage = coachTeams.find(t => t.id === teamToManageId)!;
            setManagedTeam(teamToManage);
            
            const teamPlayers = await getPlayersByTeamId(teamToManageId);
            setPlayers(teamPlayers);
            
            const initialSelected = isHome ? gameData.homeTeamPlayerIds : gameData.awayTeamPlayerIds;
            setSelectedPlayers(new Set(initialSelected || []));

        } catch (err: any) {
            setError(err.message || "Failed to load game data.");
        } finally {
            setLoadingData(false);
        }
    }, [gameId]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/games/${gameId}`);
            return;
        }
        loadPageData(user.uid);
    }, [gameId, user, authLoading, router, loadPageData]);
    
    const handlePlayerSelection = (playerId: string) => {
        setSelectedPlayers(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(playerId)) {
                newSelection.delete(playerId);
            } else {
                newSelection.add(playerId);
            }
            return newSelection;
        });
    };

    const handleSaveRoster = async () => {
        if (!game || !managedTeam) return;
        setSaving(true);
        const result = await updateGameRoster(game.id, Array.from(selectedPlayers), isHomeTeam);
        if (result.success) {
            toast({ title: "Roster Saved", description: "The player roster has been updated for this game." });
        } else {
            toast({ variant: "destructive", title: "Save Failed", description: result.error });
        }
        setSaving(false);
    };

    if (authLoading || loadingData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading game data...</p>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button asChild variant="outline">
                    <Link href="/games">Back to Games List</Link>
                </Button>
            </div>
        );
    }

    if (!game) {
        return null; // Should be covered by error state
    }

    return (
        <div className="space-y-8">
            <Button variant="outline" size="sm" asChild>
                <Link href="/games">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Games List
                </Link>
            </Button>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline font-bold text-primary">
                       {game.homeTeamName} vs {game.awayTeamName}
                    </CardTitle>
                    <CardDescription className="text-lg">
                       {format(game.date, 'PPPP p')} at {game.location}
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center"><ShieldCheck className="mr-3 h-6 w-6"/>Game Roster for {managedTeam?.name}</CardTitle>
                    <CardDescription>
                        Select the players who will be participating in this game.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {players.length === 0 ? (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No Players on Roster</h2>
                            <p className="text-muted-foreground">This team doesn't have any players yet. You can add players on the team management page.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {players.map(player => (
                                    <div key={player.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                                        <Checkbox 
                                            id={`player-${player.id}`}
                                            checked={selectedPlayers.has(player.id)}
                                            onCheckedChange={() => handlePlayerSelection(player.id)}
                                        />
                                        <Label htmlFor={`player-${player.id}`} className="cursor-pointer">
                                            {player.firstName} {player.lastName} (#{player.jerseyNumber || 'N/A'})
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleSaveRoster} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {saving ? 'Saving...' : 'Save Roster'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
```

---

## src/app/games/actions.ts
```ts
'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team } from '@/types';
import { getTeamsByCoach as getCoachTeams } from '@/app/teams/actions';

// Action to create a new game
export async function createGame(formData: GameFormData, userId: string): Promise<{ success: boolean; error?: string; id?: string }> {
    if (!userId) return { success: false, error: "User not authenticated." };
    if (!adminDb) return { success: false, error: "Database not initialized."};

    try {
        const [homeTeamSnap, awayTeamSnap] = await Promise.all([
            adminDb.collection('teams').doc(formData.homeTeamId).get(),
            adminDb.collection('teams').doc(formData.awayTeamId).get()
        ]);

        if (!homeTeamSnap.exists || !awayTeamSnap.exists) {
            return { success: false, error: "One or both teams could not be found." };
        }
        const homeTeamData = homeTeamSnap.data() as Team;
        const awayTeamData = awayTeamSnap.data() as Team;

        const gameDateTime = new Date(`${formData.date}T${formData.time}`);
        
        const newGameData = {
            homeTeamId: formData.homeTeamId,
            awayTeamId: formData.awayTeamId,
            homeTeamName: homeTeamData.name,
            awayTeamName: awayTeamData.name,
            date: admin.firestore.Timestamp.fromDate(gameDateTime),
            location: formData.location,
            status: 'scheduled',
            seasonId: formData.seasonId,
            competitionCategoryId: formData.competitionCategoryId,
            gameFormatId: formData.gameFormatId || null,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('games').add(newGameData);
        revalidatePath('/games');
        return { success: true, id: docRef.id };

    } catch (error: any) {
        console.error('Error creating game:', error);
        return { success: false, error: error.message || "Failed to create game."};
    }
}

// Action to get games for a specific team
export async function getGamesByTeam(teamId: string): Promise<Game[]> {
    if (!adminDb) return [];
    try {
        const gamesRef = adminDb.collection('games');
        const homeGamesQuery = gamesRef.where('homeTeamId', '==', teamId).get();
        const awayGamesQuery = gamesRef.where('awayTeamId', '==', teamId).get();

        const [homeGamesSnap, awayGamesSnap] = await Promise.all([homeGamesQuery, awayGamesQuery]);
        
        const games: Game[] = [];
        homeGamesSnap.forEach(doc => games.push({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() } as Game));
        awayGamesSnap.forEach(doc => {
            // Avoid duplicates if a team plays against itself
            if (!games.some(g => g.id === doc.id)) {
                 games.push({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() } as Game)
            }
        });

        games.sort((a, b) => b.date.getTime() - a.date.getTime());

        return games;
    } catch (error: any) {
        console.error("Error fetching games by team:", error);
        return [];
    }
}

export async function getGamesByCoach(userId: string): Promise<Game[]> {
    if (!adminDb) return [];
    try {
        const coachTeams = await getCoachTeams(userId);
        if (coachTeams.length === 0) {
            return [];
        }

        const teamIds = coachTeams.map(team => team.id);
        
        const gamesRef = adminDb.collection('games');
        // Firestore 'in' queries are limited to 30 items in the array.
        // If a coach can be on more than 30 teams, this will fail.
        // For now, this is a reasonable assumption.
        const homeGamesQuery = gamesRef.where('homeTeamId', 'in', teamIds).get();
        const awayGamesQuery = gamesRef.where('awayTeamId', 'in', teamIds).get();

        const [homeGamesSnap, awayGamesSnap] = await Promise.all([homeGamesQuery, awayGamesQuery]);

        const gamesMap = new Map<string, Game>();
        const processSnapshot = (snap: admin.firestore.QuerySnapshot) => {
             snap.forEach(doc => {
                const gameData = doc.data();
                gamesMap.set(doc.id, {
                    id: doc.id,
                    ...gameData,
                    date: gameData.date.toDate(),
                } as Game);
            });
        };
       
        processSnapshot(homeGamesSnap);
        processSnapshot(awayGamesSnap);

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort upcoming first

        return games;
    } catch (error: any) {
        console.error("Error fetching games by coach:", error);
        return [];
    }
}

export async function getGameById(gameId: string): Promise<Game | null> {
    if (!adminDb) return null;
    try {
        const gameRef = adminDb.collection('games').doc(gameId);
        const docSnap = await gameRef.get();
        if (!docSnap.exists) {
            console.warn(`Could not find game with ID: ${gameId}`);
            return null;
        }
        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            ...data,
            date: data.date.toDate(),
        } as Game;
    } catch (error: any) {
        console.error(`Error fetching game by ID ${gameId}:`, error);
        return null;
    }
}

export async function updateGameRoster(
    gameId: string,
    playerIds: string[],
    isHomeTeam: boolean
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: "Database not initialized." };
    try {
        const gameRef = adminDb.collection('games').doc(gameId);
        
        const updateData = isHomeTeam 
            ? { homeTeamPlayerIds: playerIds } 
            : { awayTeamPlayerIds: playerIds };

        await gameRef.update({
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        revalidatePath(`/games/${gameId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating game roster:", error);
        return { success: false, error: error.message || "Failed to update roster." };
    }
}
```

---

## src/app/games/new/page.tsx
```tsx
"use client";

import { GameForm } from "@/components/games/GameForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Loader2, AlertTriangle, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import type { Team, GameFormat, CompetitionCategory, UserFirestoreProfile, Season } from "@/types";
import { getTeamsByCoach, getAllTeams } from "@/app/teams/actions";
import { getGameFormats } from "@/app/game-formats/actions";
import { getCompetitionCategories } from "@/app/competition-categories/actions";
import { getUserProfileById } from "@/app/users/actions";
import { getSeasons } from "@/app/seasons/actions";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewGamePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [coachTeams, setCoachTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
  const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/games/new');
      return;
    }

    const loadPageData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const [profile, fetchedCoachTeams, fetchedAllTeams, formats, categories, fetchedSeasons] = await Promise.all([
          getUserProfileById(user.uid),
          getTeamsByCoach(user.uid),
          getAllTeams(),
          getGameFormats(),
          getCompetitionCategories(),
          getSeasons()
        ]);
        
        if (!profile || (profile.profileTypeId !== 'coach' && profile.profileTypeId !== 'super_admin' && profile.profileTypeId !== 'coordinator')) {
            setError("Access Denied. You must be a coach, coordinator, or admin to schedule games.");
            return;
        }

        setUserProfile(profile);
        setCoachTeams(fetchedCoachTeams);
        setAllTeams(fetchedAllTeams);
        setGameFormats(formats);
        setCompetitionCategories(categories);
        setSeasons(fetchedSeasons.filter(s => s.status === 'active')); // Only allow scheduling for active seasons

      } catch (err: any) {
        setError("Failed to load data required for scheduling a game.");
      } finally {
        setLoadingData(false);
      }
    };
    loadPageData();
  }, [user, authLoading, router]);
  
  if (authLoading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading game scheduler...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/games">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Games List
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <CalendarClock className="mr-3 h-8 w-8 text-primary" />
            Schedule New Game
          </CardTitle>
          <CardDescription>Fill in the details below to create a new game entry.</CardDescription>
        </CardHeader>
        <CardContent>
          <GameForm 
            coachTeams={coachTeams}
            allTeams={allTeams}
            gameFormats={gameFormats}
            competitionCategories={competitionCategories}
            seasons={seasons}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/games/page.tsx
```tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getGamesByCoach } from '@/app/games/actions';
import { getUserProfileById } from '@/app/users/actions';
import type { Game, UserFirestoreProfile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CalendarClock, PlusCircle, Shield, Settings } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function GamesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/games');
      return;
    }

    const loadPageData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profile, fetchedGames] = await Promise.all([
          getUserProfileById(user.uid),
          getGamesByCoach(user.uid)
        ]);

        if (!profile || profile.profileTypeId !== 'coach') {
           setError("Access Denied. You must be a coach to manage games.");
           setLoading(false);
           return;
        }

        setUserProfile(profile);
        setGames(fetchedGames);
      } catch (err: any) {
        setError("Failed to load games data.");
      } finally {
        setLoading(false);
      }
    };
    loadPageData();
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <CalendarClock className="mr-3 h-10 w-10" /> My Games
        </h1>
        <Button asChild>
          <Link href="/games/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Schedule New Game
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Upcoming & Recent Games</CardTitle>
          <CardDescription>
            List of all games scheduled for your teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {games.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Games Found</h2>
                <p className="text-muted-foreground">You have not scheduled any games yet.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Matchup</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>{format(game.date, 'PPp')}</TableCell>
                      <TableCell className="font-medium">{game.homeTeamName} vs {game.awayTeamName}</TableCell>
                      <TableCell>{game.location}</TableCell>
                      <TableCell className="capitalize">{game.status}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/games/${game.id}`}>
                            <Settings className="mr-2 h-4 w-4" /> Manage Game
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 220 13% 95%; /* Light gray #F0F2F5 */
    --foreground: 220 13% 15%; /* Darker text for light gray background */

    --muted: 220 10% 85%;
    --muted-foreground: 220 10% 40%;

    --popover: 0 0% 100%;
    --popover-foreground: 220 13% 15%;

    --card: 0 0% 100%;
    --card-foreground: 220 13% 15%;

    --border: 220 10% 80%;
    --input: 220 10% 80%;

    --primary: 231 48% 58%; /* Deep blue #3F51B5 */
    --primary-foreground: 0 0% 100%; /* White */

    --secondary: 231 30% 88%;
    --secondary-foreground: 231 48% 38%;

    --accent: 88 50% 53%; /* Green #7CB342 */
    --accent-foreground: 0 0% 0%; /* Black for contrast with green */

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --ring: 231 48% 58%;

    --radius: 0.5rem;

    --sidebar-background: 220 13% 98%;
    --sidebar-foreground: 220 13% 25%;
    --sidebar-primary: 231 48% 58%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 88 50% 53%;
    --sidebar-accent-foreground: 0 0% 0%;
    --sidebar-border: 220 10% 80%;
    --sidebar-ring: 231 48% 58%;
  }

  .dark {
    --background: 220 13% 10%;
    --foreground: 220 13% 95%;

    --muted: 220 10% 20%;
    --muted-foreground: 220 10% 70%;

    --popover: 220 13% 5%;
    --popover-foreground: 220 13% 95%;

    --card: 220 13% 5%;
    --card-foreground: 220 13% 95%;

    --border: 220 10% 25%;
    --input: 220 10% 25%;

    --primary: 231 48% 58%;
    --primary-foreground: 0 0% 100%;

    --secondary: 231 30% 28%;
    --secondary-foreground: 231 48% 78%;

    --accent: 88 50% 53%;
    --accent-foreground: 0 0% 0%;

    --destructive: 0 63% 40%;
    --destructive-foreground: 0 0% 100%;

    --ring: 231 48% 58%;

    --sidebar-background: 220 13% 8%;
    --sidebar-foreground: 220 13% 85%;
    --sidebar-primary: 231 48% 58%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 88 50% 53%;
    --sidebar-accent-foreground: 0 0% 0%;
    --sidebar-border: 220 10% 25%;
    --sidebar-ring: 231 48% 58%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

---

## src/app/layout.tsx
```tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { PT_Sans, Playfair_Display } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-pt-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BCSJD Web App',
  description: 'Application for BCSJD project management and data integration.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${ptSans.variable} ${playfairDisplay.variable}`}>
      <head />
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## src/app/login/page.tsx
```tsx
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, ShieldX } from "lucide-react";


export default function LoginPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const status = searchParams?.status;

  const renderStatusMessage = () => {
    switch (status) {
      case 'pending_approval':
        return (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Account Pending Approval</AlertTitle>
            <AlertDescription>
              Your registration is submitted. You will be able to log in once an administrator approves your account.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertTitle>Account Access Denied</AlertTitle>
            <AlertDescription>
              Your account access has been rejected. Please contact an administrator for more information.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>Sign in to access your BCSJD dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStatusMessage()}
          <LoginForm />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## src/app/page.tsx
```tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  // This page is now a simple Server Component.
  // It no longer contains client-side logic to check for authentication.
  // The middleware (`src/middleware.ts`) is solely responsible for redirecting
  // authenticated users away from this page to the /dashboard.
  // This approach simplifies the logic and prevents client-server race conditions.

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6 bg-gradient-to-br from-background to-secondary/30 rounded-xl shadow-2xl">
      <div className="max-w-2xl">
        <Image 
          src="https://placehold.co/600x300.png" 
          alt="BCSJD Platform Illustration" 
          width={600} 
          height={300} 
          priority 
          className="rounded-lg mb-10 shadow-lg"
          data-ai-hint="collaboration team"
        />
        <h1 className="text-5xl md:text-6xl font-headline font-extrabold mb-6 text-primary tracking-tight">
          Welcome to the BCSJD Web Application
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-10 leading-relaxed">
          Streamline your workflows, manage critical data, and collaborate effectively with our integrated platform. Built for performance and ease of use.
        </p>
        <div className="space-x-6">
          <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-md transition-shadow duration-300">
            <Link href="/register">Create Account</Link>
          </Button>
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          Powered by modern technology for a seamless experience.
        </p>
      </div>
    </div>
  );
}
```

---

## src/app/players/actions.ts
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { PlayerFormData, Player } from '@/types';

export async function createPlayer(
  formData: PlayerFormData,
  teamId: string,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!teamId || !clubId) {
    return { success: false, error: 'Team ID or Club ID is missing.' };
  }
  if (!formData.firstName || !formData.lastName) {
    return { success: false, error: 'First name and last name are required.' };
  }

  if (!adminDb) {
    const errorMessage = 'Firebase Admin SDK is not initialized. Player creation cannot proceed.';
    console.error('PlayerActions (createPlayer):', errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newPlayerData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      teamId: teamId,
      jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null,
      position: formData.position || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('players').add(newPlayerData);
    
    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating player:', error);
    return { success: false, error: error.message || 'Failed to create player.' };
  }
}

export async function getPlayersByTeamId(teamId: string): Promise<Player[]> {
  console.log(`PlayerActions: Attempting to fetch players for teamId: ${teamId}`);
  if (!adminDb) {
    console.warn('PlayerActions (getPlayersByTeamId): Admin SDK not available. Returning empty array.');
    return [];
  }
  if (!teamId) {
    console.warn('PlayerActions (getPlayersByTeamId): teamId is required.');
    return [];
  }

  try {
    const playersCollectionRef = adminDb.collection('players');
    const q = playersCollectionRef.where('teamId', '==', teamId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`PlayerActions: No players found for teamId: ${teamId}`);
      return [];
    }
    
    console.log(`PlayerActions: Found ${querySnapshot.docs.length} players for teamId: ${teamId}.`);
    
    const players = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      } as Player;
    });

    // Sort by last name, then first name
    players.sort((a, b) => {
        const lastNameComp = a.lastName.localeCompare(b.lastName);
        if (lastNameComp !== 0) return lastNameComp;
        return a.firstName.localeCompare(b.firstName);
    });
    
    return players;
  } catch (error: any) {
    console.error(`PlayerActions: Error fetching players for team ${teamId}:`, error.message, error.stack);
    return [];
  }
}
```

---

## src/app/profile/page.tsx
```tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, Edit3, ShieldAlert, AlertTriangle } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters.").optional(),
  email: z.string().email().optional(), // Email usually not changed here directly
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."), // Firebase requires re-auth for password change
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        displayName: user.displayName || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

  const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: values.displayName });
      toast({ title: "Profile Updated", description: "Your display name has been updated." });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  const handlePasswordUpdate = async (values: z.infer<typeof passwordSchema>) => {
    if (!auth.currentUser || !auth.currentUser.email) {
        toast({ variant: "destructive", title: "Error", description: "User not found or email missing." });
        return;
    }
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(auth.currentUser.email, values.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, values.newPassword);
      toast({ title: "Password Updated", description: "Your password has been successfully changed." });
      passwordForm.reset();
    } catch (error: any) {
      console.error("Password update error: ", error);
      toast({ variant: "destructive", title: "Password Update Failed", description: error.message || "Please check your current password." });
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-headline font-semibold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center space-x-4 p-6 bg-card rounded-lg shadow-lg">
        <Avatar className="h-24 w-24 border-2 border-primary">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
          <AvatarFallback className="text-3xl">{getInitials(user.displayName || user.email)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">{user.displayName || 'User Profile'}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center"><UserCircle className="mr-2 h-6 w-6 text-accent" />Personal Information</CardTitle>
            <CardDescription>View and update your personal details.</CardDescription>
          </div>
          {!isEditingProfile && (
            <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditingProfile} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={user.email || ""} disabled />
                <p className="text-xs text-muted-foreground pt-1">Email cannot be changed here.</p>
              </FormItem>
              {isEditingProfile && (
                <div className="flex space-x-2 pt-2">
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="ghost" onClick={() => {
                    setIsEditingProfile(false);
                    profileForm.reset({ displayName: user.displayName || "", email: user.email || "" });
                  }}>
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-accent"/>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={passwordForm.formState.isSubmitting} className="mt-2">
                {passwordForm.formState.isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/profile-types/actions.ts
```ts
'use server';

import type { ProfileTypeOption, ProfileType } from '@/types';
import { adminDb } from '@/lib/firebase/admin';

// Helper function to check if a string is a valid ProfileType defined in src/types/index.ts
// This function MUST be updated if the ProfileType enum in src/types/index.ts changes.
function isValidProfileType(id: string): id is ProfileType {
  const validTypes: ProfileType[] = [
    'club_admin', 
    'coach', 
    'coordinator', 
    'parent_guardian', 
    'player', 
    'scorer', 
    'super_admin', 
    'user'
  ];
  return validTypes.includes(id as ProfileType);
}

export async function getProfileTypeOptions(): Promise<ProfileTypeOption[]> {
  console.log("ProfileTypeActions: Attempting to fetch profile types from Firestore collection 'profileTypes' using Admin SDK. Ordering by 'label' asc.");
  
  if (!adminDb) {
      console.error("ProfileTypeActions: Firebase Admin SDK is not initialized. Cannot fetch profile types.");
      return [];
  }
  
  try {
    const profileTypesCollectionRef = adminDb.collection('profileTypes');
    // Order by label for consistent dropdown order
    const q = profileTypesCollectionRef.orderBy('label', 'asc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("ProfileTypeActions: No documents found in 'profileTypes' collection. An index on 'label' (asc) for 'profileTypes' collection is also required for ordering.");
      return [];
    }
    
    console.log(`ProfileTypeActions: Found ${querySnapshot.docs.length} documents in 'profileTypes' collection.`);
    
    const allProfileTypes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Use the Firestore document ID as the 'id' for the profile type
      const typeId = doc.id; 
      const typeLabel = data.label;
      
      if (!isValidProfileType(typeId)) {
        console.warn(`ProfileTypeActions: Document ID "${typeId}" is not a valid ProfileType as defined in src/types. Skipping. Data:`, data);
        return null; // Skip this invalid entry
      }

      if (typeof typeLabel !== 'string' || !typeLabel.trim()) {
         console.warn(`ProfileTypeActions: Document with ID "${typeId}" has missing or empty 'label' field. Using fallback. Data:`, data);
         // Provide a fallback label or skip, depending on desired behavior. Here, using a fallback.
         return { id: typeId as ProfileType, label: `Unnamed Type (ID: ${typeId})` };
      }

      return {
        id: typeId as ProfileType, // Cast to ProfileType after validation
        label: typeLabel,
      };
    }).filter(Boolean) as ProfileTypeOption[]; // Filter out nulls and cast
    
    console.log("ProfileTypeActions: Successfully fetched and mapped profile types with Admin SDK:", JSON.stringify(allProfileTypes, null, 2));
    return allProfileTypes;
  } catch (error: any) {
    console.error('ProfileTypeActions: Error fetching profile types from Firestore with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("ProfileTypeActions: Firestore query failed. This is likely due to a missing index for ordering by 'label' on the 'profileTypes' collection. Please create this index in your Firestore settings: Collection ID 'profileTypes', Field 'label', Order 'Ascending'.");
    }
    return []; // Return empty array on error
  }
}
```

---

## src/app/register/page.tsx
```tsx
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Create an Account</CardTitle>
          <CardDescription>Join the BCSJD platform today.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RegisterForm />
           <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## src/app/reset-password/page.tsx
```tsx
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Reset Your Password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="flex items-center text-sm text-primary hover:underline">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## src/app/tasks/[id]/edit/page.tsx
```tsx
import { getTaskById } from "@/app/tasks/actions";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Edit } from "lucide-react";
import { auth } from "@/lib/firebase/client"; // Assuming auth is initialized and currentUser is available
import { redirect } from "next/navigation";


export default async function EditTaskPage({ params }: { params: { id: string } }) {
  // This is a server component, so auth.currentUser might not be reliable here.
  // For robust auth in Server Components, you'd typically use a session management library
  // or verify an ID token passed from the client or from cookies.
  // For this example, we'll simulate getting userId. In real app, pass it or use server-side auth.
  // const userId = auth.currentUser?.uid; // This is NOT reliable in Server Components.
  // A common pattern is to have a server-side auth helper.
  // For now, as a placeholder for this scaffold, we will proceed.
  // Ideally, this page would be client component to use useAuth() or protected by middleware that ensures user.

  // This is a workaround, best to handle auth state properly for server components or make this a client component.
  // If not using a proper server-session, you would pass the userId from a parent client component or context.
  // For this example, we'll assume middleware protects this route and user is available.
  // However, getTaskById needs the userId. This is tricky for pure Server Component.
  
  // For the purpose of this scaffold, we acknowledge this limitation for pure server component.
  // Making this a client component is a safer approach for Firebase client SDK.
  // Or, ensure the server action `getTaskById` can run without client-side `auth.currentUser`.
  // To make it work for now, we might need to pass userId or make it client.
  
  // REDIRECTING to client component pattern below.
  // The actual fetching and form rendering will be in a client component.
  // This server component just acts as a loader/router.

  // This Server Component will fetch the initial task data.
  // Authentication needs to be handled, for instance, by passing userId or making it client-side.
  // Since actions.ts is server-side, it *could* use Admin SDK if properly configured.
  // For now, we'll stick to client SDK and rely on middleware for route protection.
  // The userId for getTaskById will be problematic if not passed or handled by client.

  // To simplify, we'll assume actions.ts `getTaskById` will be called from a client component
  // that provides the userId. This page will be a client component.

  // The below approach is if this were a SERVER component strictly.
  // const task = await getTaskById(params.id, "PLACEHOLDER_USER_ID_FETCH_SERVER_SIDE");
  // Since we decided on client components for pages needing auth, we'll adjust.
  // This page itself cannot reliably get userId with Firebase client SDK if it's a server component.
  // We'll structure it assuming it will become a client component or call one.
  // For now, let's just use a client component approach for the form itself.
  
  // The solution is to make the component that *needs* user.uid a client component.
  // This page can remain server, but it would pass data to a client component.
  // Or, the entire page becomes client.
  // Let's try to keep it simple: make the page client to use useAuth.
  
  // This page will be marked as "use client" to use useAuth hook.
  // It has been converted to a Client Component below by moving the logic into EditTaskClientPage.
  
  return <EditTaskClientPage taskId={params.id} />;
}


// --- Client Component Part ---
"use client"; // Make this part a client component

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types'; // Assuming Task type is defined

function EditTaskClientPage({ taskId }: { taskId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to load

    if (!user) {
      redirect("/login"); // Or show an error message
      return;
    }

    async function fetchTask() {
      try {
        setLoading(true);
        const fetchedTask = await getTaskById(taskId, user.uid); // Pass user.uid here
        if (fetchedTask) {
          setTask(fetchedTask);
        } else {
          setError("Task not found or you don't have permission to edit it.");
        }
      } catch (e: any) {
        setError(e.message || "Failed to load task.");
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [taskId, user, authLoading]);

  if (authLoading || loading) {
    return <p className="text-center py-10">Loading task details...</p>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Error Loading Task</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  if (!task) {
     return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Task Not Found</h2>
        <p className="text-muted-foreground">The requested task could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Edit className="mr-3 h-8 w-8 text-primary" />
            Edit Task
          </CardTitle>
          <CardDescription>Update the details for your task: "{task.title}".</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm task={task} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/tasks/[id]/page.tsx
```tsx
// This page will be a client component to use useAuth for userId
"use client";

import React, { useEffect, useState } from 'react';
import { getTaskById } from "@/app/tasks/actions";
import type { Task } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, Tag, Info, Edit, Trash2, ChevronLeft, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import {format} from 'date-fns';
import { deleteTask } from '@/app/tasks/actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to login or show error, this should ideally be caught by middleware too
      router.push("/login?redirect=/tasks/" + params.id);
      return;
    }

    async function fetchTask() {
      try {
        setLoading(true);
        const fetchedTask = await getTaskById(params.id, user.uid);
        if (fetchedTask) {
          setTask(fetchedTask);
        } else {
          setError("Task not found or you don't have permission to view it.");
        }
      } catch (e: any) {
        setError(e.message || "Failed to load task data.");
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [params.id, user, authLoading, router]);

  const handleDelete = async () => {
    if (!task || !user) return;
    const result = await deleteTask(task.id, user.uid);
    if (result.success) {
      toast({ title: "Task Deleted", description: `Task "${task.title}" has been deleted.` });
      router.push("/tasks");
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Deletion Failed", description: result.error });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading task details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild className="mt-4">
            <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Tasks</Link>
        </Button>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold">Task Not Found</h2>
        <p className="text-muted-foreground">The task you are looking for does not exist or has been removed.</p>
        <Button asChild className="mt-4">
            <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  const statusColors = {
    todo: "bg-yellow-500/20 text-yellow-700 border-yellow-500",
    inprogress: "bg-blue-500/20 text-blue-700 border-blue-500",
    done: "bg-green-500/20 text-green-700 border-green-500",
  };

  const priorityColors = {
    low: "bg-gray-500/20 text-gray-700 border-gray-500",
    medium: "bg-orange-500/20 text-orange-700 border-orange-500",
    high: "bg-red-500/20 text-red-700 border-red-500",
  };
  
  const formatDate = (date?: Date | null) => {
    if (!date) return 'N/A';
    return format(date, 'PPP'); // e.g., Jun 20, 2023
  };


  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Tasks</Link>
      </Button>
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/10 p-6">
          <CardTitle className="text-3xl font-headline text-primary">{task.title}</CardTitle>
          {task.description && <CardDescription className="text-md text-foreground/80 pt-1">{task.description}</CardDescription>}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Info className="mr-2 h-4 w-4 text-accent" />Status</h4>
              <p className={`px-3 py-1 text-sm font-semibold rounded-full border w-fit ${statusColors[task.status]}`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4 text-accent" />Priority</h4>
              <p className={`px-3 py-1 text-sm font-semibold rounded-full border w-fit ${priorityColors[task.priority]}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </p>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-accent" />Due Date</h4>
                <p className="text-lg font-medium">{formatDate(task.dueDate)}</p>
            </div>
             <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-accent" />Created At</h4>
                <p className="text-lg font-medium">{formatDate(task.createdAt)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 flex justify-end space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/tasks/${task.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the task
                  "{task.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## src/app/tasks/actions.ts
```ts
"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from 'firebase-admin';
import type { Task, TaskFormData } from "@/types";

export async function createTask(formData: TaskFormData, userId: string): Promise<{ success: boolean; error?: string, id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }

  try {
    const newTaskData = {
      ...formData,
      dueDate: formData.dueDate ? admin.firestore.Timestamp.fromDate(new Date(formData.dueDate)) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId,
    };
    const docRef = await adminDb.collection("tasks").add(newTaskData);
    revalidatePath("/tasks");
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating task:", error);
    return { success: false, error: error.message || "Failed to create task." };
  }
}

export async function updateTask(id: string, formData: Partial<TaskFormData>, userId: string): Promise<{ success: boolean; error?: string }> {
   if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    
    if (!taskSnap.exists || taskSnap.data()?.userId !== userId) {
      return { success: false, error: "Permission denied or task not found."};
    }

    const updateData: { [key: string]: any } = { ...formData, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (formData.dueDate) {
      updateData.dueDate = admin.firestore.Timestamp.fromDate(new Date(formData.dueDate));
    } else if (formData.dueDate === null) {
      updateData.dueDate = null;
    }
    
    await taskRef.update(updateData);
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${id}`);
    revalidatePath(`/tasks/${id}/edit`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating task:", error);
    return { success: false, error: error.message || "Failed to update task." };
  }
}

export async function deleteTask(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists() || taskSnap.data()?.userId !== userId) {
      return { success: false, error: "Permission denied or task not found."};
    }
    await taskRef.delete();
    revalidatePath("/tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return { success: false, error: error.message || "Failed to delete task." };
  }
}

export async function getTasks(userId: string): Promise<Task[]> {
  if (!userId) {
    console.warn("getTasks called without userId.");
    return [];
  }
  if (!adminDb) {
    return [];
  }
  try {
    const q = adminDb.collection("tasks").where("userId", "==", userId);
    const querySnapshot = await q.get();
    const tasks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            dueDate: data.dueDate ? data.dueDate.toDate() : null,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
        } as Task
    });
    return tasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function getTaskById(id: string, userId: string): Promise<Task | null> {
  if (!userId) {
     console.warn("getTaskById called without userId.");
    return null;
  }
  if (!adminDb) {
    return null;
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    
    if (taskSnap.exists() && taskSnap.data()?.userId === userId) {
       const data = taskSnap.data()!;
       return {
            id: taskSnap.id,
            ...data,
            dueDate: data.dueDate ? data.dueDate.toDate() : null,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
        } as Task;
    }
    return null;
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    return null;
  }
}
```

---

## src/app/tasks/new/page.tsx
```tsx
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListPlus } from "lucide-react";

export default function NewTaskPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <ListPlus className="mr-3 h-8 w-8 text-primary" />
            Create New Task
          </CardTitle>
          <CardDescription>Fill in the details below to add a new task to your list.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/tasks/page.tsx
```tsx
"use client";

import React, { useEffect, useState } from 'react';
import { getTasks } from "@/app/tasks/actions";
import type { Task } from "@/types";
import { TasksList } from "@/components/tasks/TasksList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router


export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Client-side guard: If auth is resolved and there is no user, redirect.
    if (!authLoading && !user) {
      router.replace('/login?redirect=/tasks');
      return;
    }
    
    if (user) {
       async function fetchTasks() {
        try {
          setLoading(true);
          const fetchedTasks = await getTasks(user.uid); // Pass user.uid to fetch tasks for this user
          setTasks(fetchedTasks);
        } catch (e: any) {
          console.error("Failed to fetch tasks:", e);
          setError(e.message || "Could not load tasks. Please try again later.");
        } finally {
          setLoading(false);
        }
      }
      fetchTasks();
    }
  }, [user, authLoading, router]);

  // Show a loader while authentication is in progress or if there's no user yet (and we are about to redirect).
  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-semibold">Verifying Access...</h1>
        <p className="text-muted-foreground">Please wait.</p>
      </div>
    );
  }

  // If we are still loading the tasks data for an authenticated user.
  if (loading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-semibold">Loading Tasks...</h1>
        <p className="text-muted-foreground">Please wait while we fetch your tasks.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Failed to Load Tasks</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary">My Tasks</h1>
        <Button asChild>
          <Link href="/tasks/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Task
          </Link>
        </Button>
      </div>
      <TasksList tasks={tasks} />
    </div>
  );
}
```

---

## src/app/teams/actions.ts
```ts
"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
import type { TeamFormData, Team } from "@/types";

export async function createTeam(
  formData: TeamFormData,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!clubId) {
    return { success: false, error: "Club ID is missing." };
  }
  if (!formData.name || formData.name.trim() === "") {
    return { success: false, error: "Team name cannot be empty." };
  }

  if (!adminDb) {
    const errorMessage = "Firebase Admin SDK is not initialized. Team creation cannot proceed.";
    console.error("TeamActions (createTeam):", errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newTeamData: Omit<Team, "id" | "createdAt" | "updatedAt"> & { createdAt: any, updatedAt: any } = {
      name: formData.name.trim(),
      clubId: clubId,
      gameFormatId: formData.gameFormatId || null,
      competitionCategoryId: formData.competitionCategoryId || null,
      coachIds: formData.coachIds ? formData.coachIds.split(',').map(id => id.trim()).filter(id => id) : [],
      coordinatorIds: formData.coordinatorIds ? formData.coordinatorIds.split(',').map(id => id.trim()).filter(id => id) : [],
      playerIds: formData.playerIds ? formData.playerIds.split(',').map(id => id.trim()).filter(id => id) : [],
      logoUrl: formData.logoUrl || null,
      city: formData.city || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUserId: userId,
    };

    const docRef = await adminDb.collection("teams").add(newTeamData);
    
    revalidatePath(`/clubs/${clubId}`);
    // Potentially revalidate a general teams list page if one exists
    // revalidatePath(`/teams`); 

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating team:", error);
    return { success: false, error: error.message || "Failed to create team." };
  }
}

export async function getTeamsByClubId(clubId: string): Promise<Team[]> {
  console.log(`TeamActions: Attempting to fetch teams for clubId: ${clubId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamsByClubId): Admin SDK not available. Returning empty array.");
    return [];
  }
  if (!clubId) {
    console.warn("TeamActions (getTeamsByClubId): clubId is required.");
    return [];
  }

  try {
    const teamsCollectionRef = adminDb.collection('teams');
    // Simplified query to avoid needing a composite index. We will sort in memory later.
    const q = teamsCollectionRef.where('clubId', '==', clubId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`TeamActions: No teams found for clubId: ${clubId}`);
      return [];
    }
    
    console.log(`TeamActions: Found ${querySnapshot.docs.length} teams for clubId: ${clubId}.`);
    
    const teams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      } as Team;
    });

    // Sort the results in memory by creation date, newest first.
    teams.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return teams;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching teams for club ${clubId}:`, error.message, error.stack);
     if (error.code === 'failed-precondition') {
        // This error is less likely now, but we keep the log just in case.
        console.error("TeamActions: Firestore query for teams failed. This could be a missing index for 'clubId'.");
    }
    return [];
  }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  console.log(`TeamActions: Attempting to fetch team by ID: ${teamId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamById): Admin SDK not available. Returning null.");
    return null;
  }
  if (!teamId) {
    console.warn("TeamActions (getTeamById): teamId is required.");
    return null;
  }

  try {
    const teamDocRef = adminDb.collection('teams').doc(teamId);
    const docSnap = await teamDocRef.get();

    if (!docSnap.exists) {
      console.warn(`TeamActions: No team found with ID: ${teamId}`);
      return null;
    }
    
    const data = docSnap.data()!;
    console.log(`TeamActions: Found team: ${data.name}`);
    
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
    } as Team;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching team by ID ${teamId}:`, error.message, error.stack);
    return null;
  }
}
```

---

## src/app/users/actions.ts
```ts
'use server';

import admin, { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus } from '@/types';

// This new server action uses the Admin SDK to securely create the user profile,
// bypassing client-side security rules which are a common point of failure.
export async function finalizeNewUserProfile(
  idToken: string,
  data: { profileType: ProfileType; selectedClubId: string; displayName: string; }
): Promise<{ success: boolean; error?: string }> {
  // Defensive check to ensure the Admin SDK was initialized correctly.
  if (!adminAuth || !adminDb) {
    console.error("UserActions (finalize): Firebase Admin SDK not initialized. Error:", adminInitError);
    return { success: false, error: `Server configuration error: ${adminInitError || 'Unknown admin SDK error.'}` };
  }

  try {
    console.log("UserActions (finalize): Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log(`UserActions (finalize): ID token verified for UID: ${uid}`);

    // Use the Admin SDK to update the Auth user's display name
    await adminAuth.updateUser(uid, { displayName: data.displayName });
    console.log(`UserActions (finalize): Updated Auth user display name for UID: ${uid}`);

    // Use the Admin SDK to create the Firestore user profile document
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);

    // Casting to any to handle serverTimestamp correctly before saving
    const profileToSave: any = {
        uid: uid,
        email: decodedToken.email,
        displayName: data.displayName,
        photoURL: decodedToken.picture || null,
        profileTypeId: data.profileType,
        clubId: data.selectedClubId,
        status: 'pending_approval' as UserProfileStatus,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await userProfileRef.set(profileToSave);
    console.log(`UserActions (finalize): Successfully created Firestore profile for UID: ${uid}`);
    
    return { success: true };

  } catch (error: any) {
    console.error(`UserActions (finalize): Error finalizing user profile. Error code: ${error.code}. Message: ${error.message}`);
    return { success: false, error: `Failed to finalize profile on server: ${error.message}` };
  }
}


export async function getUserProfileById(uid: string): Promise<UserFirestoreProfile | null> {
  // Defensive check to ensure the Admin SDK was initialized correctly.
  if (!adminDb) {
    console.error("UserActions (getProfile): Firebase Admin SDK not initialized. Error:", adminInitError);
    // Do not throw, just return null so the UI can handle it.
    return null;
  }
  
  console.log(`UserActions: Attempting to fetch profile for UID: ${uid} from 'user_profiles' using Admin SDK.`);
  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const docSnap = await userProfileRef.get();

    if (docSnap.exists) {
      console.log(`UserActions: Profile found for UID: ${uid}.`);
      const data = docSnap.data();
      
      // Convert Firestore Timestamps to serializable JS Date objects
      const serializableProfile = {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };

      return { uid: docSnap.id, ...serializableProfile } as UserFirestoreProfile;
    } else {
      console.warn(`UserActions: No profile found for UID: ${uid} using Admin SDK.`);
      return null;
    }
  } catch (error: any) {
    console.error(`UserActions: Error fetching user profile for UID ${uid} with Admin SDK:`, error.message, error.stack);
    return null;
  }
}

export async function getUsersByProfileTypeAndClub(
  profileType: ProfileType,
  clubId: string
): Promise<UserFirestoreProfile[]> {
  if (!adminDb) {
    console.error("UserActions (getUsersByProfileTypeAndClub): Admin SDK not initialized.");
    return [];
  }
  try {
    const usersRef = adminDb.collection('user_profiles');
    const q = usersRef.where('clubId', '==', clubId).where('profileTypeId', '==', profileType);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserFirestoreProfile;
    });

    users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    return users;

  } catch (error: any) {
    console.error(`Error fetching users by profile type '${profileType}' for club '${clubId}':`, error.message);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("Firestore query failed. This is likely due to a missing composite index. Please create an index on 'clubId' and 'profileTypeId' for the 'user_profiles' collection.");
    }
    return [];
  }
}
```

---

## src/components/auth/GoogleSignInButton.tsx
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/client";
import { GoogleAuthProvider, signInWithPopup, UserCredential, signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);


export function GoogleSignInButton() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      
      if (!result.user) {
        throw new Error("Google Sign-In failed, user object not found.");
      }

      const idToken = await result.user.getIdToken();
      const response = await fetch('/api/auth/session-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // If server rejects session, sign out client-side
        await signOut(auth);

        if (responseData.reason) {
          router.push(`/login?status=${responseData.reason}`);
          return;
        }
        throw new Error(responseData.error || 'Session login failed for Google Sign-In.');
      }

      toast({ title: "Signed in with Google", description: `Welcome, ${result.user.displayName}!` });
      router.push(redirectUrl);
      router.refresh(); 
    } catch (error: any) {
      console.error("Google Sign-In error: ", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  return (
    <Button variant="outline" type="button" onClick={handleSignIn} className="w-full">
      <GoogleIcon />
      Sign in with Google
    </Button>
  );
}
```

---

## src/components/auth/LoginForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  rememberMe: z.boolean().default(false).optional(),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await setPersistence(auth, values.rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      if (!userCredential.user) {
        throw new Error("Login failed, user object not found.");
      }

      const idToken = await userCredential.user.getIdToken();
      const response = await fetch('/api/auth/session-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // If server rejects session (e.g. pending approval), sign out client-side
        await signOut(auth);

        if (responseData.reason) {
          router.push(`/login?status=${responseData.reason}`);
          return;
        }
        // Fallback for other errors from the session-login endpoint
        throw new Error(responseData.error || 'Session login failed.');
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push(redirectUrl);
      router.refresh(); 
    } catch (error: any) {
      console.error("Login error: ", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.code === 'auth/invalid-credential' 
          ? "Invalid email or password." 
          : error.message || "Invalid email or password.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="rememberMeLogin"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="rememberMeLogin"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </Label>
                </div>
              </FormItem>
            )}
          />
          <Link href="/reset-password" passHref>
            <Button variant="link" type="button" className="px-0 text-sm">
              Forgot password?
            </Button>
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/auth/RegisterForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword, signOut, UserCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/client"; 
import { useRouter } from "next/navigation";
import { finalizeNewUserProfile } from "@/app/users/actions";
import { getApprovedClubs } from "@/app/clubs/actions";
import { getProfileTypeOptions } from "@/app/profile-types/actions";
import type { Club, ProfileType, ProfileTypeOption } from "@/types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  profileType: z.enum([
    'club_admin',
    'coach',
    'coordinator',
    'parent_guardian',
    'player',
    'scorer',
    'super_admin',
    'user'
    ], {
    errorMap: () => ({ message: "Please select a valid profile type." })
  }),
  selectedClubId: z.string().min(1, { message: "Please select a club." }),
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [profileTypeOptions, setProfileTypeOptions] = useState<ProfileTypeOption[]>([]);
  const [loadingProfileTypes, setLoadingProfileTypes] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoadingClubs(true);
      setLoadingProfileTypes(true);
      try {
        const [fetchedClubs, fetchedProfileTypes] = await Promise.all([
           getApprovedClubs(),
           getProfileTypeOptions()
        ]);
        
        setClubs(Array.isArray(fetchedClubs) ? fetchedClubs : []);
        setProfileTypeOptions(Array.isArray(fetchedProfileTypes) ? fetchedProfileTypes : []);
        
        if (!Array.isArray(fetchedClubs)) console.warn("RegisterForm: Fetched clubs is not an array:", fetchedClubs);
        if (!Array.isArray(fetchedProfileTypes)) console.warn("RegisterForm: Fetched profile types is not an array:", fetchedProfileTypes);

      } catch (error: any) {
        console.error("RegisterForm: Failed to fetch data for form:", error);
        toast({ variant: "destructive", title: "Error Loading Data", description: error.message || "Could not load clubs or profile types."});
        setClubs([]);
        setProfileTypeOptions([]);
      } finally {
        setLoadingClubs(false);
        setLoadingProfileTypes(false);
      }
    }
    fetchData();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let userCredential: UserCredential | undefined;
    
    try {
      // Step 1: Create the user in Firebase Auth client-side
      userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("User creation failed, user object is null.");
      }
      
      console.log("RegisterForm: Auth user created. Getting ID token...");
      const idToken = await firebaseUser.getIdToken();
      console.log("RegisterForm: Got ID token. Calling server action to finalize profile.");

      // Step 2: Call the robust server action to create the Firestore profile
      const profileResult = await finalizeNewUserProfile(idToken, {
        displayName: values.name,
        profileType: values.profileType,
        selectedClubId: values.selectedClubId,
      });

      if (!profileResult.success) {
        // If the backend fails, this is a critical error. The `catch` block will handle cleanup.
        throw new Error(profileResult.error || "Failed to create user profile on the server.");
      }

      // Step 3: Success! Inform the user, sign out, and redirect.
      toast({
        title: "Registration Submitted",
        description: "Your registration has been submitted. An administrator will review it shortly. You will be able to log in once your account is approved.",
        duration: 7000,
      });
      
      await signOut(auth);
      router.push("/login?status=pending_approval");
      router.refresh();

    } catch (error: any) {
      console.error("RegisterForm: ERROR during registration process:", error);

      // --- Cleanup on Failure ---
      // If we created an auth user but the process failed later, delete the auth user
      // to prevent creating a "ghost" user with no profile.
      if (userCredential?.user) {
          console.warn("RegisterForm: Deleting partially created user due to subsequent error...");
          try {
              await userCredential.user.delete();
              console.log("RegisterForm: Successfully deleted partially created user.");
          } catch (deleteError) {
              console.error("RegisterForm: CRITICAL - Failed to delete partially created user. This user must be manually removed from Firebase Auth:", userCredential.user.uid, deleteError);
          }
      }

      // --- Inform User of Failure ---
      let description = "An unexpected error occurred during registration.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use. Please use a different email or try logging in.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: description,
        duration: 9000,
      });
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="profileType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loadingProfileTypes || profileTypeOptions.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingProfileTypes
                          ? "Loading profile types..."
                          : profileTypeOptions.length === 0
                            ? "No profile types available"
                            : "Select your profile type"
                        } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profileTypeOptions.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label || `Unnamed Type ID: ${type.id}`}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="selectedClubId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Your Club</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loadingClubs || clubs.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingClubs
                            ? "Loading clubs..."
                            : clubs.length === 0
                            ? "No clubs available"
                            : "Select the club you belong to"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clubs.map((club) => (
                         <SelectItem key={club.id} value={club.id}>
                           {club.name || `Unnamed Club ID: ${club.id}`}
                         </SelectItem>
                       )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || loadingClubs || loadingProfileTypes}>
            {(form.formState.isSubmitting || loadingClubs || loadingProfileTypes) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {form.formState.isSubmitting ? "Registering..." : "Create Account"}
          </Button>
        </form>
      </Form>
    </>
  );
}
```

---

## src/components/auth/ResetPasswordForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import React from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export function ResetPasswordForm() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for a link to reset your password.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Password reset error: ", error);
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/clubs/ClubForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ClubFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createClub } from "@/app/clubs/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const clubFormSchema = z.object({
  name: z.string().min(2, "Club name must be at least 2 characters."),
  shortName: z.string().optional(),
  province_name: z.string().optional(),
  city_name: z.string().optional(),
  logoUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
});

interface ClubFormProps {
  onFormSubmit: () => void;
}

export function ClubForm({ onFormSubmit }: ClubFormProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof clubFormSchema>>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      name: "",
      shortName: "",
      province_name: "",
      city_name: "",
      logoUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof clubFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }

    const result = await createClub(values, user.uid);

    if (result.success) {
      toast({
        title: "Club Created",
        description: `Club "${values.name}" has been created and is pending approval.`,
      });
      form.reset();
      onFormSubmit();
    } else {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: result.error || "An unexpected error occurred.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Club Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Real Madrid" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., RMA" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="province_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Province (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Madrid" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Madrid" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {form.formState.isSubmitting ? "Creating..." : "Create Club"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/games/GameForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GameFormData, Team, GameFormat, CompetitionCategory, Season } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createGame } from "@/app/games/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import React, { useState, useMemo, useEffect } from 'react';

const gameFormSchema = z.object({
  seasonId: z.string().min(1, "You must select a season."),
  competitionCategoryId: z.string().min(1, "You must select a competition."),
  homeTeamId: z.string().min(1, "You must select a home team."),
  awayTeamId: z.string().min(1, "You must select an away team."),
  date: z.string().min(1, "A date is required."),
  time: z.string().min(1, "A time is required."),
  location: z.string().min(3, "Location must be at least 3 characters."),
  gameFormatId: z.string().optional().nullable(),
}).refine(data => data.homeTeamId !== data.awayTeamId, {
    message: "Home and away teams cannot be the same.",
    path: ["awayTeamId"],
});


interface GameFormProps {
  coachTeams: Team[];
  allTeams: Team[];
  gameFormats: GameFormat[];
  competitionCategories: CompetitionCategory[];
  seasons: Season[];
}

export function GameForm({ coachTeams, allTeams, gameFormats, competitionCategories, seasons }: GameFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof gameFormSchema>>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      seasonId: "",
      competitionCategoryId: "",
      homeTeamId: "",
      awayTeamId: "",
      date: "",
      time: "",
      location: "",
      gameFormatId: undefined,
    },
  });

  const { watch, setValue } = form;
  const selectedSeasonId = watch('seasonId');
  const selectedCompetitionId = watch('competitionCategoryId');
  const selectedHomeTeamId = watch('homeTeamId');

  const selectedSeason = useMemo(() => seasons.find(s => s.id === selectedSeasonId), [seasons, selectedSeasonId]);
  
  const availableCompetitions = useMemo(() => {
    if (!selectedSeason) return [];
    return selectedSeason.competitions.map(sc => {
        return competitionCategories.find(cc => cc.id === sc.competitionCategoryId);
    }).filter((c): c is CompetitionCategory => !!c);
  }, [selectedSeason, competitionCategories]);

  const eligibleTeams = useMemo(() => {
    if (!selectedSeason || !selectedCompetitionId) return [];
    const competition = selectedSeason.competitions.find(c => c.competitionCategoryId === selectedCompetitionId);
    if (!competition) return [];
    return allTeams.filter(t => competition.teamIds.includes(t.id));
  }, [selectedSeason, selectedCompetitionId, allTeams]);

  const homeTeamOptions = useMemo(() => {
      return eligibleTeams.filter(et => coachTeams.some(ct => ct.id === et.id));
  }, [eligibleTeams, coachTeams]);

  const awayTeamOptions = useMemo(() => {
      return eligibleTeams.filter(et => et.id !== selectedHomeTeamId);
  }, [eligibleTeams, selectedHomeTeamId]);

  useEffect(() => {
    if (selectedCompetitionId) {
        const category = availableCompetitions.find(c => c.id === selectedCompetitionId);
        if (category && category.gameFormatId) {
            setValue("gameFormatId", category.gameFormatId, { shouldValidate: true });
        } else {
            setValue("gameFormatId", null, { shouldValidate: true });
        }
    }
  }, [selectedCompetitionId, availableCompetitions, setValue]);
  
  const selectedGameFormatName = gameFormats.find(f => f.id === watch("gameFormatId"))?.name;

  async function onSubmit(values: z.infer<typeof gameFormSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }
    
    // The form data already matches GameFormData type
    const result = await createGame(values, user.uid);

    if (result.success) {
      toast({
        title: "Game Scheduled",
        description: `The game has been successfully scheduled.`,
      });
      router.push("/games");
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Scheduling Failed",
        description: result.error || "An unexpected error occurred.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="seasonId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>1. Select Season</FormLabel>
              <Select onValueChange={value => {
                  field.onChange(value);
                  setValue('competitionCategoryId', '');
                  setValue('homeTeamId', '');
                  setValue('awayTeamId', '');
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an active season" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {seasons.map(season => (
                    <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="competitionCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>2. Select Competition</FormLabel>
              <Select onValueChange={value => {
                  field.onChange(value);
                  setValue('homeTeamId', '');
                  setValue('awayTeamId', '');
              }} value={field.value} disabled={!selectedSeasonId || availableCompetitions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedSeasonId ? "First select a season" : "Select a competition"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCompetitions.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="homeTeamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>3. Select Home Team (Your Team)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCompetitionId || homeTeamOptions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedCompetitionId ? "First select competition" : "Select your team"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {homeTeamOptions.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {homeTeamOptions.length === 0 && selectedCompetitionId && <p className="text-sm text-muted-foreground mt-1">You do not coach any teams registered in this competition.</p>}
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="awayTeamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>4. Select Away Team (Opponent)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedHomeTeamId || awayTeamOptions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedHomeTeamId ? "First select home team" : "Select opponent"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {awayTeamOptions.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., City Park, Field 4" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
            <FormLabel>Game Format</FormLabel>
            <FormControl>
                <Input 
                    value={selectedGameFormatName || "Automatically selected based on competition"} 
                    disabled 
                />
            </FormControl>
            <FormDescription>
                The game format is determined by the selected competition.
            </FormDescription>
            <FormMessage />
        </FormItem>

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scheduling Game...
            </>
          ) : (
            "Schedule Game"
          )}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/layout/Header.tsx
```tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import UserNav from './UserNav';
import { Button } from '@/components/ui/button';
import { 
    LayoutDashboard, 
    ListChecks, 
    BarChart3, 
    LogIn, 
    UserCog, 
    CalendarClock, 
    CalendarCheck,
    Tag,
    ChevronDown,
    Building,
    ListOrdered
} from 'lucide-react';
import { useEffect, useState } from 'react'; 
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);

  useEffect(() => {
    if (user && !profile) {
      getUserProfileById(user.uid).then(setProfile);
    }
    if (!user) {
      setProfile(null);
    }
  }, [user, profile]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <span className="font-headline text-2xl font-bold text-primary">BCSJD App</span>
        </Link>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {!loading && user && (
            <>
              <Link href="/dashboard" className="transition-colors hover:text-primary flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Link>
              <Link href="/tasks" className="transition-colors hover:text-primary flex items-center">
                <ListChecks className="mr-2 h-4 w-4" /> Tasks
              </Link>
              <Link href="/games" className="transition-colors hover:text-primary flex items-center">
                <CalendarClock className="mr-2 h-4 w-4" /> Games
              </Link>
              <Link href="/bcsjd-api-data" className="transition-colors hover:text-primary flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" /> API Data
              </Link>
              
              {profile?.profileTypeId === 'super_admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="transition-colors hover:text-primary flex items-center">
                      Admin Tools
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Management</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/user-management" className="flex items-center w-full cursor-pointer">
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>Users</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/clubs" className="flex items-center w-full cursor-pointer">
                        <Building className="mr-2 h-4 w-4" />
                        <span>Clubs</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/seasons" className="flex items-center w-full cursor-pointer">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        <span>Seasons</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/admin/competition-categories" className="flex items-center w-full cursor-pointer">
                        <Tag className="mr-2 h-4 w-4" />
                        <span>Categories</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/admin/game-formats" className="flex items-center w-full cursor-pointer">
                        <ListOrdered className="mr-2 h-4 w-4" />
                        <span>Game Formats</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {!loading && user ? (
            <UserNav />
          ) : !loading ? ( 
            <Button asChild variant="default" size="sm">
              <Link href="/login" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" /> Login / Register
              </Link>
            </Button>
          ) : null } 
        </div>
      </div>
    </header>
  );
}
```

---

## src/components/layout/UserNav.tsx
```tsx
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { signOut as firebaseClientSignOut } from 'firebase/auth'; // Renamed to avoid conflict
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { LogOut, UserCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    console.log("UserNav: Logout process initiated.");
    try {
      // Step 1: Attempt to clear the server session cookie.
      console.log("UserNav: Attempting to call /api/auth/session-logout endpoint.");
      const response = await fetch('/api/auth/session-logout', {
        method: 'POST',
      });

      if (!response.ok) {
        // If the server call fails, log the error but DO NOT stop the logout process.
        const errorData = await response.json();
        console.error('UserNav: Server-side session logout failed. Response:', errorData.error);
        toast({ variant: "destructive", title: "Logout Warning", description: "Could not clear server session. Logging out locally." });
      } else {
        console.log("UserNav: Server responded OK. Session cookie should be cleared.");
      }
    } catch (error: any) {
      // Also catch network errors, but again, DO NOT stop the logout process.
      console.error('UserNav: API call to /api/auth/session-logout failed:', error);
      toast({ variant: "destructive", title: "Logout Error", description: `Could not contact logout service: ${error.message}` });
    } finally {
      // Step 2: ALWAYS perform client-side sign-out and redirect.
      // This ensures the user is logged out on the client regardless of server state.
      try {
        await firebaseClientSignOut(auth);
        console.log("UserNav: Client-side firebaseClientSignOut() completed.");
        toast({ title: "Logged out", description: "You have been successfully logged out." });
        
        // Step 3: Redirect to a clean login page.
        router.push('/login'); 
        router.refresh(); // Crucial to ensure the app state is completely reset.
        console.log("UserNav: Redirected to /login and refreshed router state.");
      } catch (clientSignOutError: any) {
        console.error('UserNav: Critical error during client-side signOut:', clientSignOutError);
        toast({ variant: "destructive", title: "Client Logout Failed", description: clientSignOutError.message });
        // Still force redirect even if client signout fails for some reason.
        router.push('/login');
        router.refresh();
      }
    }
  };

  if (!user) {
    return null;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
            <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center">
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="flex items-center cursor-not-allowed">
            <Settings className="mr-2 h-4 w-4" />
            Settings
            <span className="ml-auto text-xs text-muted-foreground">(Soon)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## src/components/players/PlayerForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { PlayerFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createPlayer } from "@/app/players/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const playerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  jerseyNumber: z.coerce.number().optional().nullable(),
  position: z.string().optional().nullable(),
});

interface PlayerFormProps {
  teamId: string;
  clubId: string;
  onFormSubmit: () => void;
}

export function PlayerForm({ teamId, clubId, onFormSubmit }: PlayerFormProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof playerFormSchema>>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      jerseyNumber: undefined,
      position: "",
    },
  });

  async function onSubmit(values: z.infer<typeof playerFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to add a player." });
      return;
    }

    const playerData: PlayerFormData = { ...values };

    const result = await createPlayer(playerData, teamId, clubId, user.uid);

    if (result.success) {
      toast({
        title: "Player Added",
        description: `Player "${values.firstName} ${values.lastName}" has been successfully added.`,
      });
      form.reset(); // Clear form fields
      onFormSubmit(); // Callback to refresh parent data
    } else {
      toast({
        variant: "destructive",
        title: "Failed to Add Player",
        description: result.error || "An unexpected error occurred.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Lionel" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Messi" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="jerseyNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Jersey Number (Optional)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 10" {...field} onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)} value={field.value ?? ''}/>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Position (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Forward" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Player...
            </>
          ) : (
            "Add Player"
          )}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/tasks/TaskForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Task, TaskFormData } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createTask, updateTask } from "@/app/tasks/actions";
import { useAuth } from "@/hooks/useAuth";

const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().optional(),
  status: z.enum(["todo", "inprogress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional().nullable(), // Date as string from input type="date"
});

interface TaskFormProps {
  task?: Task; // Optional: for editing existing task
  onFormSubmit?: () => void; // Optional callback after submission
}

// Helper to convert JS Date to yyyy-MM-dd string
const formatDateForInput = (date?: Date | null): string => {
  if (!date) return "";
  return date.toISOString().split('T')[0];
};

export function TaskForm({ task, onFormSubmit }: TaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "todo",
      priority: task?.priority || "medium",
      dueDate: task ? formatDateForInput(task.dueDate) : "",
    },
  });

  async function onSubmit(values: z.infer<typeof taskFormSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }

    const taskData: TaskFormData = {
      ...values,
      dueDate: values.dueDate || null, // Ensure null if empty string
    };

    let result;
    if (task) {
      result = await updateTask(task.id, taskData, user.uid);
    } else {
      result = await createTask(taskData, user.uid);
    }

    if (result.success) {
      toast({
        title: task ? "Task Updated" : "Task Created",
        description: `Task "${values.title}" has been successfully ${task ? 'updated' : 'created'}.`,
      });
      if (onFormSubmit) {
        onFormSubmit();
      } else {
        // If it's a new task and an ID is returned, navigate to its detail page (optional)
        if(!task && result.id) {
          // router.push(`/tasks/${result.id}`); 
          // For now, just go back to tasks list to keep it simple
          router.push("/tasks");
        } else {
          router.push("/tasks");
        }
      }
      router.refresh(); // Revalidate data on the tasks page
    } else {
      toast({
        variant: "destructive",
        title: task ? "Update Failed" : "Creation Failed",
        description: result.error || "An unexpected error occurred.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter task description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="inprogress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date (Optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (task ? "Updating..." : "Creating...") : (task ? "Update Task" : "Create Task")}
        </Button>
        {task && (
            <Button type="button" variant="outline" onClick={() => router.back()} className="ml-2">
                Cancel
            </Button>
        )}
      </form>
    </Form>
  );
}
```

---

## src/components/tasks/TasksList.tsx
```tsx
"use client";

import type { Task } from "@/types";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, PlusCircle, AlertTriangle, ListFilter, CalendarDays } from "lucide-react";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { deleteTask } from "@/app/tasks/actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation"; // Corrected import for App Router
import { format } from "date-fns";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TasksListProps {
  tasks: Task[];
}

const statusColors: Record<Task['status'], string> = {
  todo: "border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
  inprogress: "border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100",
  done: "border-green-400 bg-green-50 text-green-700 hover:bg-green-100",
};

const priorityText: Record<Task['priority'], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const formatDate = (date?: Date | null) => {
  if (!date) return 'N/A';
  return format(date, 'MMM d, yyyy');
};

export function TasksList({ tasks }: TasksListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Task['status'] | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | "all">("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)); // Sort by creation date
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const handleDelete = async (taskId: string, taskTitle: string) => {
    if (!user) {
        toast({variant: "destructive", title: "Error", description: "You must be logged in."});
        return;
    }
    const result = await deleteTask(taskId, user.uid);
    if (result.success) {
      toast({ title: "Task Deleted", description: `Task "${taskTitle}" has been deleted.` });
      router.refresh(); // Re-fetch tasks by refreshing the page server-side data
    } else {
      toast({ variant: "destructive", title: "Deletion Failed", description: result.error });
    }
  };

  if (tasks.length === 0 && searchTerm === "" && statusFilter === "all" && priorityFilter === "all") {
    return (
      <div className="text-center py-10">
        <ListFilter className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No tasks yet!</h2>
        <p className="text-muted-foreground mb-4">Get started by creating your first task.</p>
        <Button asChild>
          <Link href="/tasks/new"><PlusCircle className="mr-2 h-4 w-4" /> Create Task</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-2xl font-headline">Task Filters</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Input 
                placeholder="Search tasks..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-auto"
              />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Task['status'] | "all")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="inprogress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as Task['priority'] | "all")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No tasks match your filters.</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between ${statusColors[task.status]}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold mb-1 text-primary-foreground group-hover:text-primary transition-colors">
                     <Link href={`/tasks/${task.id}`} className="hover:underline">{task.title}</Link>
                  </CardTitle>
                  <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'} className="capitalize shrink-0">
                    {priorityText[task.priority]}
                  </Badge>
                </div>
                {task.description && <CardDescription className="text-sm text-foreground/80 line-clamp-2">{task.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="text-xs text-muted-foreground flex items-center">
                   <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                   Due: {formatDate(task.dueDate)}
                 </div>
                 <div className="text-xs text-muted-foreground mt-1">
                   Created: {formatDate(task.createdAt)}
                 </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/tasks/${task.id}`}><Eye className="mr-1 h-4 w-4" /> View</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/tasks/${task.id}/edit`}><Edit className="mr-1 h-4 w-4" /> Edit</Link>
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the task "{task.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(task.id, task.title)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## src/components/teams/TeamForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TeamFormData, GameFormat, CompetitionCategory } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createTeam } from "@/app/teams/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Using a unique string to represent a null selection in the form,
// and then transforming it to actual null for data processing.
const NULL_VALUE = "__NULL__";

const teamFormSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters long.").max(100, "Team name must be 100 characters or less."),
  gameFormatId: z.string().optional().nullable()
    .transform(value => value === NULL_VALUE ? null : value),
  competitionCategoryId: z.string().min(1, "Competition Category is required.").nullable()
    .transform(value => value === NULL_VALUE ? null : value),
  coachIds: z.string().optional().describe("Comma-separated User IDs of coaches"),
  coordinatorIds: z.string().optional().describe("Comma-separated User IDs of coordinators"),
  playerIds: z.string().optional().describe("Comma-separated Player IDs"),
  logoUrl: z.string().url({ message: "Please enter a valid URL for the logo." }).optional().or(z.literal("")).nullable(),
  city: z.string().optional().nullable(),
});

interface TeamFormProps {
  clubId: string;
  gameFormats: GameFormat[];
  competitionCategories: CompetitionCategory[];
  onFormSubmit?: () => void;
}

export function TeamForm({ clubId, gameFormats, competitionCategories, onFormSubmit }: TeamFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      gameFormatId: null,
      competitionCategoryId: null,
      coachIds: "",
      coordinatorIds: "",
      playerIds: "",
      logoUrl: "",
      city: "",
    },
  });

  const { watch, setValue } = form;
  const selectedCompetitionId = watch("competitionCategoryId");

  useEffect(() => {
    if (selectedCompetitionId) {
      const category = competitionCategories.find(c => c.id === selectedCompetitionId);
      if (category && category.gameFormatId) {
        setValue("gameFormatId", category.gameFormatId, { shouldValidate: true });
      } else {
        setValue("gameFormatId", null, { shouldValidate: true });
      }
    }
  }, [selectedCompetitionId, competitionCategories, setValue]);

  async function onSubmit(values: z.infer<typeof teamFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a team." });
      return;
    }

    const teamData: TeamFormData = { ...values };

    const result = await createTeam(teamData, clubId, user.uid);

    if (result.success) {
      toast({
        title: "Team Created",
        description: `Team "${values.name}" has been successfully created.`,
      });
      form.reset(); // Clear form fields on success
      if (onFormSubmit) {
        onFormSubmit(); // Callback to refresh parent data
      } else {
        // Fallback if no callback is provided
        router.push(`/clubs/${clubId}`);
        router.refresh(); 
      }
    } else {
      toast({
        variant: "destructive",
        title: "Team Creation Failed",
        description: result.error || "An unexpected error occurred.",
      });
    }
  }
  
  const selectedGameFormatName = gameFormats.find(f => f.id === watch("gameFormatId"))?.name;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user data...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter team name (e.g., U12 Eagles)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="competitionCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Competition Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || undefined}
                disabled={competitionCategories.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={competitionCategories.length === 0 ? "No categories available" : "Select a category"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {competitionCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel>Game Format</FormLabel>
          <FormControl>
              <Input 
                value={selectedGameFormatName || "Automatically selected based on category"} 
                disabled 
              />
          </FormControl>
           <FormDescription>
            The game format is determined by the selected competition category.
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Team's primary city" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL (Optional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/logo.png" {...field} value={field.value ?? ""}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="coachIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coach IDs (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter comma-separated User IDs of coaches" {...field} />
              </FormControl>
              <FormDescription>
                Enter the Firebase User IDs for each coach, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coordinatorIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coordinator IDs (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter comma-separated User IDs of coordinators" {...field} />
              </FormControl>
              <FormDescription>
                Enter the Firebase User IDs for each coordinator, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="playerIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player IDs (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter comma-separated Player IDs" {...field} />
              </FormControl>
              <FormDescription>
                Enter the unique Player IDs, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Team...
            </>
          ) : (
            "Create Team"
          )}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/ui/accordion.tsx
```tsx
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```

---

## src/components/ui/alert-dialog.tsx
```tsx
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

---

## src/components/ui/alert.tsx
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
```

---

## src/components/ui/avatar.tsx
```tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
```

---

## src/components/ui/badge.tsx
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

---

## src/components/ui/button.tsx
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---

## src/components/ui/calendar.tsx
```tsx
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
```

---

## src/components/ui/card.tsx
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

---

## src/components/ui/chart.tsx
```tsx
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
```

---

## src/components/ui/checkbox.tsx
```tsx
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
```

---

## src/components/ui/dialog.tsx
```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

---

## src/components/ui/dropdown-menu.tsx
```tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
```

---

## src/components/ui/form.tsx
```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
```

---

## src/components/ui/input.tsx
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

---

## src/components/ui/label.tsx
```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

---

## src/components/ui/menubar.tsx
```tsx
"use client"

import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
```

---

## src/components/ui/popover.tsx
```tsx
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
```

---

## src/components/ui/progress.tsx
```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

---

## src/components/ui/radio-group.tsx
```tsx
"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
```

---

## src/components/ui/scroll-area.tsx
```tsx
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
```

---

## src/components/ui/select.tsx
```tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:-translate-y-1",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
```

---

## src/components/ui/separator.tsx
```tsx
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
```

---

## src/components/ui/sheet.tsx
```tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
```

---

## src/components/ui/sidebar.tsx
```tsx
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
```

---

## src/components/ui/skeleton.tsx
```tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

---

## src/components/ui/slider.tsx
```tsx
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
```

---

## src/components/ui/switch.tsx
```tsx
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

---

## src/components/ui/table.tsx
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

---

## src/components/ui/tabs.tsx
```tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

---

## src/components/ui/textarea.tsx
```tsx
import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
```

---

## src/components/ui/toast.tsx
```tsx
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

---

## src/components/ui/toaster.tsx
```tsx
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

---

## src/components/ui/tooltip.tsx
```tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

---

## src/contexts/AuthContext.tsx
```tsx
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setUser(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    // Simple full-page loading skeleton
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center">
            <Skeleton className="h-8 w-32" />
            <div className="ml-auto flex items-center space-x-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }
  

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
```

---

## src/hooks/use-mobile.tsx
```tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

---

## src/hooks/use-toast.ts
```ts
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

---

## src/hooks/useAuth.ts
```ts
"use client";
import { useAuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};
```

---

## src/lib/bcsjdApi.ts
```ts
import type { BcsjdApiDataItem } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BCSJD_API_BASE_URL || "https://api.bcsjd.example.com/v1";
// API Key should ideally be used server-side only. If needed client-side, ensure it's safe.
// const API_KEY = process.env.BCSJD_API_KEY; // For server-side
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_BCSJD_API_KEY; // If a public key is used client-side

interface FetchOptions extends RequestInit {
  // Add any custom options if needed
}

async function fetchFromBcsjdApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add API key to headers if available and configured for client-side use
  if (PUBLIC_API_KEY) {
    // Assuming Bearer token, adjust if it's a custom header like 'X-API-Key'
    // headers['Authorization'] = `Bearer ${PUBLIC_API_KEY}`; 
     headers['X-API-Key'] = PUBLIC_API_KEY;
  }
  
  // If called from server action, you might use the server-only API_KEY
  // This example is more geared towards client-side or Next.js API routes calling this.

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = { message: response.statusText };
      }
      throw new Error(`API request failed with status ${response.status}: ${errorBody?.message || 'Unknown error'}`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`Error fetching from BCSJD API endpoint ${endpoint}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
}

// Example function to get some data items
export async function getBcsjdKeyMetrics(): Promise<BcsjdApiDataItem[]> {
  // Replace '/key-metrics' with your actual endpoint
  // This is a placeholder and might need adjustments based on real API structure
  try {
    const data = await fetchFromBcsjdApi<BcsjdApiDataItem[]>('/key-metrics');
    return data;
  } catch (error) {
    // Return some mock data or an empty array on error for graceful UI handling
    console.warn("BCSJD API fetch failed, returning mock data for UI purposes.");
    return [
      { id: 1, name: "Active Users (Mock)", value: Math.floor(Math.random() * 1000), category: "Engagement", lastUpdated: new Date().toISOString() },
      { id: 2, name: "Data Processed (Mock)", value: Math.floor(Math.random() * 10000) + " GB", category: "Operations", lastUpdated: new Date().toISOString() },
      { id: 3, name: "System Uptime (Mock)", value: "99.95%", category: "Reliability", lastUpdated: new Date().toISOString() },
    ];
  }
}

// Add more functions here to interact with other BCSJD API endpoints as needed.
// For example:
// export async function postBcsjdData(data: any): Promise<any> {
//   return fetchFromBcsjdApi('/submit-data', {
//     method: 'POST',
//     body: JSON.stringify(data),
//   });
// }
```

---

## src/lib/firebase/admin.ts
```ts
import admin from 'firebase-admin';

// This new exported variable will hold the specific initialization error.
export let adminInitError: string | null = null;

// This file is now only used in the Node.js runtime (API Routes).
// We ensure it's only initialized once.
if (!admin.apps.length) {
  // Diagnostic log to check if the environment variable is being read at all.
  const serviceAccountJsonString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  console.log(`Firebase Admin SDK: Checking for credentials. Found FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON variable of type '${typeof serviceAccountJsonString}' with length ${serviceAccountJsonString?.length ?? 0}.`);

  if (serviceAccountJsonString) {
    console.log('Firebase Admin SDK: Attempting to initialize using service account JSON...');
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      
      // Basic validation of the parsed service account object
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Parsed service account JSON is missing essential fields (project_id, private_key, client_email).');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK: Initialized successfully using service account JSON.');

    } catch (e: any) {
      // Store the specific error message
      adminInitError = `Could not initialize using FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. Error: ${e.message}`;
      // Use console.warn to avoid crashing the server in a loop
      console.warn(`Firebase Admin SDK: NON-FATAL FAILURE. ${adminInitError}`);
    }
  } else {
    // Store the specific error message
    adminInitError = 'FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable not found. This is required for local development.';
    console.warn(
      'Firebase Admin SDK: WARNING - ' + adminInitError +
      ' Attempting default initialization. This is expected in production on App Hosting.'
    );
    try {
        admin.initializeApp();
        console.log('Firebase Admin SDK: Default initialization successful.');
    } catch (e: any) {
        adminInitError = `Default initialization also failed. Error: ${e.message}`;
        // Use console.warn to avoid crashing the server in a loop
        console.warn(
          'Firebase Admin SDK: NON-FATAL FAILURE - ' + adminInitError
        );
    }
  }
}

// Export auth and firestore instances. They will be undefined if initialization failed.
const adminAuth = admin.apps.length ? admin.auth() : undefined;
const adminDb = admin.apps.length ? admin.firestore() : undefined;

if (!adminAuth || !adminDb) {
    // Update the error if it's still null but initialization failed for some other reason
    if (admin.apps.length === 0 && !adminInitError) {
        adminInitError = "Unknown error during Firebase Admin initialization.";
    }
    // Using console.warn instead of console.error to prevent the server process manager
    // from treating this as a fatal startup error and restarting the server in a loop.
    console.warn(`Firebase Admin SDK: WARNING - adminAuth or adminDb could not be exported because the SDK is not initialized. Error: ${adminInitError}`);
}

export { adminAuth, adminDb };
export default admin;
```

---

## src/lib/firebase/client.ts
```ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, browserSessionPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Persistence set to 'local' for "Remember me" functionality by default.
    // Can be changed to 'session' for session-only persistence or 'none'.
    auth.setPersistence(browserLocalPersistence); 
    db = getFirestore(app);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    // Fallback or dummy objects if initialization fails, or rethrow
    // This ensures the app doesn't crash on import if config is missing,
    // but features relying on Firebase will not work.
    app = {} as FirebaseApp; // Provide a dummy app object
    auth = {} as Auth; // Provide a dummy auth object
    db = {} as Firestore; // Provide a dummy db object
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
```

---

## src/lib/firebase/config.ts
```ts
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function checkConfig(config: Record<string, string | undefined>, prefix: string): void {
  const missingKeys = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => `${prefix}${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

  if (missingKeys.length > 0) {
    const message = `Warning: Firebase configuration is incomplete. Missing environment variables: ${missingKeys.join(', ')}. Please check your .env.local file.`;
    if (typeof window === 'undefined') { // Server-side
      console.warn(message);
    } else { // Client-side
      // Avoid logging verbose warnings in browser console during development if not critical for page load
      // but ensure developers are aware if core functionality might break.
      // For a real app, you might want to throw an error or show a UI message if essential config is missing.
      if (process.env.NODE_ENV === 'development') {
        console.warn(message);
      }
    }
  }
}

checkConfig(firebaseConfig, 'NEXT_PUBLIC_FIREBASE_');
```

---

## src/lib/utils.ts
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## src/middleware.ts
```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/reset-password'];

const isPublic = (path: string) => PUBLIC_PATHS.includes(path);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  // Bypass for internal Next.js assets and API routes which have their own logic
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // If the user has a session cookie and is trying to access a public-only page,
  // redirect them to the dashboard. This improves UX for logged-in users.
  // The actual cookie verification happens within the protected pages/layouts.
  if (sessionCookie && isPublic(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user does not have a session cookie and is trying to access a protected page,
  // redirect them to the login page.
  if (!sessionCookie && !isPublic(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // In all other cases (e.g., user with cookie on protected page, or user without cookie on public page),
  // allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## src/types/index.ts
```ts
import type { Timestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date | null; // Changed from Timestamp
  createdAt: Date; // Changed from Timestamp
  updatedAt: Date; // Changed from Timestamp
  userId: string; // To associate task with a user
}

// For forms, especially date handling, as Firestore Timestamps are not directly usable in HTML date inputs
export interface TaskFormData {
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null; // String for HTML date input, will be converted to Timestamp
}

export interface BcsjdApiDataItem {
  id: string | number;
  name: string;
  value: string | number;
  category: string;
  lastUpdated: string; // ISO date string
}

export type UserProfileStatus = 'pending_approval' | 'approved' | 'rejected';

export type ProfileType =
  | 'club_admin'
  | 'coach'
  | 'coordinator'
  | 'parent_guardian'
  | 'player'
  | 'scorer'
  | 'super_admin'
  | 'user';

export interface UserFirestoreProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  profileTypeId: ProfileType;
  clubId: string;
  status: UserProfileStatus;
  createdAt: Date; // Changed from Timestamp
  updatedAt: Date; // Changed from Timestamp
}

// ViewModel for admin user management page
export interface UserProfileAdminView extends UserFirestoreProfile {
  clubName?: string;
  profileTypeLabel?: string;
}

export interface Club {
  id: string;
  name: string;
  shortName?: string;
  province_code?: string;
  city_code?: string;
  province_name?: string;
  city_name?: string;
  logoUrl?: string;
  approved?: boolean;
  createdBy?: string; // UID
  createdAt?: Date; // Changed from Timestamp
}

export interface ClubFormData {
  name: string;
  shortName?: string;
  province_name?: string;
  city_name?: string;
  logoUrl?: string;
}

export interface ProfileTypeOption {
  id: ProfileType;
  label: string;
  description?: string;
  order?: number;
  assignableByUser?: boolean;
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  coachIds?: string[];
  coordinatorIds?: string[];
  gameFormatId?: string | null; // Refers to GameFormat.id
  competitionCategoryId?: string | null; // Refers to CompetitionCategory.id
  playerIds?: string[];
  logoUrl?: string | null;
  city?: string | null;
  createdAt: Date; // Changed from Timestamp
  updatedAt: Date; // Changed from Timestamp
  createdByUserId: string;
}

export interface TeamFormData {
  name: string;
  coachIds?: string; // Comma-separated string for form input
  coordinatorIds?: string;
  gameFormatId?: string | null;
  competitionCategoryId?: string | null;
  playerIds?: string; // Comma-separated string for form input
  logoUrl?: string | null;
  city?: string | null;
}

export interface GameFormat {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  numPeriods?: number;
  periodDurationMinutes?: number;
  defaultTotalTimeouts?: number;
  minPeriodsPlayerMustPlay?: number;
  createdAt?: Date; // Changed from Timestamp
}

export interface GameFormatFormData {
    name: string;
    description?: string;
    numPeriods?: number;
    periodDurationMinutes?: number;
    defaultTotalTimeouts?: number;
    minPeriodsPlayerMustPlay?: number;
}

export interface CompetitionCategory {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  level?: number;
  gameFormatId?: string | null; // The associated default game format
  createdAt?: Date; // Changed from Timestamp
  updatedAt?: Date; // Changed from Timestamp
}

export interface CompetitionCategoryFormData {
  name: string;
  description?: string;
  level?: number;
  gameFormatId?: string | null;
}


export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  teamId?: string;
  createdBy?: string; // UID
  createdAt?: Date; // Changed from Timestamp
}

export interface PlayerFormData {
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  position?: string | null;
}
```

---

## tailwind.config.ts
```ts
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-pt-sans)', 'sans-serif'],
        headline: ['var(--font-playfair-display)', 'serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

---

## tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```
