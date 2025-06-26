"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateLiveGameState, recordGameEvent, substitutePlayer, getPlayerStatsForGame } from '@/app/games/actions';
import { getGameFormatById } from '@/app/game-formats/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import type { Game, GameFormat, Player, GameEventAction, PlayerGameStats } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ChevronLeft, Gamepad2, Minus, Plus, Play, Flag, Pause, TimerReset, FastForward, Timer as TimerIcon, CheckCircle, Ban, Users, Dribbble } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

const PlayerStatCard = ({ player, stats, onClick }: { player: Player; stats: PlayerGameStats; onClick: () => void }) => {
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <Card onClick={onClick} className="p-2 relative aspect-[3/4] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer bg-card">
            {/* Points */}
            <div className="absolute top-2 left-2 text-lg font-bold text-green-600 bg-white/80 rounded-full h-8 w-8 flex items-center justify-center backdrop-blur-sm z-10 shadow-md">
                {stats.points}
            </div>

            {/* Fouls */}
            {stats.fouls > 0 && (
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center px-2 h-7 bg-destructive border-2 border-white/70 rounded-sm shadow-lg z-20">
                    <span className="text-yellow-300 text-xl font-extrabold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{stats.fouls}</span>
                </div>
            )}

            {/* PIR */}
            <div className="absolute top-2 right-2 text-lg font-bold text-blue-600 bg-white/80 rounded-full h-8 w-8 flex items-center justify-center backdrop-blur-sm z-10 shadow-md">
                {stats.pir}
            </div>
            
            {/* Jersey Number */}
            <div className="text-8xl font-black text-muted-foreground/20" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                {player.jerseyNumber || 'S/N'}
            </div>

             {/* Player Info */}
             <div className="absolute bottom-1 text-xs text-center font-semibold w-full px-1 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-1">
                <p className="truncate">{player.firstName} {player.lastName}</p>
                <p className="font-mono text-muted-foreground">{formatTime(stats.timePlayedSeconds)} ({stats.periodsPlayed})</p>
            </div>
        </Card>
    );
};


const ShotActionButtons = ({ onAction }: { onAction: (action: GameEventAction) => void }) => (
    <div className="space-y-3">
        <h4 className="font-medium text-center">Registro de Tiros</h4>
        <div className="grid grid-cols-2 gap-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => onAction('shot_made_1p')}><CheckCircle className="mr-2 h-4 w-4"/>+1 Pto</Button>
            <Button variant="destructive" onClick={() => onAction('shot_miss_1p')}><Ban className="mr-2 h-4 w-4"/>Fallo 1 Pto</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => onAction('shot_made_2p')}><CheckCircle className="mr-2 h-4 w-4"/>+2 Ptos</Button>
            <Button variant="destructive" onClick={() => onAction('shot_miss_2p')}><Ban className="mr-2 h-4 w-4"/>Fallo 2 Ptos</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => onAction('shot_made_3p')}><CheckCircle className="mr-2 h-4 w-4"/>+3 Ptos</Button>
            <Button variant="destructive" onClick={() => onAction('shot_miss_3p')}><Ban className="mr-2 h-4 w-4"/>Fallo 3 Ptos</Button>
        </div>
    </div>
);

const OtherActionButtons = ({ onAction }: { onAction: (action: GameEventAction) => void }) => (
    <div className="space-y-2">
        <h4 className="font-medium text-center">Otras Jugadas</h4>
        <Button className="w-full justify-start" variant="outline" onClick={() => onAction('rebound_defensive')}>Rebote Defensivo</Button>
        <Button className="w-full justify-start" variant="outline" onClick={() => onAction('rebound_offensive')}>Rebote Ofensivo</Button>
        <Button className="w-full justify-start" variant="outline" onClick={() => onAction('assist')}>Asistencia</Button>
        <Button className="w-full justify-start" variant="outline" onClick={() => onAction('steal')}>Robo</Button>
        <Button className="w-full justify-start" variant="outline" onClick={() => onAction('block')}>Tapón</Button>
        <Button className="w-full justify-start" variant="destructive" onClick={() => onAction('turnover')}>Pérdida</Button>
        <Button className="w-full justify-start" variant="destructive" onClick={() => onAction('foul')}>Falta Personal</Button>
    </div>
);


