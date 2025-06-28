
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateLiveGameState, recordGameEvent, substitutePlayer, getPlayerStatsForGame } from '@/app/games/actions';
import { getGameFormatById } from '@/app/game-formats/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import { getTeamsByCoach } from '@/app/teams/actions';
import { getUserProfileById } from '@/app/users/actions';
import type { Game, GameFormat, Player, GameEventAction, PlayerGameStats, UserFirestoreProfile, ProfileType } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ChevronLeft, Gamepad2, Minus, Plus, Play, Flag, Pause, TimerReset, FastForward, Timer as TimerIcon, CheckCircle, Ban, Users, Dribbble, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

const PlayerStatCard = ({ player, stats, onClick, userProfileType, isChild, onCourt }: { player: Player; stats: PlayerGameStats; onClick?: () => void, userProfileType?: ProfileType, isChild: boolean, onCourt: boolean }) => {
    // A parent can only see stats for their own child.
    const canSeeStats = userProfileType !== 'parent_guardian' || isChild;
    
    // A parent can only click their own child's card to add actions. A coach/admin can click anyone.
    const isClickable = (userProfileType !== 'parent_guardian' || isChild) && onCourt;
    
    // A parent cannot see the PIR for any player.
    const showPIR = userProfileType !== 'parent_guardian';

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <Card onClick={isClickable ? onClick : undefined} className={`p-2 relative aspect-[3/4] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 bg-card ${isClickable ? "hover:shadow-xl hover:scale-105 cursor-pointer" : "cursor-default"}`}>
            {!canSeeStats && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-muted-foreground"/>
                </div>
            )}
            
            {/* Points */}
            <div className={`absolute top-2 left-2 text-2xl font-black text-green-600 ${!canSeeStats ? 'invisible' : ''}`}>
                {stats.points}
            </div>

            {/* Fouls */}
            {stats.fouls > 0 && (
                 <div className={`absolute top-1/2 -translate-y-1/2 right-2 flex items-center justify-center px-2 h-7 bg-destructive border-2 border-white/70 rounded-sm shadow-lg z-20 ${!canSeeStats ? 'invisible' : ''}`}>
                    <span className="text-yellow-300 text-xl font-extrabold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{stats.fouls}</span>
                </div>
            )}
            
            {/* PIR */}
             <div className="absolute top-2 right-2 text-2xl font-black text-blue-600">
                {showPIR ? stats.pir : '-'}
            </div>

            {/* Jersey Number */}
            <div className="text-8xl font-black text-destructive" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                {player.jerseyNumber || 'S/N'}
            </div>

            {/* Name and Time */}
            <div className="absolute bottom-1 text-xs text-center font-semibold w-full px-1 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-1">
                <p className="truncate">{player.firstName} {player.lastName}</p>
                <p className={`font-mono text-muted-foreground ${!canSeeStats ? 'invisible' : ''}`}>{formatTime(stats.timePlayedSeconds || 0)} ({stats.periodsPlayed || 0})</p>
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
        <div className="grid grid-cols-2 gap-2">
            <Button className="justify-start" variant="outline" onClick={() => onAction('rebound_defensive')}>Rebote Defensivo</Button>
            <Button className="justify-start" variant="outline" onClick={() => onAction('rebound_offensive')}>Rebote Ofensivo</Button>
            <Button className="justify-start" variant="outline" onClick={() => onAction('assist')}>Asistencia</Button>
            <Button className="justify-start" variant="outline" onClick={() => onAction('steal')}>Robo</Button>
            <Button className="justify-start" variant="outline" onClick={() => onAction('block')}>Tapón a Favor</Button>
            <Button className="justify-start" variant="destructive" onClick={() => onAction('block_against')}>Tapón Sufrido</Button>
            <Button className="justify-start" variant="destructive" onClick={() => onAction('turnover')}>Pérdida</Button>
            <Button className="justify-start" variant="destructive" onClick={() => onAction('foul')}>Falta Personal</Button>
            <Button className="justify-start" variant="outline" onClick={() => onAction('foul_received')}>Falta Recibida</Button>
        </div>
    </div>
);


