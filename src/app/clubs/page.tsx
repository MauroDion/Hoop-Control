"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfileById } from '@/lib/actions/users';
import { getApprovedClubs, updateClubStatus } from '@/lib/actions/clubs';
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