export default function LiveGamePage() {
    const params = useParams();
    const { toast } = useToast();
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const { authLoading } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [gameFormat, setGameFormat] = useState<GameFormat | null>(null);
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
    const [playerStats, setPlayerStats] = useState<PlayerGameStats[]>([]);

    const [displayTime, setDisplayTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [actionPlayerInfo, setActionPlayerInfo] = useState<{player: Player, teamType: 'home' | 'away'} | null>(null);
    const [subPlayerInfo, setSubPlayerInfo] = useState<{player: Player, teamType: 'home' | 'away'} | null>(null);

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
                const gameData = { id: docSnap.id, ...data, date: new Date((data.date as any).seconds * 1000).toISOString() } as Game;
                setGame(gameData);
                
                getPlayerStatsForGame(gameId).then(setPlayerStats);
                
                if (!gameData.isTimerRunning) {
                   setDisplayTime(gameData.periodTimeRemainingSeconds ?? 0);
                }

                if (!gameFormat && gameData.gameFormatId) {
                    getGameFormatById(gameData.gameFormatId).then(setGameFormat);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId]);
    
    useEffect(() => {
        let timerId: NodeJS.Timeout | null = null;
       if (game?.isTimerRunning && displayTime > 0) {
           timerId = setInterval(() => {
               setDisplayTime(prev => prev > 0 ? prev - 1 : 0);
           }, 1000);
       }
       return () => {
           if (timerId) clearInterval(timerId);
       };
    }, [game?.isTimerRunning, displayTime]);


    const handleUpdate = useCallback(async (updates: Partial<Game>) => {
        const result = await updateLiveGameState(gameId, updates);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error al Actualizar', description: result.error });
        }
    }, [gameId, toast]);
    
    const handleGameEvent = async (teamType: 'home' | 'away', playerId: string, playerName: string, action: GameEventAction) => {
        if (!game || game.status !== 'inprogress') return;
        await recordGameEvent(gameId, { teamId: teamType, playerId, playerName, action, period: game.currentPeriod || 1, gameTimeSeconds: displayTime });
        setActionPlayerInfo(null);
    };

    const handleExecuteSubstitution = async (teamType: 'home' | 'away', playerInId: string, playerOutId: string | null) => {
        if (!game) return;
        const result = await substitutePlayer(gameId, teamType, playerInId, playerOutId);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error de Sustitución', description: result.error });
        }
        setSubPlayerInfo(null);
    };

    const handleBenchPlayerClick = (player: Player, teamType: 'home' | 'away') => {
        if (!game) return;
        const onCourtField = teamType === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds';
        const onCourtIds = game[onCourtField] || [];
        
        if (onCourtIds.includes(player.id)) {
            toast({ variant: 'default', title: 'Jugador en pista', description: 'Este jugador ya está en la pista.' });
            return;
        }

        if (onCourtIds.length < 5) {
            handleExecuteSubstitution(teamType, player.id, null);
        } else {
            setSubPlayerInfo({ player, teamType });
        }
    };
    
    const handleCourtPlayerClickInSubDialog = (playerOut: Player) => {
        if (!subPlayerInfo) return;
        handleExecuteSubstitution(subPlayerInfo.teamType, subPlayerInfo.player.id, playerOut.id);
    };

    const handleToggleTimer = useCallback(() => {
        if (!game) return;
        handleUpdate({ isTimerRunning: !game.isTimerRunning, periodTimeRemainingSeconds: displayTime });
    }, [game, displayTime, handleUpdate]);
    
    const handleNextPeriod = useCallback(() => {
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
    }, [game, gameFormat, handleUpdate]);

    const handleResetTimer = useCallback(() => {
        if (!game || !gameFormat) return;
        handleUpdate({
            isTimerRunning: false,
            periodTimeRemainingSeconds: (gameFormat.periodDurationMinutes || 10) * 60,
        });
    }, [game, gameFormat, handleUpdate]);

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
        const gameRosterIds = new Set(teamType === 'home' ? game.homeTeamPlayerIds : game.awayTeamPlayerIds);

        const onCourtPlayers = playersList.filter(p => gameRosterIds.has(p.id) && onCourtIds.has(p.id));
        const onBenchPlayers = playersList.filter(p => gameRosterIds.has(p.id) && !onCourtIds.has(p.id));
        
        const defaultStats: Omit<PlayerGameStats, 'playerId'> = {
            playerName: '', timePlayedSeconds: 0, periodsPlayed: 0,
            points: 0, shots_made_1p: 0, shots_attempted_1p: 0, shots_made_2p: 0, shots_attempted_2p: 0, shots_made_3p: 0, shots_attempted_3p: 0,
            reb_def: 0, reb_off: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0, pir: 0,
        };

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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {onCourtPlayers.length > 0 ? onCourtPlayers.map(p => {
                             const stats = playerStats.find(s => s.playerId === p.id) || { ...defaultStats, playerId: p.id };
                             return <PlayerStatCard key={p.id} player={p} stats={stats} onClick={() => setActionPlayerInfo({ player: p, teamType })}/>
                        }) : <p className="text-sm text-muted-foreground text-center italic col-span-full">Sin jugadores en pista</p>}
                    </div>

                    <Separator/>
                    <h4 className="font-semibold text-center">Banquillo</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                       {onBenchPlayers.length > 0 ? onBenchPlayers.map(p => {
                           const stats = playerStats.find(s => s.playerId === p.id) || { ...defaultStats, playerId: p.id };
                           return <PlayerStatCard key={p.id} player={p} stats={stats} onClick={() => handleBenchPlayerClick(p, teamType)}/>
                       }) : <p className="text-sm text-muted-foreground text-center italic col-span-full">Banquillo vacío</p>}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <Dialog open={!!actionPlayerInfo} onOpenChange={(isOpen) => !isOpen && setActionPlayerInfo(null)}>
                <DialogContent className="max-w-3xl">
                     <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 p-2 border rounded-md flex items-center justify-center bg-muted/50 shrink-0">
                               <Image src={actionPlayerInfo?.teamType === 'home' ? (game.homeTeamLogoUrl || 'https://placehold.co/100x100.png') : (game.awayTeamLogoUrl || 'https://placehold.co/100x100.png')} alt="Team Logo" width={64} height={64} className="object-contain"/>
                            </div>
                            <div>
                                <DialogTitle className="text-2xl">
                                    {actionPlayerInfo?.player.firstName} {actionPlayerInfo?.player.lastName} (#{actionPlayerInfo?.player.jerseyNumber || 'S/N'})
                                </DialogTitle>
                                <DialogDescription>
                                    {actionPlayerInfo?.teamType === 'home' ? game.homeTeamName : game.awayTeamName}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <ShotActionButtons onAction={(action) => handleGameEvent(actionPlayerInfo!.teamType, actionPlayerInfo!.player.id, `${actionPlayerInfo!.player.firstName} ${actionPlayerInfo!.player.lastName}`, action)} />
                        <OtherActionButtons onAction={(action) => handleGameEvent(actionPlayerInfo!.teamType, actionPlayerInfo!.player.id, `${actionPlayerInfo!.player.firstName} ${actionPlayerInfo!.player.lastName}`, action)} />
                    </div>
                </DialogContent>
            </Dialog>

             <Dialog open={!!subPlayerInfo} onOpenChange={(isOpen) => !isOpen && setSubPlayerInfo(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Realizar Sustitución</DialogTitle>
                        <DialogDescription>
                            Selecciona el jugador que sale de la pista para que entre {subPlayerInfo?.player.firstName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4">
                        {subPlayerInfo && game && (subPlayerInfo.teamType === 'home' ? homePlayers : awayPlayers)
                                .filter(p => (game[subPlayerInfo!.teamType === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds'] || []).includes(p.id))
                                .map(player => (
                                    <Button key={player.id} onClick={() => handleCourtPlayerClickInSubDialog(player)} variant="outline" className="h-auto p-2 flex flex-col gap-1">
                                        <div className="font-bold text-lg">{player.jerseyNumber || 'S/N'}</div>
                                        <div className="text-xs">{player.firstName} {player.lastName}</div>
                                    </Button>
                                ))
                        }
                    </div>
                </DialogContent>
            </Dialog>

             <Button variant="outline" size="sm" asChild>
                <Link href={`/games/${gameId}`}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver a detalles del partido
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
