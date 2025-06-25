
"use client";

import { GameForm } from "@/components/games/GameForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Loader2, AlertTriangle, ChevronLeft } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
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
        const profile = await getUserProfileById(user.uid);
        setUserProfile(profile);

        if (!profile || !['coach', 'super_admin', 'coordinator', 'club_admin'].includes(profile.profileTypeId)) {
            setError("Acceso Denegado. Debes tener un rol de entrenador, coordinador o administrador para programar partidos.");
            setLoadingData(false);
            return;
        }

        const [fetchedAllTeams, formats, categories, fetchedSeasons, fetchedCoachTeams] = await Promise.all([
          getAllTeams(),
          getGameFormats(),
          getCompetitionCategories(),
          getSeasons(),
          profile.profileTypeId === 'coach' ? getTeamsByCoach(user.uid) : Promise.resolve([]),
        ]);

        const sortedTeams = fetchedAllTeams.sort((a,b) => a.name.localeCompare(b.name));
        setAllTeams(sortedTeams);
        setGameFormats(formats);
        setCompetitionCategories(categories);
        const sortedSeasons = fetchedSeasons.sort((a, b) => b.name.localeCompare(a.name));
        setSeasons(sortedSeasons.filter(s => s.status === 'active'));
        setCoachTeams(fetchedCoachTeams);

      } catch (err: any) {
        setError("Error al cargar los datos necesarios para programar un partido.");
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
        <p className="ml-4">Cargando programador de partidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Ir al Panel</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/games">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a la Lista de Partidos
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <CalendarClock className="mr-3 h-8 w-8 text-primary" />
            Programar Nuevo Partido
          </CardTitle>
          <CardDescription>Rellena los detalles a continuación para crear un nuevo partido.</CardDescription>
        </CardHeader>
        <CardContent>
          <GameForm 
            userProfile={userProfile}
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

    