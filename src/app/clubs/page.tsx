
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
import { Loader2, AlertTriangle, Building, PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';

export default function ManageClubsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/clubs');
      return;
    }

    const verifyAdminAndFetchData = async () => {
      try {
        const profile = await getUserProfileById(user.uid);
        if (profile?.profileTypeId !== 'super_admin') {
          setError('Access Denied. You must be a Super Admin to view this page.');
          setIsSuperAdmin(false);
          setLoading(false);
          return;
        }
        
        setIsSuperAdmin(true);
        const fetchedClubs = await getClubs();
        setClubs(fetchedClubs);

      } catch (err: any) {
        setError('Failed to load page data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAndFetchData();
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <Building className="mr-3 h-10 w-10" /> Manage Clubs
          </h1>
          <p className="text-lg text-muted-foreground mt-1">View, manage, and create teams for all clubs.</p>
        </div>
        <Button asChild>
          <Link href="/clubs/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Club
          </Link>
        </Button>
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
                         <Button asChild size="sm">
                            <Link href={`/clubs/${club.id}/teams/new`}>
                                <Users className="mr-2 h-4 w-4" /> Create Team
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
