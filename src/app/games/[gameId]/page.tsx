"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Actions
import { getGameById, updateGameRoster } from '@/app/games/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import { getTeamsByCoach, getTeamById } from '@/app/teams/actions';
import { getUserProfileById } from '@/app/users/actions';


// Types
import type { Game, Player, Team } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, ChevronLeft, Users, Save, ShieldCheck, Gamepad2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function ManageGamePage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';

    const [game, setGame] = useState<Game | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [managedTeam, setManagedTeam] = useState<Team | null>(null);
    const [isHomeTeam, setIsHomeTeam] = useState(false);
    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
    
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPageData = useCallback(async (userId: string) => {
        setLoadingData(true);
        setError(null);
        try {
            if (!gameId) {
                throw new Error("Falta el ID del partido en la URL.");
            }
            
            const [profile, gameData] = await Promise.all([
                getUserProfileById(userId),
                getGameById(gameId)
            ]);

            if (!profile) throw new Error("No se pudo encontrar tu perfil de usuario.");
            if (!gameData) throw new Error("Partido no encontrado.");
            setGame(gameData);
            
            const coachTeams = await getTeamsByCoach(userId);
            const isCoachOfHomeTeam = coachTeams.some(t => t.id === gameData.homeTeamId);
            const isCoachOfAwayTeam = coachTeams.some(t => t.id === gameData.awayTeamId);

            const isSuperAdmin = profile.profileTypeId === 'super_admin';
            const isClubAdminForGame = (profile.profileTypeId === 'club_admin' || profile.profileTypeId === 'coordinator') && (profile.clubId === gameData.homeTeamClubId || profile.clubId === gameData.awayTeamClubId);
            
            const hasPermission = isSuperAdmin || isClubAdminForGame || isCoachOfHomeTeam || isCoachOfAwayTeam;
            
            if (!hasPermission) {
                throw new Error("No tienes permiso para gestionar este partido.");
            }

            let teamToManageId: string | null = null;
            let isHome = false;

            if (isCoachOfHomeTeam) {
                teamToManageId = gameData.homeTeamId;
                isHome = true;
            } else if (isCoachOfAwayTeam) {
                teamToManageId = gameData.awayTeamId;
                isHome = false;
            } else if ((isSuperAdmin || isClubAdminForGame) && (profile.clubId === gameData.homeTeamClubId || isSuperAdmin)) {
                teamToManageId = gameData.homeTeamId;
                isHome = true;
            } else if (isClubAdminForGame && profile.clubId === gameData.awayTeamClubId) {
                 teamToManageId = gameData.awayTeamId;
                 isHome = false;
            }

            if (!teamToManageId) {
                if(isSuperAdmin) {
                    teamToManageId = gameData.homeTeamId;
                    isHome = true;
                } else {
                    throw new Error("No se pudo determinar qué equipo gestionar.");
                }
            }
            
            setIsHomeTeam(isHome);
            
            const teamToManage = await getTeamById(teamToManageId);
            if (!teamToManage) throw new Error("No se pudieron cargar los datos del equipo a gestionar.");
            setManagedTeam(teamToManage);
            
            const teamPlayers = await getPlayersByTeamId(teamToManageId);
            setPlayers(teamPlayers);
            
            const initialSelected = isHome ? gameData.homeTeamPlayerIds : gameData.awayTeamPlayerIds;
            setSelectedPlayers(new Set(initialSelected || []));

        } catch (err: any) {
            setError(err.message || "Error al cargar los datos del partido.");
        } finally {
            setLoadingData(false);
        }
    }, [gameId]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/games/${gameId}`);
            return;
        }
        loadPageData(user.uid);
    }, [gameId, user, authLoading, router, loadPageData]);
    
    const handlePlayerSelection = (playerId: string) => {
        setSelectedPlayers(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(playerId)) {
                newSelection.delete(playerId);
            } else {
                newSelection.add(playerId);
            }
            return newSelection;
        });
    };

    const handleSaveRoster = async () => {
        if (!game || !managedTeam) return;
        setSaving(true);
        const result = await updateGameRoster(game.id, Array.from(selectedPlayers), isHomeTeam);
        if (result.success) {
            toast({ title: "Convocatoria Guardada", description: "La lista de jugadores ha sido actualizada para este partido." });
        } else {
            toast({ variant: "destructive", title: "Error al Guardar", description: result.error });
        }
        setSaving(false);
    };

    if (authLoading || loadingData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Cargando datos del partido...</p>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button asChild variant="outline">
                    <Link href="/games">Volver a la Lista de Partidos</Link>
                </Button>
            </div>
        );
    }

    if (!game) {
        return null;
    }

    return (
        <div className="space-y-8">
            <Button variant="outline" size="sm" asChild>
                <Link href="/games">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver a la Lista de Partidos
                </Link>
            </Button>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline font-bold text-primary">
                       {game.homeTeamName} vs {game.awayTeamName}
                    </CardTitle>
                    <CardDescription className="text-lg">
                       {format(new Date(game.date), 'PPPP p', { locale: es })} en {game.location}
                    </CardDescription>
                </CardHeader>
            </Card>

            {['scheduled', 'inprogress'].includes(game.status) && (
                 <Card className="shadow-xl bg-green-50 border-green-200">
                    <CardHeader>
                        <CardTitle className="flex items-center text-green-800"><Gamepad2 className="mr-3 h-6 w-6"/>Panel de Partido en Vivo</CardTitle>
                        <CardDescription className="text-green-700">
                            {game.status === 'scheduled' ? 'La convocatoria está lista. Es hora de empezar el partido.' : 'El partido está en progreso. Ve al panel para continuar.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 w-full">
                            <Link href={`/games/${game.id}/live`}>
                                {game.status === 'scheduled' ? 'Empezar Partido y Registrar Puntuación' : 'Ir al Partido en Vivo'}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center"><ShieldCheck className="mr-3 h-6 w-6"/>Convocatoria para {managedTeam?.name}</CardTitle>
                    <CardDescription>
                        Selecciona los jugadores que participarán en este partido.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {players.length === 0 ? (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No hay Jugadores en la Plantilla</h2>
                            <p className="text-muted-foreground">Este equipo aún no tiene jugadores. Puedes añadirlos en la página de gestión del equipo.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {players.map(player => (
                                    <div key={player.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                                        <Checkbox 
                                            id={`player-${player.id}`}
                                            checked={selectedPlayers.has(player.id)}
                                            onCheckedChange={() => handlePlayerSelection(player.id)}
                                        />
                                        <Label htmlFor={`player-${player.id}`} className="cursor-pointer">
                                            {player.firstName} {player.lastName} (#{player.jerseyNumber || 'N/A'})
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleSaveRoster} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {saving ? 'Guardando...' : 'Guardar Convocatoria'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
