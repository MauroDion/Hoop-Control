
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getSeasons } from '@/app/seasons/actions';
import { getUserProfileById } from '@/app/users/actions';
import type { Season } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Calendar, PlusCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';


export default function ManageSeasonsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAdminAndFetchData = async () => {
      setLoading(true);
      setError(null);
      if (!user) {
        router.replace('/login?redirect=/seasons');
        return;
      }

      try {
        const profile = await getUserProfileById(user.uid);
        if (profile?.profileTypeId !== 'super_admin') {
          setError('Access Denied. You must be a Super Admin to view this page.');
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(true);
          const fetchedSeasons = await getSeasons();
          setSeasons(fetchedSeasons);
        }
      } catch (err: any) {
        setError('Failed to load page data.');
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
          <Calendar className="mr-3 h-10 w-10" /> Manage Seasons
        </h1>
        <Button asChild>
          <Link href="/seasons/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Season
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>All Seasons</CardTitle>
          <CardDescription>
            Below is a list of all seasons in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {seasons.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Seasons Found</h2>
                <p className="text-muted-foreground">There are no seasons to display. Create one to get started.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Season Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasons.map((season) => (
                    <TableRow key={season.id}>
                      <TableCell className="font-medium">{season.name}</TableCell>
                      <TableCell>{format(season.startDate, 'PPP')}</TableCell>
                      <TableCell>{format(season.endDate, 'PPP')}</TableCell>
                      <TableCell>
                          <Badge variant={season.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                              {season.status}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <Button asChild size="sm" variant="outline">
                           <Link href={`/seasons/${season.id}`}>
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
