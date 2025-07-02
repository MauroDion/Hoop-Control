"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { getGameById } from '@/app/games/actions';
import type { Game } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, AlertTriangle, ChevronLeft, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function GameAnalysisPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const gameId = typeof params.gameId === 'string' ? params.gameId : '';
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=/analysis/${gameId}`);
      return;
    }

    async function fetchGame() {
      setLoading(true);
      setError(null);
      try {
        const fetchedGame = await getGameById(gameId);
        if (fetchedGame && fetchedGame.status === 'completed') {
          setGame(fetchedGame);
        } else {
          setError("Partido no encontrado o no ha sido completado.");
        }
      } catch (err: any) {
        setError("Error al cargar los datos del partido.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchGame();
  }, [user, authLoading, router, gameId]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando análisis del partido...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild onClick={() => router.push('/analysis')} className="mt-4">
            <Link href="/analysis"><ChevronLeft className="h-4 w-4 mr-2"/>Volver a Análisis</Link>
        </Button>
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/analysis"><ChevronLeft className="mr-2 h-4 w-4" />Volver a la lista</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <BarChart2 className="mr-3 h-8 w-8 text-primary"/>
            Análisis: {game.homeTeamName} vs {game.awayTeamName}
          </CardTitle>
          <CardDescription>
            {format(new Date(game.date), 'PPPP', { locale: es })} - Resultado Final: {game.homeTeamScore} - {game.awayTeamScore}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Las estadísticas detalladas del partido se mostrarán aquí.</p>
          {/* Placeholder for future charts and stats */}
        </CardContent>
      </Card>
    </div>
  );
}
