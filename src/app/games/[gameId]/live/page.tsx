"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { 
    updateLiveGameState, 
    recordShot, 
    incrementGameStat,
    claimScoringRole,
    releaseScoringRole
} from '@/app/games/actions';
import { getGameFormatById } from '@/app/game-formats/actions';
import type { Game, GameFormat, TeamStats, StatCategory } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ChevronLeft, Gamepad2, Minus, Plus, Play, Flag, Pause, TimerReset, FastForward, Timer as TimerIcon, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const StatButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="outline" size="sm" {...props}>{children}</Button>
);

const ShotButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="secondary" className="w-full" {...props}>{children}</Button>
);

const statCategories: { id: StatCategory, label: string }[] = [
    { id: 'shots', label: 'Tiros' },
    { id: 'fouls', label: 'Faltas' },
    { id: 'timeouts', label: 'Tiempos Muertos' },
    { id: 'steals', label: 'Robos' },
];

export default function LiveGamePage() {
    const params = useParams();
    const { toast } = useToast();
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const { user, loading: authLoading } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [gameFormat, setGameFormat] = useState<GameFormat | null>(null);
    const [displayTime, setDisplayTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!gameId) {
            setError("ID del partido no encontrado.");
            setLoading(false);
            return;
        }
        const gameRef = doc(db, 'games', gameId);
        const unsubscribe = onSnapshot(gameRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const gameData = { id: docSnap.id, ...data, date: data.date.toDate().toISOString() } as Game;
                setGame(gameData);
                
                if (gameData.periodTimeRemainingSeconds !== undefined && !gameData.isTimerRunning) {
                    setDisplayTime(gameData.periodTimeRemainingSeconds);
                }

                if (!gameFormat && gameData.gameFormatId) {
                    const format = await getGameFormatById(gameData.gameFormatId);
                    setGameFormat(format);
                }
            } else {
                setError("El partido no existe o ha sido eliminado.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Error en el listener del partido:", err);
            setError("No se pudo conectar para recibir actualizaciones en tiempo real.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [gameId, gameFormat]);
    
    useEffect(() => {
       if (game?.isTimerRunning && displayTime > 0) {
           const timerId = setInterval(() => {
               setDisplayTime(prev => prev > 0 ? prev - 1 : 0);
           }, 1000);
           return () => clearInterval(timerId);
       }
    }, [game?.isTimerRunning, displayTime]);

    useEffect(() => {
        if (game?.periodTimeRemainingSeconds !== undefined) {
            setDisplayTime(game.periodTimeRemainingSeconds);
        }
    }, [game?.periodTimeRemainingSeconds]);

    const handleUpdate = useCallback(async (updates: Partial<Game>) => {
        const result = await updateLiveGameState(gameId, updates);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error al Actualizar', description: result.error });
        }
    }, [gameId, toast]);
    
    const handleToggleTimer = () => {
        if (!game) return;
        const newIsTimerRunning = !game.isTimerRunning;
        const updates: Partial<Game> = { isTimerRunning: newIsTimerRunning };
        if (!newIsTimerRunning) {
             updates.periodTimeRemainingSeconds = displayTime;
        }
        handleUpdate(updates);
    };

    const handleClaimRole = async (role: StatCategory) => {
        if (!user || !user.displayName) return;
        const result = await claimScoringRole(gameId, role, user.uid, user.displayName);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error al Reclamar Rol', description: result.error });
        }
    }

    const handleReleaseRole = async (role: StatCategory) => {
        if (!user) return;
        const result = await releaseScoringRole(gameId, role, user.uid);
         if (!result.success) {
            toast({ variant: 'destructive', title: 'Error al Liberar Rol', description: result.error });
        }
    }

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleRecordShot = async (team: 'home' | 'away', points: 1 | 2 | 3, type: 'made' | 'miss') => {
        if (!game || game.status !== 'inprogress') return;
        const result = await recordShot(gameId, team, points, type);
        if (!result.success) {
             toast({ variant: 'destructive', title: 'Error al registrar tiro', description: result.error });
        }
    };

    const handleIncrementStat = async (team: 'home' | 'away', stat: 'fouls' | 'timeouts' | 'steals', value: number) => {
         if (!game || game.status !== 'inprogress') return;
         const result = await incrementGameStat(gameId, team, stat, value);
         if (!result.success) {
             toast({ variant: 'destructive', title: `Error al registrar ${stat}`, description: result.error });
        }
    };

    const handleNextPeriod = () => {
        if (!game || !gameFormat) return;
        const currentPeriod = game.currentPeriod || 1;
        const maxPeriods = gameFormat.numPeriods || 4;
        if (currentPeriod < maxPeriods) {
            handleUpdate({
                currentPeriod: currentPeriod + 1,
                isTimerRunning: false,
                periodTimeRemainingSeconds: (gameFormat.periodDurationMinutes || 10) * 60,
            });
        }
    };

    const handleResetTimer = () => {
        if (!game || !gameFormat) return;
        handleUpdate({
            isTimerRunning: false,
            periodTimeRemainingSeconds: (gameFormat.periodDurationMinutes || 10) * 60,
        });
    };
    
    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Cargando datos del partido en vivo...</p>
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
                    <Link href={`/games/${gameId}`}>Volver a detalles del partido</Link>
                </Button>
            </div>
        );
    }
    
    if (!game) return null;

    const TeamPanel = ({ teamType, canScoreShots, canScoreStats }: { teamType: 'home' | 'away', canScoreShots: boolean, canScoreStats: boolean }) => {
        const teamName = teamType === 'home' ? game.homeTeamName : game.awayTeamName;
        const teamStats = (teamType === 'home' ? game.homeTeamStats : game.awayTeamStats) || {} as TeamStats;
        const score = teamType === 'home' ? game.homeTeamScore : game.awayTeamScore;

        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="truncate">{teamName}</CardTitle>
                    <CardDescription>Equipo {teamType === 'home' ? 'Local' : 'Visitante'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-8xl font-bold text-primary text-center">{score ?? 0}</div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                        <h4 className="font-medium text-center">Registro de Tiros</h4>
                        <div className="grid grid-cols-2 gap-2">
                           <ShotButton disabled={!canScoreShots} onClick={() => handleRecordShot(teamType, 1, 'made')}>+1 Pto</ShotButton>
                           <ShotButton disabled={!canScoreShots} variant="destructive" onClick={() => handleRecordShot(teamType, 1, 'miss')}>Fallo 1 Pto</ShotButton>
                           <ShotButton disabled={!canScoreShots} onClick={() => handleRecordShot(teamType, 2, 'made')}>+2 Ptos</ShotButton>
                           <ShotButton disabled={!canScoreShots} variant="destructive" onClick={() => handleRecordShot(teamType, 2, 'miss')}>Fallo 2 Ptos</ShotButton>
                           <ShotButton disabled={!canScoreShots} onClick={() => handleRecordShot(teamType, 3, 'made')}>+3 Ptos</ShotButton>
                           <ShotButton disabled={!canScoreShots} variant="destructive" onClick={() => handleRecordShot(teamType, 3, 'miss')}>Fallo 3 Ptos</ShotButton>
                        </div>
                    </div>
                    
                    <Separator />

                    <div className="space-y-3">
                         <h4 className="font-medium text-center">Otras Estadísticas</h4>
                         <div className="flex justify-between items-center">
                            <span className="font-semibold">Faltas: {teamStats.fouls ?? 0}</span>
                            <div className="space-x-1">
                                <StatButton disabled={!canScoreStats} size="icon" onClick={() => handleIncrementStat(teamType, 'fouls', 1)}><Plus/></StatButton>
                                <StatButton disabled={!canScoreStats} size="icon" onClick={() => handleIncrementStat(teamType, 'fouls', -1)}><Minus/></StatButton>
                            </div>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="font-semibold">T. Muertos: {teamStats.timeouts ?? 0}</span>
                             <div className="space-x-1">
                                <StatButton disabled={!canScoreStats} size="icon" onClick={() => handleIncrementStat(teamType, 'timeouts', 1)}><Plus/></StatButton>
                                <StatButton disabled={!canScoreStats} size="icon" onClick={() => handleIncrementStat(teamType, 'timeouts', -1)}><Minus/></StatButton>
                            </div>
                         </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Robos: {teamStats.steals ?? 0}</span>
                             <div className="space-x-1">
                                <StatButton disabled={!canScoreStats} size="icon" onClick={() => handleIncrementStat(teamType, 'steals', 1)}><Plus/></StatButton>
                                <StatButton disabled={!canScoreStats} size="icon" onClick={() => handleIncrementStat(teamType, 'steals', -1)}><Minus/></StatButton>
                            </div>
                         </div>
                    </div>
                </CardContent>
            </Card>
        )
    }
    
    const canScoreShots = game.scorerAssignments?.shots?.uid === user?.uid;
    const canScoreStats = game.scorerAssignments?.fouls?.uid === user?.uid &&
                          game.scorerAssignments?.timeouts?.uid === user?.uid &&
                          game.scorerAssignments?.steals?.uid === user?.uid;


    return (
        <div className="space-y-8">
             <Button variant="outline" size="sm" asChild>
                <Link href={`/games`}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver a la Lista de Partidos
                </Link>
            </Button>
            
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Control del Partido</CardTitle>
                </CardHeader>
                <CardContent>
                    {game.status === 'scheduled' && (
                        <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleUpdate({ status: 'inprogress', periodTimeRemainingSeconds: (gameFormat?.periodDurationMinutes || 10) * 60 })}>
                            <Play className="mr-2 h-5 w-5"/> Empezar Partido
                        </Button>
                    )}
                    {game.status === 'inprogress' && (
                        <Button size="lg" variant="destructive" className="w-full" onClick={() => handleUpdate({ status: 'completed', isTimerRunning: false })}>
                            <Flag className="mr-2 h-5 w-5"/> Finalizar Partido
                        </Button>
                    )}
                    {game.status === 'completed' && <p className="text-center font-bold text-lg text-green-700">Partido Finalizado</p>}
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader><CardTitle>Asignación de Anotadores</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCategories.map(role => {
                        const assignment = game.scorerAssignments?.[role.id];
                        const isAssignedToCurrentUser = assignment?.uid === user?.uid;
                        return (
                            <div key={role.id} className="p-4 border rounded-lg flex flex-col items-center justify-center text-center">
                                <h4 className="font-semibold">{role.label}</h4>
                                {assignment ? (
                                    <>
                                        <p className="text-sm text-muted-foreground mt-1">Asignado a:</p>
                                        <p className="font-bold">{isAssignedToCurrentUser ? "Ti" : assignment.displayName}</p>
                                        {isAssignedToCurrentUser && (
                                            <Button size="sm" variant="destructive" className="mt-2" onClick={() => handleReleaseRole(role.id)}>
                                                <UserX className="mr-2 h-4 w-4"/> Liberar Rol
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <Button size="sm" variant="default" className="mt-2" onClick={() => handleClaimRole(role.id)}>
                                        <UserCheck className="mr-2 h-4 w-4"/> Reclamar Rol
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>


            {game.status !== 'scheduled' && (
                 <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2"><TimerIcon/> Tiempo y Período</CardTitle>
                        <CardDescription>Período: {game.currentPeriod || 'N/A'} de {gameFormat?.numPeriods || 'N/A'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-8xl font-mono text-center tracking-tighter py-4 bg-secondary text-secondary-foreground rounded-lg">
                            {formatTime(displayTime)}
                        </div>
                        <div className="flex justify-center gap-2">
                            <Button onClick={handleToggleTimer} disabled={game.status !== 'inprogress'} size="lg">
                                {game.isTimerRunning ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                                {game.isTimerRunning ? 'Pausar' : 'Iniciar'}
                            </Button>
                             <Button onClick={handleNextPeriod} disabled={game.status !== 'inprogress' || game.isTimerRunning || (game.currentPeriod || 0) >= (gameFormat?.numPeriods || 4)} variant="outline" size="lg">
                                <FastForward className="mr-2"/> Siguiente Per.
                            </Button>
                             <Button onClick={handleResetTimer} disabled={game.status !== 'inprogress'} variant="secondary" size="icon" aria-label="Reiniciar cronómetro"><TimerReset/></Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TeamPanel teamType="home" canScoreShots={canScoreShots} canScoreStats={canScoreStats} />
                <TeamPanel teamType="away" canScoreShots={canScoreShots} canScoreStats={canScoreStats} />
            </div>
        </div>
    )
}
