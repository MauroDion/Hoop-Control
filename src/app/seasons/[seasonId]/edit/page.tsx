"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

import { getSeasonById } from '@/app/seasons/actions';
import { getAllTeams } from '@/app/teams/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';

import type { Season, Team, CompetitionCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Edit as EditIcon, ChevronLeft } from 'lucide-react';
import { SeasonForm } from '@/components/seasons/SeasonForm';

export default function EditSeasonPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const seasonId = typeof params.seasonId === 'string' ? params.seasonId : '';

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [season, setSeason] = useState<Season | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allCategories, setAllCategories] = useState<CompetitionCategory[]>([]);

  const fetchData = useCallback(async () => {
    if (!seasonId) {
        setError("Falta el ID de la temporada.");
        setLoadingData(false);
        return;
    }
    setLoadingData(true);
    setError(null);
    try {
      const [fetchedSeason, fetchedTeams, fetchedCategories] = await Promise.all([
        getSeasonById(seasonId),
        getAllTeams(),
        getCompetitionCategories()
      ]);
      
      if (!fetchedSeason) {
        throw new Error("No se encontró la temporada para editar.");
      }

      setSeason(fetchedSeason);
      setAllTeams(fetchedTeams);
      setAllCategories(fetchedCategories);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }, [seasonId]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/seasons');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  if (loadingData || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando datos de la temporada...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild onClick={() => router.push('/seasons')} className="mt-4">
            <Link href="/seasons"><ChevronLeft className="h-4 w-4 mr-2"/>Volver a Temporadas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="outline" size="sm" asChild>
            <Link href="/seasons">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver a la lista de temporadas
            </Link>
        </Button>
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-3xl font-headline flex items-center">
                    <EditIcon className="mr-3 h-8 w-8 text-primary"/>
                    Editar Temporada: {season?.name}
                </CardTitle>
                <CardDescription>
                    Modifica los detalles de la temporada, añade o elimina competiciones y ajusta los equipos participantes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <SeasonForm 
                    season={season}
                    allTeams={allTeams}
                    allCategories={allCategories}
                    onFormSubmit={() => {
                        router.push('/seasons');
                        router.refresh();
                    }}
                />
            </CardContent>
        </Card>
    </div>
  );
}
