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
import { getUserProfileById, getUsersByProfileTypeAndClub } from "@/app/users/actions";
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
  const [coaches, setCoaches] = useState<UserFirestoreProfile[]>([]);
  const [coordinators, setCoordinators] = useState<UserFirestoreProfile[]>([]);
  
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
        const [profile, fetchedClub, formats, categories, fetchedCoaches, fetchedCoordinators] = await Promise.all([
          getUserProfileById(user.uid),
          getClubById(clubId),
          getGameFormats(),
          getCompetitionCategories(),
          getUsersByProfileTypeAndClub('coach', clubId),
          getUsersByProfileTypeAndClub('coordinator', clubId)
        ]);
        
        const isSuperAdmin = profile?.profileTypeId === 'super_admin';
        const isClubAdmin = profile?.profileTypeId === 'club_admin' && profile.clubId === clubId;
        const isCoordinator = profile?.profileTypeId === 'coordinator' && profile.clubId === clubId;

        if (!isSuperAdmin && !isClubAdmin && !isCoordinator) {
            setError("Access Denied. You must be an admin or coordinator for this club to create teams.");
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
        setCoaches(fetchedCoaches);
        setCoordinators(fetchedCoordinators);

      } catch (err: any) {
        console.error("Error loading new team page data:", err)
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
            coaches={coaches}
            coordinators={coordinators}
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
