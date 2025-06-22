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
