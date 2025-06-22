
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getClubs } from '@/app/clubs/actions';
import { getUserProfileById } from '@/app/users/actions';
import type { Club } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Building, PlusCircle, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ManageClubsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAdminAndFetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user) {
          setError("Authentication session has expired. Please log in again.");
          setIsSuperAdmin(false);
          router.replace('/login?redirect=/clubs');
          return;
        }

        console.log("ManageClubsPage: Verifying admin status for user:", user.uid);
        const profile = await getUserProfileById(user.uid);
        console.log("ManageClubsPage: Fetched profile:", profile);

        if (profile?.profileTypeId !== 'super_admin') {
          console.warn("ManageClubsPage: Access denied. User is not a super_admin.");
          setError('Access Denied. You must be a Super Admin to view this page.');
          setIsSuperAdmin(false);
          return;
        }
        
        console.log("ManageClubsPage: User is Super Admin. Fetching clubs.");
        setIsSuperAdmin(true);
        const fetchedClubs = await getClubs();
        console.log("ManageClubsPage: Fetched clubs:", fetchedClubs.length);
        setClubs(fetchedClubs);

      } catch (err: any) {
        console.error("ManageClubsPage: An error occurred:", err);
        setError('Failed to load page data. Check the console for more details.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      verifyAdminAndFetchData();
    }
  }, [user, authLoading, router]);

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
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <Building className="mr-3 h-10 w-10" /> Manage Clubs
        </h1>
        <Button asChild>
          <Link href="/clubs/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Club
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>All Clubs</CardTitle>
          <CardDescription>
            Below is a list of all clubs in the system. Select a club to manage its teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clubs.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Clubs Found</h2>
                <p className="text-muted-foreground">There are no clubs to display. Create one to get started.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Club Name</TableHead>
                    <TableHead>Short Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clubs.map((club) => (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell>{club.shortName || 'N/A'}</TableCell>
                      <TableCell>{club.city_name || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                         <Button asChild size="sm" variant="outline">
                            <Link href={`/clubs/${club.id}`}>
                                <Settings className="mr-2 h-4 w-4" /> Manage
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
