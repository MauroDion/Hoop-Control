
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getGamesByCoach, getAllGames, getGamesByClub, getGamesByParent } from '@/lib/actions/games';
import type { Game } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, BarChart2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AnalysisPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.push('/login?redirect=/analysis');
      return;
    }
    if (!profile) {
      setLoading(false);
      setError("No se pudo cargar el perfil de usuario.");
      return;
    }

    const loadPageData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!['coach', 'coordinator', 'club_admin', 'super_admin', 'parent_guardian'].includes(profile.profileTypeId!)) {
            throw new Error("Acceso Denegado. No tienes permisos para ver esta página.");
        }
        
        let fetchedGames: Game[] = [];
        if (profile.profileTypeId === 'super_admin') {
            fetchedGames = await getAllGames();
        } else if (['coordinator', 'club_admin'].includes(profile.profileTypeId!)) {
            fetchedGames = await getGamesByClub(profile.clubId || '');
        } else if (profile.profileTypeId === 'coach') {
            fetchedGames = await getGamesByCoach(user.uid);
        } else if (profile.profileTypeId === 'parent_guardian') {
            fetchedGames = await getGamesByParent(user.uid);
        }
        
        const completedGames = fetchedGames.filter(game => game.status === 'completed');
        completedGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setGames(completedGames);

      } catch (err: any) {
        console.error("Error loading analysis data:", err);
        setError("Error al cargar los datos de los partidos.");
      } finally {
        setLoading(false);
      }
    };
    loadPageData();
  }, [user, profile, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando análisis...</p>
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
    <div className="space-y-8">
       <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <BarChart2 className="mr-3 h-10 w-10" /> Análisis de Partidos
        </h1>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Partidos Completados</CardTitle>
          <CardDescription>
            Resultados y estadísticas de partidos finalizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {games.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Hay Partidos Completados</h2>
                <p className="text-muted-foreground">Aún no se ha completado ningún partido para analizar.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Enfrentamiento</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>{format(new Date(game.date), 'PPp', { locale: es })}</TableCell>
                      <TableCell className="font-medium">{game.homeTeamName} vs {game.awayTeamName}</TableCell>
                      <TableCell className="font-bold">{game.homeTeamScore ?? 0} - {game.awayTeamScore ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/analysis/${game.id}`}>
                            Ver Detalles
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