export default function LiveGamePage() {
    const params = useParams();
    const { toast } = useToast();
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const { user, profile, loading: authLoading } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [gameFormat, setGameFormat] = useState<GameFormat | null>(null);
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
    const [playerStats, setPlayerStats] = useState<PlayerGameStats[]>([]);

    const [displayTime, setDisplayTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);
    
    const [actionPlayerInfo, setActionPlayerInfo] = useState<{player: Player, teamType: 'home' | 'away'} | null>(null);
    const [subPlayerInfo, setSubPlayerInfo] = useState<{player: Player, teamType: 'home' | 'away'} | null>(null);
    
    const defaultStats: Omit<PlayerGameStats, 'pir'> & { timeByPeriod: { [period: number]: number } } = {
        playerId: '', playerName: '', timePlayedSeconds: 0, periodsPlayed: 0,
        points: 0, shots_made_1p: 0, shots_attempted_1p: 0, shots_made_2p: 0, shots_attempted_2p: 0, shots_made_3p: 0, shots_attempted_3p: 0,
        reb_def: 0, reb_off: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0,
        blocks_against: 0, fouls_received: 0, timeByPeriod: {}
    };

    const handleUpdate = useCallback(async (updates: Partial<Game>) => {
        if (!user) return;
        const result = await updateLiveGameState(gameId, user.uid, updates);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error al Actualizar', description: result.error });
        }
    }, [gameId, toast, user]);

    useEffect(() => {
        if (authLoading) return;
        if (!user || !profile) {
            setError("Debes iniciar sesión para ver esta página.");
            setLoading(false);
            return;
        }

        const gameRef = doc(db, 'games', gameId);
        const unsubscribe = onSnapshot(gameRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const gameData = { id: docSnap.id, ...data, date: (data.date as any).toDate() } as Game;
                setGame(gameData);
                
                const isSuperAdmin = profile.profileTypeId === 'super_admin';
                const isClubAdmin = ['club_admin', 'coordinator'].includes(profile.profileTypeId) && (profile.clubId === gameData.homeTeamClubId || profile.clubId === gameData.awayTeamClubId);
                const isParentOfPlayer = profile.profileTypeId === 'parent_guardian' && (profile.children || []).some(child => 
                    (gameData.homeTeamPlayerIds || []).includes(child.playerId) || 
                    (gameData.awayTeamPlayerIds || []).includes(child.playerId)
                );
                
                const coachTeams = await getTeamsByCoach(user.uid);
                const isCoachOfGame = coachTeams.some(t => t.id === gameData.homeTeamId || t.id === gameData.awayTeamId);

                if (isSuperAdmin || isClubAdmin || isCoachOfGame || isParentOfPlayer) {
                    setHasPermission(true);
                } else {
                    setError("No tienes permiso para ver este partido en vivo.");
                    setLoading(false);
                    return;
                }

                if (!gameFormat && gameData.gameFormatId) getGameFormatById(gameData.gameFormatId).then(setGameFormat);
                if (homePlayers.length === 0 && gameData.homeTeamId) getPlayersByTeamId(gameData.homeTeamId).then(setHomePlayers);
                if (awayPlayers.length === 0 && gameData.awayTeamId) getPlayersByTeamId(gameData.awayTeamId).then(setAwayPlayers);
                getPlayerStatsForGame(gameId).then(setPlayerStats);
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
    }, [gameId, user, profile, authLoading, gameFormat, homePlayers.length, awayPlayers.length]);


    useEffect(() => {
        let timerId: NodeJS.Timeout | null = null;
        if (game?.isTimerRunning && displayTime > 0) {
            timerId = setInterval(() => {
                setDisplayTime(prevTime => prevTime - 1);
            }, 1000);
        } else if (game?.isTimerRunning && displayTime <= 0) {
            handleUpdate({ isTimerRunning: false });
        }
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [game?.isTimerRunning, displayTime, handleUpdate]);
    
    useEffect(() => {
        if (game?.periodTimeRemainingSeconds !== undefined) {
            setDisplayTime(game.periodTimeRemainingSeconds);
        }
    }, [game?.periodTimeRemainingSeconds]);

    const handleGameEvent = async (teamType: 'home' | 'away', playerId: string, playerName: string, action: GameEventAction) => {
        if (!game || game.status !== 'inprogress' || !user) return;
        await recordGameEvent(gameId, user.uid, { teamId: teamType, playerId, playerName, action, period: game.currentPeriod || 1, gameTimeSeconds: displayTime });
        setActionPlayerInfo(null);
    };

    const handleExecuteSubstitution = async (teamType: 'home' | 'away', playerIn: Player, playerOut: Player | null) => {
        if (!game || !user) return;
        const playerInInfo = { id: playerIn.id, name: `${playerIn.firstName} ${playerIn.lastName}`};
        const playerOutInfo = playerOut ? { id: playerOut.id, name: `${playerOut.firstName} ${playerOut.lastName}`} : null;
        const result = await substitutePlayer(gameId, user.uid, teamType, playerInInfo, playerOutInfo, game.currentPeriod || 1, displayTime);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error de Sustitución', description: result.error });
        }
        setSubPlayerInfo(null);
    };

    const handleBenchPlayerClick = (player: Player, teamType: 'home' | 'away') => {
        if (!game || !profile) return;
        const canSub = ['super_admin', 'club_admin', 'coordinator', 'coach'].includes(profile.profileTypeId);
        if (!canSub) {
            toast({ variant: "default", title: "Solo Vista", description: "Solo los entrenadores o administradores pueden hacer sustituciones." });
            return;
        }

        const onCourtField = teamType === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds';
        const onCourtIds = game[onCourtField] || [];
        if (onCourtIds.includes(player.id)) {
            toast({ variant: 'default', title: 'Jugador en pista', description: 'Este jugador ya está en la pista.' });
            return;
        }
        if (onCourtIds.length < 5) {
            handleExecuteSubstitution(teamType, player, null);
        } else {
            setSubPlayerInfo({ player, teamType });
        }
    };
    
    const handleCourtPlayerClickInSubDialog = (playerOut: Player) => {
        if (!subPlayerInfo) return;
        handleExecuteSubstitution(subPlayerInfo.teamType, subPlayerInfo.player, playerOut);
    };

    const handleToggleTimer = useCallback(() => {
        if (!game) return;
        handleUpdate({
            isTimerRunning: !game.isTimerRunning,
            periodTimeRemainingSeconds: displayTime,
        });
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
    
    const handleGameStatusChange = (status: 'inprogress' | 'completed') => {
        let updates: Partial<Game> = { status };
        if (status === 'inprogress') {
             updates.periodTimeRemainingSeconds = (gameFormat?.periodDurationMinutes || 10) * 60;
        }
        if (status === 'completed') {
            updates.isTimerRunning = false;
            updates.periodTimeRemainingSeconds = 0;
        }
        handleUpdate(updates);
    }

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    const childrenPlayerIds = useMemo(() => new Set(profile?.children?.map(c => c.playerId) || []), [profile]);

    if (loading || authLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    if (error || !hasPermission) return <div className="text-center p-6"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl text-destructive">Error</h1><p>{error || "No tienes permiso para ver esta página."}</p></div>;
    if (!game) return null;

    const TeamPanel = ({ teamType, playersList }: { teamType: 'home' | 'away', playersList: Player[] }) => {
        const teamName = teamType === 'home' ? game.homeTeamName : game.awayTeamName;
        const onCourtIds = new Set(teamType === 'home' ? game.homeTeamOnCourtPlayerIds : game.awayTeamOnCourtPlayerIds);
        const gameRosterIds = new Set(teamType === 'home' ? game.homeTeamPlayerIds : game.awayTeamPlayerIds);

        const onCourtPlayers = playersList.filter(p => gameRosterIds.has(p.id) && onCourtIds.has(p.id));
        const onBenchPlayers = playersList.filter(p => gameRosterIds.has(p.id) && !onCourtIds.has(p.id));
        
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
                             const stats = playerStats.find(s => s.playerId === p.id) || { ...defaultStats, playerId: p.id, playerName: `${p.firstName} ${p.lastName}`, pir: 0 };
                             const isChild = childrenPlayerIds.has(p.id);
                             return <PlayerStatCard key={p.id} player={p} stats={stats} onClick={() => setActionPlayerInfo({ player: p, teamType })} userProfileType={profile?.profileTypeId} isChild={isChild} onCourt={true} />
                        }) : <p className="text-sm text-muted-foreground text-center italic col-span-full">Sin jugadores en pista</p>}
                    </div>
                    <Separator/>
                    <h4 className="font-semibold text-center">Banquillo</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                       {onBenchPlayers.length > 0 ? onBenchPlayers.map(p => {
                           const stats = playerStats.find(s => s.playerId === p.id) || { ...defaultStats, playerId: p.id, playerName: `${p.firstName} ${p.lastName}`, pir: 0 };
                           const isChild = childrenPlayerIds.has(p.id);
                           return <PlayerStatCard key={p.id} player={p} stats={stats} onClick={() => handleBenchPlayerClick(p, teamType)} userProfileType={profile?.profileTypeId} isChild={isChild} onCourt={false} />
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
                    {actionPlayerInfo && game && (
                         <>
                            <DialogHeader>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 p-2 border rounded-md flex items-center justify-center bg-muted/50 shrink-0">
                                       <Image src={actionPlayerInfo.teamType === 'home' ? (game.homeTeamLogoUrl || 'https://placehold.co/100x100.png') : (game.awayTeamLogoUrl || 'https://placehold.co/100x100.png')} alt="Team Logo" width={64} height={64} className="object-contain"/>
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl">
                                            {actionPlayerInfo.player.firstName} {actionPlayerInfo.player.lastName} (#{actionPlayerInfo.player.jerseyNumber || 'S/N'})
                                        </DialogTitle>
                                        <DialogDescription>
                                            {actionPlayerInfo.teamType === 'home' ? game.homeTeamName : game.awayTeamName}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                <ShotActionButtons onAction={(action) => handleGameEvent(actionPlayerInfo!.teamType, actionPlayerInfo!.player.id, `${actionPlayerInfo!.player.firstName} ${actionPlayerInfo!.player.lastName}`, action)} />
                                <OtherActionButtons onAction={(action) => handleGameEvent(actionPlayerInfo!.teamType, actionPlayerInfo!.player.id, `${actionPlayerInfo!.player.firstName} ${actionPlayerInfo!.player.lastName}`, action)} />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

             <Dialog open={!!subPlayerInfo} onOpenChange={(isOpen) => !isOpen && setSubPlayerInfo(null)}>
                <DialogContent className="max-w-4xl">
                    {subPlayerInfo && game && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Realizar Sustitución</DialogTitle>
                            <DialogDescription>
                                Selecciona el jugador en pista que saldrá por {subPlayerInfo.player.firstName}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-4">
                            {(subPlayerInfo.teamType === 'home' ? homePlayers : awayPlayers)
                                    .filter(p => (game[subPlayerInfo!.teamType === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds'] || []).includes(p.id))
                                    .map(player => {
                                        const stats = playerStats.find(s => s.playerId === player.id) || { ...defaultStats, playerId: player.id, playerName: `${player.firstName} ${player.lastName}`, pir: 0 };
                                        const isChild = childrenPlayerIds.has(player.id);
                                        return <PlayerStatCard key={player.id} player={player} stats={stats} onClick={() => handleCourtPlayerClickInSubDialog(player)} userProfileType={profile?.profileTypeId} isChild={isChild} onCourt={true} />
                                    })
                            }
                        </div>
                    </>
                    )}
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
                        <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleGameStatusChange('inprogress')}>
                            <Play className="mr-2 h-5 w-5"/> Empezar Partido
                        </Button>
                    )}
                    {game.status === 'inprogress' && (
                        <Button size="lg" variant="destructive" className="w-full" onClick={() => handleGameStatusChange('completed')}>
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
