
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
    if (!user) return;
    setLoadingData(true);
    setError(null);
    try {
      const [fetchedProfiles, fetchedClubs, fetchedProfileTypes] = await Promise.all([
        getAllUserProfiles(),
        getApprovedClubs(),
        getProfileTypeOptions(),
      ]);
      
      setProfiles(fetchedProfiles);
      setClubs(fetchedClubs);
      setProfileTypes(fetchedProfileTypes);

    } catch (err: any) {
      console.error("Error fetching user management data:", err);
      setError(err.message || "Failed to load data. Check Firestore rules and server logs.");
      toast({ variant: "destructive", title: "Data Load Error", description: err.message || "Could not load necessary data." });
    } finally {
      setLoadingData(false);
    }
  };
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/admin/user-management');
      return;
    }

    setIsVerifyingAdmin(true);
    getUserProfileById(user.uid)
      .then(profile => {
        if (profile && profile.profileTypeId === 'super_admin') {
          setIsAdmin(true);
          fetchPageData(); // Fetch data only if admin
        } else {
          setIsAdmin(false);
          setError("Access Denied. You must be a Super Admin to view this page.");
        }
      })
      .catch(err => {
        console.error("Error verifying admin status:", err);
        setError("Could not verify admin status.");
        setIsAdmin(false);
      })
      .finally(() => {
        setIsVerifyingAdmin(false);
        // setLoadingData(false) should be handled by fetchPageData if it's called
        if(!isAdmin) setLoadingData(false);
      });
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
                      <TableCell>{format(profile.createdAt.toDate(), 'PPpp')}</TableCell>
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
