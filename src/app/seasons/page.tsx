
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/app/users/actions';
import { getSeasons } from './actions';
import { getAllTeams } from '@/app/teams/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';

import type { Season, Team, CompetitionCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CalendarCheck, PlusCircle, ChevronsUpDown, Edit } from 'lucide-react';
import { SeasonForm } from '@/components/seasons/SeasonForm';
import Link from 'next/link';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';


export default function ManageSeasonsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allCategories, setAllCategories] = useState<CompetitionCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Autenticación requerida.");
      
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId !== 'super_admin') {
        throw new Error('Acceso Denegado. Debes ser Super Admin para ver esta página.');
      }
      setIsSuperAdmin(true);

      const [fetchedSeasons, fetchedTeams, fetchedCategories] = await Promise.all([
        getSeasons(),
        getAllTeams(),
        getCompetitionCategories()
      ]);
      setSeasons(fetchedSeasons);
      setAllTeams(fetchedTeams);
      setAllCategories(fetchedCategories);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/seasons');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  const getCategoryName = (id: string) => allCategories.find(c => c.id === id)?.name || id;

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando datos de temporadas...</p>
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
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Crear Nueva Temporada</DialogTitle>
            <DialogDescription>
              Define una nueva temporada y configura sus competiciones y equipos participantes.
            </DialogDescription>
          </DialogHeader>
          <SeasonForm 
            allTeams={allTeams}
            allCategories={allCategories}
            onFormSubmit={() => {
              setIsFormOpen(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <CalendarCheck className="mr-3 h-10 w-10" /> Gestionar Temporadas
        </h1>
        <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nueva Temporada
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Todas las Temporadas</CardTitle>
          <CardDescription>
            A continuación se muestra una lista de todas las temporadas del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {seasons.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No se Encontraron Temporadas</h2>
                <p className="text-muted-foreground">Crea una para empezar a programar partidos.</p>
            </div>
          ) : (
             <div className="space-y-4">
              {seasons.map((season) => (
                <Collapsible key={season.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-semibold">{season.name}</h3>
                      <Badge variant={season.status === 'active' ? 'default' : 'secondary'}>
                        {season.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                          <Link href={`/seasons/${season.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2"/>
                              Editar
                          </Link>
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                          <ChevronsUpDown className="h-4 w-4" />
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent className="space-y-3 pt-4">
                    {season.competitions?.map(comp => (
                      <div key={comp.competitionCategoryId} className="p-3 bg-muted/50 rounded-md">
                        <h4 className="font-medium">{getCategoryName(comp.competitionCategoryId)}</h4>
                        <p className="text-sm text-muted-foreground">{comp.teamIds.length} equipos participantes.</p>
                      </div>
                    ))}
                     {(!season.competitions || season.competitions.length === 0) && (
                       <p className="text-sm text-muted-foreground italic">Esta temporada no tiene competiciones configuradas.</p>
                     )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
