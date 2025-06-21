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
import { Loader2, AlertTriangle, CalendarClock, PlusCircle, Shield } from 'lucide-react';
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>{format(game.date, 'PPp')}</TableCell>
                      <TableCell className="font-medium">{game.homeTeamName} vs {game.awayTeamName}</TableCell>
                      <TableCell>{game.location}</TableCell>
                      <TableCell className="capitalize">{game.status}</TableCell>
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
