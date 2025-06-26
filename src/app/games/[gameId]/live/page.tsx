
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateLiveGameState, recordGameEvent, substitutePlayer } from '@/app/games/actions';
import { getGameFormatById } from '@/app/game-formats/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import type { Game, GameFormat, TeamStats, Player, GameEventAction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ChevronLeft, Gamepad2, Minus, Plus, Play, Flag, Pause, TimerReset, FastForward, Timer as TimerIcon, CheckCircle, Ban, Users, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const StatButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="outline" size="sm" {...props}>{children}</Button>
);

const ShotButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
    <Button className="w-full" {...props}>{children}</Button>
);

const PlayerListItem = ({ player, onClick, isSelected }: { player: Player, onClick: () => void, isSelected: boolean }) => (
    <Button
        variant={isSelected ? "default" : "ghost"}
        className="w-full justify-start h-auto p-2"
        onClick={onClick}
    >
        <div className="flex items-center gap-2">
            <div className="bg-primary/20 text-primary font-bold rounded-full h-8 w-8 flex items-center justify-center text-sm">
                {player.jerseyNumber || 'S/N'}
            </div>
            <span className="truncate">{player.firstName} {player.lastName}</span>
        </div>
    </Button>
);

export default function LiveGamePage() {
    const params = useParams();
    const { toast } = useToast();
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const { user, loading: authLoading } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [gameFormat, setGameFormat] = useState<GameFormat | null>(null);
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);

    const [displayTime, setDisplayTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [localTimer, setLocalTimer] = useState<NodeJS.Timeout | null>(null);

    const [playerToSubIn, setPlayerToSubIn] = useState<Player | null>(null);
    const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);

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
                const gameData = { id: docSnap.id, ...data, date: (data.date as any).toDate() } as Game;
                setGame(gameData);
                
                setDisplayTime(gameData.periodTimeRemainingSeconds ?? 0);

                if (!gameFormat && gameData.gameFormatId) {
                    const format = await getGameFormatById(gameData.gameFormatId);
                    setGameFormat(format);
                }

                if (homePlayers.length === 0 && gameData.homeTeamId) {
                    getPlayersByTeamId(gameData.homeTeamId).then(setHomePlayers);
                }
                 if (awayPlayers.length === 0 && gameData.awayTeamId) {
                    getPlayersByTeamId(gameData.awayTeamId).then(setAwayPlayers);
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
    }, [gameId, gameFormat, homePlayers.length, awayPlayers.length]);
    
    useEffect(() => {
       if (localTimer) {
           clearInterval(localTimer);
           setLocalTimer(null);
       }
       if (game?.isTimerRunning && displayTime > 0) {
           const timerId = setInterval(() => {
               setDisplayTime(prev => prev > 0 ? prev - 1 : 0);
           }, 1000);
           setLocalTimer(timerId);
       }
       return () => {
           if (localTimer) clearInterval(localTimer);
       };
    }, [game?.isTimerRunning, displayTime]);

    const handleUpdate = useCallback(async (updates: Partial<Game>) => {
        const result = await updateLiveGameState(gameId, updates);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error al Actualizar', description: result.error });
        }
    }, [gameId, toast]);

    const handleToggleTimer = useCallback(() => {
        if (!game) return;
        handleUpdate({ isTimerRunning: !game.isTimerRunning, periodTimeRemainingSeconds: displayTime });
    }, [game, displayTime, handleUpdate]);

    const handleGameEvent = async (teamId: 'home' | 'away', playerId: string, playerName: string, action: GameEventAction) => {
        if (!game || game.status !== 'inprogress') return;
        await recordGameEvent(gameId, { teamId, playerId, playerName, action, period: game.currentPeriod || 1, gameTimeSeconds: displayTime });
    };

    const handleSubstitution = async (playerOutId: string) => {
        if (!game || !playerToSubIn) return;
        setIsSubDialogOpen(false);

        const teamId = homePlayers.some(p => p.id === playerToSubIn.id) ? 'home' : 'away';
        
        const result = await substitutePlayer(gameId, teamId, playerToSubIn.id, playerOutId);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error de Sustitución', description: result.error });
        }
        setPlayerToSubIn(null);
    }
    
    const openSubDialog = (player: Player) => {
        setPlayerToSubIn(player);
        setIsSubDialogOpen(true);
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    if (loading || authLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    if (error) return <div className="text-center p-6"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl text-destructive">Error</h1><p>{error}</p></div>;
    if (!game) return null;

    const TeamPanel = ({ teamType, playersList }: { teamType: 'home' | 'away', playersList: Player[] }) => {
        const teamName = teamType === 'home' ? game.homeTeamName : game.awayTeamName;
        const onCourtIds = new Set(teamType === 'home' ? game.homeTeamOnCourtPlayerIds : game.awayTeamOnCourtPlayerIds);
        
        const onCourtPlayers = playersList.filter(p => onCourtIds.has(p.id));
        const onBenchPlayers = playersList.filter(p => !onCourtIds.has(p.id));

        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="truncate">{teamName}</CardTitle>
                    <CardDescription>Equipo {teamType === 'home' ? 'Local' : 'Visitante'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-8xl font-bold text-primary text-center">{teamType === 'home' ? game.homeTeamScore : game.awayTeamScore}</div>
                    
                    <Separator/>
                    <h4 className="font-semibold text-center">Jugadores en Pista</h4>
                    <div className="grid grid-cols-1 gap-1">
                        {onCourtPlayers.length > 0 ? onCourtPlayers.map(p => (
                            <PlayerListItem key={p.id} player={p} onClick={() => {}} isSelected={false}/>
                        )) : <p className="text-sm text-muted-foreground text-center italic">Sin jugadores en pista</p>}
                    </div>

                    <Separator/>
                    <h4 className="font-semibold text-center">Banquillo</h4>
                    <div className="grid grid-cols-1 gap-1">
                       {onBenchPlayers.length > 0 ? onBenchPlayers.map(p => (
                           <PlayerListItem key={p.id} player={p} onClick={() => openSubDialog(p)} isSelected={playerToSubIn?.id === p.id}/>
                       )) : <p className="text-sm text-muted-foreground text-center italic">Banquillo vacío</p>}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <Dialog open={isSubDialogOpen} onOpenChange={setIsSubDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Realizar Sustitución</DialogTitle>
                        <DialogDescription>
                            Selecciona el jugador que sale de la pista para que entre {playerToSubIn?.firstName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-2 pt-4">
                        {(homePlayers.some(p => p.id === playerToSubIn?.id) ? homePlayers : awayPlayers)
                            .filter(p => (game[homePlayers.some(hp => hp.id === p.id) ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds'] || []).includes(p.id))
                            .map(player => (
                                <PlayerListItem key={player.id} player={player} onClick={() => handleSubstitution(player.id)} isSelected={false}/>
                            ))
                        }
                    </div>
                </DialogContent>
            </Dialog>

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
                             <Button onClick={() => handleUpdate({ periodTimeRemainingSeconds: displayTime - 60})} variant="ghost" size="icon" disabled={game.status !== 'inprogress' || game.isTimerRunning}><Minus/></Button>
                             <Button onClick={() => handleUpdate({ periodTimeRemainingSeconds: displayTime + 60})} variant="ghost" size="icon" disabled={game.status !== 'inprogress' || game.isTimerRunning}><Plus/></Button>
                             <Button onClick={handleNextPeriod} disabled={game.status !== 'inprogress' || game.isTimerRunning || (game.currentPeriod || 0) >= (gameFormat?.numPeriods || 4)} variant="outline" size="lg">
                                <FastForward className="mr-2"/> Siguiente Per.
                            </Button>
                             <Button onClick={handleResetTimer} disabled={game.status !== 'inprogress'} variant="secondary" size="icon" aria-label="Reiniciar cronómetro"><TimerReset/></Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TeamPanel teamType="home" playersList={homePlayers} />
                <TeamPanel teamType="away" playersList={awayPlayers} />
            </div>
        </div>
    )
}
