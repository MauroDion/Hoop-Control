"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
import { Loader2, AlertTriangle, ChevronLeft, Users, Save, ShieldCheck, Gamepad2, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function areSetsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
        if (!b.has(item)) return false;
    }
    return true;
}

const RosterCard = ({ teamType, teamName, players, selectedPlayers, initialSelectedPlayers, onSelect, onSave, onSelectAll, onClearAll, isSaving, readOnly }: any) => {
    const hasChanges = !areSetsEqual(selectedPlayers, initialSelectedPlayers);

    return (
        <Card className="shadow-xl">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center"><ShieldCheck className="mr-3 h-6 w-6"/>Convocatoria para {teamName}</CardTitle>
                        <CardDescription>
                            Selecciona los jugadores que participarán en este partido.
                        </CardDescription>
                    </div>
                    {!readOnly && (
                        <div className="space-x-2">
                            <Button variant="outline" size="sm" onClick={() => onSelectAll(teamType)}><CheckSquare className="mr-2 h-4 w-4" />Seleccionar Todos</Button>
                            <Button variant="outline" size="sm" onClick={() => onClearAll(teamType)}><Square className="mr-2 h-4 w-4" />Limpiar Selección</Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {players.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold">No hay Jugadores en la Plantilla</h2>
                        <p className="text-muted-foreground">Añade jugadores en la página de gestión del equipo.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {players.map((player: Player) => (
                                <div key={player.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                                    <Checkbox
                                        id={`player-${teamType}-${player.id}`}
                                        checked={selectedPlayers.has(player.id)}
                                        onCheckedChange={() => onSelect(player.id, teamType)}
                                        disabled={readOnly}
                                    />
                                    <Label htmlFor={`player-${teamType}-${player.id}`} className="cursor-pointer">
                                        {player.firstName} {player.lastName} (#{player.jerseyNumber || 'S/N'})
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {!readOnly && (
                            <Button onClick={() => onSave(teamType)} disabled={isSaving || !hasChanges}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isSaving ? 'Guardando...' : `Guardar Convocatoria (${selectedPlayers.size})`}
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function ManageGamePage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';

    const [game, setGame] = useState<Game | null>(null);
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
    
    const [selectedHomePlayers, setSelectedHomePlayers] = useState<Set<string>>(new Set());
    const [selectedAwayPlayers, setSelectedAwayPlayers] = useState<Set<string>>(new Set());
    const [initialHomePlayers, setInitialHomePlayers] = useState<Set<string>>(new Set());
    const [initialAwayPlayers, setInitialAwayPlayers] = useState<Set<string>>(new Set());
    
    const [loadingData, setLoadingData] = useState(true);
    const [savingHome, setSavingHome] = useState(false);
    const [savingAway, setSavingAway] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [canManageHomeRoster, setCanManageHomeRoster] = useState(false);
    const [canManageAwayRoster, setCanManageAwayRoster] = useState(false);
    const [canAccessLiveGame, setCanAccessLiveGame] = useState(false);

    const loadPageData = useCallback(async (userId: string) => {
        setLoadingData(true);
        setError(null);
        try {
            if (!gameId) throw new Error("Falta el ID del partido en la URL.");
            
            const [profile, gameData] = await Promise.all([ getUserProfileById(userId), getGameById(gameId) ]);

            if (!profile) throw new Error("No se pudo encontrar tu perfil de usuario.");
            if (!gameData) throw new Error("Partido no encontrado.");
            
            const [homeTeamPlayers, awayTeamPlayers, coachTeams] = await Promise.all([
                getPlayersByTeamId(gameData.homeTeamId),
                getPlayersByTeamId(gameData.awayTeamId),
                getTeamsByCoach(userId)
            ]);

            const isCoachOfHomeTeam = coachTeams.some(t => t.id === gameData.homeTeamId);
            const isCoachOfAwayTeam = coachTeams.some(t => t.id === gameData.awayTeamId);

            const isSuperAdmin = profile.profileTypeId === 'super_admin';
            const isClubAdminForHome = (profile.profileTypeId === 'club_admin' || profile.profileTypeId === 'coordinator') && profile.clubId === gameData.homeTeamClubId;
            const isClubAdminForAway = (profile.profileTypeId === 'club_admin' || profile.profileTypeId === 'coordinator') && profile.clubId === gameData.awayTeamClubId;
            
            let isParentOfPlayerInGame = false;
            if (profile.profileTypeId === 'parent_guardian' && profile.children && profile.children.length > 0) {
                const childrenPlayerIds = new Set(profile.children.map(c => c.playerId));
                const allTeamPlayerIds = new Set([...homeTeamPlayers.map(p => p.id), ...awayTeamPlayers.map(p => p.id)]);
                for (const childPlayerId of childrenPlayerIds) {
                    if (allTeamPlayerIds.has(childPlayerId)) {
                        isParentOfPlayerInGame = true;
                        break;
                    }
                }
            }

            if (!isSuperAdmin && !isClubAdminForHome && !isClubAdminForAway && !isCoachOfHomeTeam && !isCoachOfAwayTeam && !isParentOfPlayerInGame) {
                throw new Error("No tienes permiso para ver este partido.");
            }
            
            setGame(gameData);
            setCanAccessLiveGame(isSuperAdmin || isClubAdminForHome || isClubAdminForAway || isCoachOfHomeTeam || isCoachOfAwayTeam || isParentOfPlayerInGame);
            setCanManageHomeRoster((isSuperAdmin || isClubAdminForHome || isCoachOfHomeTeam) && gameData.status === 'scheduled');
            setCanManageAwayRoster((isSuperAdmin || isClubAdminForAway || isCoachOfAwayTeam) && gameData.status === 'scheduled');

            setHomePlayers(homeTeamPlayers);
            setAwayPlayers(awayTeamPlayers);

            const initialHome = new Set(gameData.homeTeamPlayerIds || []);
            const initialAway = new Set(gameData.awayTeamPlayerIds || []);

            setSelectedHomePlayers(initialHome);
            setInitialHomePlayers(initialHome);
            setSelectedAwayPlayers(initialAway);
            setInitialAwayPlayers(initialAway);

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
    
    const handlePlayerSelection = (playerId: string, teamType: 'home' | 'away') => {
        const updater = teamType === 'home' ? setSelectedHomePlayers : setSelectedAwayPlayers;
        updater(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(playerId)) {
                newSelection.delete(playerId);
            } else {
                newSelection.add(playerId);
            }
            return newSelection;
        });
    };
    
    const handleSelectAll = (teamType: 'home' | 'away') => {
        if (teamType === 'home') {
            setSelectedHomePlayers(new Set(homePlayers.map(p => p.id)));
        } else {
            setSelectedAwayPlayers(new Set(awayPlayers.map(p => p.id)));
        }
    };

    const handleClearAll = (teamType: 'home' | 'away') => {
        if (teamType === 'home') {
            setSelectedHomePlayers(new Set());
        } else {
            setSelectedAwayPlayers(new Set());
        }
    };

    const handleSaveRoster = async (teamType: 'home' | 'away') => {
        if (!game) return;
        
        const setSaving = teamType === 'home' ? setSavingHome : setSavingAway;
        setSaving(true);

        const playerIds = teamType === 'home' ? selectedHomePlayers : selectedAwayPlayers;
        const isHomeTeam = teamType === 'home';

        const result = await updateGameRoster(game.id, Array.from(playerIds), isHomeTeam);
        if (result.success) {
            toast({ title: "Convocatoria Guardada", description: `La lista de jugadores ha sido actualizada.` });
             if (teamType === 'home') {
                setInitialHomePlayers(new Set(selectedHomePlayers));
            } else {
                setInitialAwayPlayers(new Set(selectedAwayPlayers));
            }
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

    if (!game) return null;

    const homeRosterCount = selectedHomePlayers.size;
    const awayRosterCount = selectedAwayPlayers.size;
    const canStartGame = homeRosterCount >= 5 && awayRosterCount >= 5;

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

            {canAccessLiveGame && ['scheduled', 'inprogress'].includes(game.status) && (
                 <Card className={`shadow-xl ${canStartGame ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <CardHeader>
                        <CardTitle className={`flex items-center ${canStartGame ? 'text-green-800' : 'text-yellow-800'}`}><Gamepad2 className="mr-3 h-6 w-6"/>Panel de Partido en Vivo</CardTitle>
                        <CardDescription className={canStartGame ? "text-green-700" : "text-yellow-700"}>
                            {canStartGame 
                                ? (game.status === 'scheduled' ? 'La convocatoria está lista. ¡Es hora de empezar el partido!' : 'El partido está en progreso. Ve al panel para continuar.')
                                : `Se necesitan al menos 5 jugadores en la convocatoria de cada equipo para empezar. Local: ${homeRosterCount}, Visitante: ${awayRosterCount}.`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 w-full" disabled={!canStartGame && game.status === 'scheduled'}>
                            <Link href={`/games/${game.id}/live`}>
                                {game.status === 'scheduled' ? 'Empezar Partido y Registrar Puntuación' : 'Ir al Partido en Vivo'}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            <RosterCard 
                teamType="home"
                teamName={game.homeTeamName}
                players={homePlayers}
                selectedPlayers={selectedHomePlayers}
                initialSelectedPlayers={initialHomePlayers}
                onSelect={handlePlayerSelection}
                onSave={handleSaveRoster}
                onSelectAll={handleSelectAll}
                onClearAll={handleClearAll}
                isSaving={savingHome}
                readOnly={!canManageHomeRoster}
            />

            <RosterCard 
                teamType="away"
                teamName={game.awayTeamName}
                players={awayPlayers}
                selectedPlayers={selectedAwayPlayers}
                initialSelectedPlayers={initialAwayPlayers}
                onSelect={handlePlayerSelection}
                onSave={handleSaveRoster}
                onSelectAll={handleSelectAll}
                onClearAll={handleClearAll}
                isSaving={savingAway}
                readOnly={!canManageAwayRoster}
            />
        </div>
    );
}