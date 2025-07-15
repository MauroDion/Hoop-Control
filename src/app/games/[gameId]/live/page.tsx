

"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getGameById, updateLiveGameState, endCurrentPeriod, substitutePlayer, assignScorer, recordGameEvent } from '@/app/games/actions';
import { getGameFormatById } from '@/lib/actions/game-formats';
import { getPlayersByTeamId } from '@/app/players/actions';
import type { Game, GameFormat, Player, GameEventAction, PlayerGameStats, UserFirestoreProfile, ProfileType, StatCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ChevronLeft, Gamepad2, Minus, Plus, Play, Flag, Pause, TimerReset, FastForward, Timer as TimerIcon, CheckCircle, Ban, Users, Dribbble, UserCheck, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const PlayerStatCard = ({ player, stats, onClick, userProfileType, isChild }: { player: Player; stats: PlayerGameStats; onClick?: () => void, userProfileType?: ProfileType, isChild: boolean }) => {
    
    const canSeeAdvancedStats = userProfileType !== 'parent_guardian' || isChild;

    const plusMinusValue = stats.plusMinus || 0;
    const pirValue = stats.pir || 0;
    const periodsPlayedSet = stats.periodsPlayedSet || [];
    const periodsPlayedString = Array.from(periodsPlayedSet).sort().join(', ');
    const periodsPlayedCount = periodsPlayedSet.length;

    return (
        <Card onClick={onClick} className={`p-2 relative h-full flex flex-col items-center justify-center overflow-hidden transition-all duration-300 bg-card ${onClick ? "hover:shadow-xl hover:scale-105 cursor-pointer" : "cursor-default"}`}>
            <div className='absolute top-2 left-2 text-2xl font-black text-green-600'>{stats.points}</div>
            {stats.fouls > 0 && <div className='absolute top-2 right-2 flex items-center justify-center px-1.5 h-6 bg-destructive border-2 border-white/70 rounded-sm shadow-lg z-20'><span className="text-yellow-300 text-sm font-extrabold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>F: {stats.fouls}</span></div>}
            
            {canSeeAdvancedStats && (
                <>
                    <div className="absolute top-1/2 -translate-y-1/2 left-2 flex flex-col items-center z-20">
                        <span className="text-[10px] font-bold text-muted-foreground -mb-1">+/-</span>
                        <div className='flex items-center justify-center px-2 h-7 bg-green-600 border-2 border-white/70 rounded-sm shadow-lg'>
                            <span className="text-white text-xl font-extrabold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                                {plusMinusValue > 0 ? `+${plusMinusValue}` : plusMinusValue}
                            </span>
                        </div>
                    </div>
                     <div className="absolute top-1/2 -translate-y-1/2 right-2 flex flex-col items-center z-20">
                        <span className="text-[10px] font-bold text-muted-foreground -mb-1">PIR</span>
                        <div className='flex items-center justify-center px-2 h-7 bg-blue-600 border-2 border-white/70 rounded-sm shadow-lg'>
                            <span className="text-white text-xl font-extrabold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                                {pirValue}
                            </span>
                        </div>
                    </div>
                </>
            )}

            <div className="text-7xl font-black text-destructive" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>{player.jerseyNumber || 'S/N'}</div>
            <div className="absolute bottom-1 text-xs text-center font-semibold w-full px-1 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-1">
                <p className="truncate">{player.firstName} {player.lastName}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{periodsPlayedString} ({periodsPlayedCount})</p>
            </div>
        </Card>
    );
};

const ShotActionButtons = ({ onAction, disabled }: { onAction: (action: GameEventAction) => void, disabled: boolean }) => (
    <div className="space-y-3">
        <h4 className="font-medium text-center">Registro de Tiros</h4>
        <div className="grid grid-cols-2 gap-2">
            <Button disabled={disabled} className="bg-green-600 hover:bg-green-700" onClick={() => onAction('shot_made_1p')}><CheckCircle className="mr-2 h-4 w-4"/>+1 Pto</Button>
            <Button disabled={disabled} variant="destructive" onClick={() => onAction('shot_miss_1p')}><Ban className="mr-2 h-4 w-4"/>Fallo 1 Pto</Button>
            <Button disabled={disabled} className="bg-green-600 hover:bg-green-700" onClick={() => onAction('shot_made_2p')}><CheckCircle className="mr-2 h-4 w-4"/>+2 Ptos</Button>
            <Button disabled={disabled} variant="destructive" onClick={() => onAction('shot_miss_2p')}><Ban className="mr-2 h-4 w-4"/>Fallo 2 Ptos</Button>
            <Button disabled={disabled} className="bg-green-600 hover:bg-green-700" onClick={() => onAction('shot_made_3p')}><CheckCircle className="mr-2 h-4 w-4"/>+3 Ptos</Button>
            <Button disabled={disabled} variant="destructive" onClick={() => onAction('shot_miss_3p')}><Ban className="mr-2 h-4 w-4"/>Fallo 3 Ptos</Button>
        </div>
    </div>
);

const OtherActionButtons = ({ onAction, disabled }: { onAction: (action: GameEventAction) => void, disabled: boolean }) => (
    <div className="space-y-2">
        <h4 className="font-medium text-center">Otras Jugadas</h4>
        <div className="grid grid-cols-2 gap-2">
            <Button disabled={disabled} className="justify-start" variant="outline" onClick={() => onAction('rebound_defensive')}>Rebote Defensivo</Button>
            <Button disabled={disabled} className="justify-start" variant="outline" onClick={() => onAction('rebound_offensive')}>Rebote Ofensivo</Button>
            <Button disabled={disabled} className="justify-start" variant="outline" onClick={() => onAction('assist')}>Asistencia</Button>
            <Button disabled={disabled} className="justify-start" variant="outline" onClick={() => onAction('steal')}>Robo</Button>
            <Button disabled={disabled} className="justify-start" variant="outline" onClick={() => onAction('block')}>Tapón a Favor</Button>
            <Button disabled={disabled} className="justify-start" variant="destructive" onClick={() => onAction('block_against')}>Tapón Sufrido</Button>
            <Button disabled={disabled} className="justify-start" variant="destructive" onClick={() => onAction('turnover')}>Pérdida</Button>
            <Button disabled={disabled} className="justify-start" variant="destructive" onClick={() => onAction('foul')}>Falta Personal</Button>
            <Button disabled={disabled} className="justify-start" variant="outline" onClick={() => onAction('foul_received')}>Falta Recibida</Button>
        </div>
    </div>
);

const ScorerAssignmentDialog = ({ game, user, onAssign, onRelease }: { game: Game, user: any, onAssign: (category: StatCategory) => void, onRelease: (category: StatCategory) => void }) => {
    const assignments = game.scorerAssignments || {};
    const categories: { key: StatCategory, label: string }[] = [
        { key: 'shots', label: 'Tiros' },
        { key: 'fouls', label: 'Faltas' },
        { key: 'turnovers', label: 'Otras Jugadas' },
    ];

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Asignación de Anotadores</DialogTitle>
                <DialogDescription>
                    Toma el control de una categoría de estadísticas para empezar a anotar. Solo una persona puede anotar cada categoría a la vez.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                {categories.map(({ key, label }) => {
                    const assignment = assignments[key];
                    const isAssignedToMe = assignment?.uid === user.uid;
                    const isAssignedToOther = assignment && !isAssignedToMe;

                    return (
                        <div key={key} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex flex-col">
                                <span className="font-semibold">{label}</span>
                                {isAssignedToMe && <span className="text-sm text-green-600">Asignado a ti</span>}
                                {isAssignedToOther && <span className="text-sm text-muted-foreground">Asignado a {assignment.displayName}</span>}
                            </div>
                            {isAssignedToMe ? (
                                <Button variant="destructive" size="sm" onClick={() => onRelease(key)}>Liberar</Button>
                            ) : (
                                <Button variant="default" size="sm" disabled={isAssignedToOther} onClick={() => onAssign(key)}>Tomar Control</Button>
                            )}
                        </div>
                    );
                })}
            </div>
        </DialogContent>
    );
};


export default function LiveGamePage() {
    const params = useParams();
    const { toast } = useToast();
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const { user, profile, loading: authLoading } = useAuth();
    
    const [game, setGame] = useState<Game | null>(null);
    const [gameFormat, setGameFormat] = useState<GameFormat | null>(null);
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
    
    const [displayTime, setDisplayTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);
    
    const [actionPlayerInfo, setActionPlayerInfo] = useState<{player: Player, teamType: 'home' | 'away'} | null>(null);
    const [subPlayerInfo, setSubPlayerInfo] = useState<{player: Player, teamType: 'home' | 'away'} | null>(null);
    const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
    const [isEndingPeriod, setIsEndingPeriod] = useState(false);

    const myAssignments = useMemo(() => {
        const assignments = new Set<StatCategory>();
        if (!game || !user) return assignments;
        for (const key in game.scorerAssignments) {
            const assignmentKey = key as StatCategory;
            if (game.scorerAssignments[assignmentKey]?.uid === user.uid) {
                assignments.add(assignmentKey);
            }
        }
        return assignments;
    }, [game, user]);
    
    const defaultStats: PlayerGameStats = {
        playerId: '', playerName: '', timePlayedSeconds: 0, periodsPlayed: 0,
        periodsPlayedSet: [],
        points: 0, shots_made_1p: 0, shots_attempted_1p: 0,
        shots_made_2p: 0, shots_attempted_2p: 0,
        shots_made_3p: 0, shots_attempted_3p: 0,
        reb_def: 0, reb_off: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0,
        fouls: 0, blocks_against: 0, fouls_received: 0,
        pir: 0, plusMinus: 0
    };

    const fetchGameData = useCallback(async (showLoading = true) => {
        if (!user || !profile) {
          setError("Debes iniciar sesión para ver esta página.");
          setLoading(false);
          return;
        }
        
        if (showLoading) setLoading(true);

        try {
          const gameData = await getGameById(gameId);
          if (!gameData) {
            throw new Error("El partido no existe o ha sido eliminado.");
          }
    
          setGame(gameData);
    
          const isSuperAdmin = profile.profileTypeId === 'super_admin';
          const isClubAdmin = ['club_admin', 'coordinator'].includes(profile.profileTypeId || "") && (profile.clubId === gameData.homeTeamClubId || profile.clubId === gameData.awayTeamClubId);
          const isParentOfPlayerInGame = profile.profileTypeId === 'parent_guardian' && (profile.children || []).some(child => 
            (gameData.homeTeamPlayerIds || []).includes(child.playerId) || 
            (gameData.awayTeamPlayerIds || []).includes(child.playerId)
          );
          const isCoachOfGame = (gameData.homeTeamId && (profile.teamsAsCoach?.some(t => t.id === gameData.homeTeamId))) || (gameData.awayTeamId && (profile.teamsAsCoach?.some(t => t.id === gameData.awayTeamId)));

          if (isSuperAdmin || isClubAdmin || isCoachOfGame || isParentOfPlayerInGame) {
            setHasPermission(true);
          } else {
            throw new Error("No tienes permiso para ver este partido en vivo.");
          }
    
          if (!gameFormat && gameData.gameFormatId) getGameFormatById(gameData.gameFormatId).then(setGameFormat);
          if (homePlayers.length === 0 && gameData.homeTeamId) getPlayersByTeamId(gameData.homeTeamId).then(setHomePlayers);
          if (awayPlayers.length === 0 && gameData.awayTeamId) getPlayersByTeamId(gameData.awayTeamId).then(setAwayPlayers);
    
        } catch (err: any) {
          setError(err.message);
        } finally {
          if (showLoading) setLoading(false);
        }
      }, [gameId, user, profile, gameFormat, homePlayers.length, awayPlayers.length]);
    
      useEffect(() => {
        if (!authLoading) {
          fetchGameData();
        }
      }, [authLoading, fetchGameData]);

    const handleUpdate = useCallback(async (updates: Partial<Game>) => {
        if (!user) return;
        const result = await updateLiveGameState(gameId, user.uid, updates);
        if (result.success) {
            await fetchGameData(false);
        } else {
            toast({ variant: 'destructive', title: 'Error al Actualizar', description: result.error });
        }
    }, [gameId, toast, user, fetchGameData]);

    const handleEndPeriod = useCallback(async () => {
        if (!game || !user || isEndingPeriod) return;
        setIsEndingPeriod(true);
        const result = await endCurrentPeriod(game.id, user.uid);
        if (result.success) {
            await fetchGameData(false);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsEndingPeriod(false);
    }, [game, user, toast, fetchGameData, isEndingPeriod]);


    useEffect(() => {
        setDisplayTime(game?.periodTimeRemainingSeconds ?? 0);
    }, [game?.periodTimeRemainingSeconds]);

    useEffect(() => {
        let timerId: NodeJS.Timeout | undefined;
        if (game?.isTimerRunning && game.timerStartedAt) {
            const serverStartTimeMs = (new Date(game.timerStartedAt as string)).getTime();
            const initialRemainingSeconds = game.periodTimeRemainingSeconds ?? 0;
            
            const updateDisplay = () => {
                const elapsedSeconds = Math.floor((Date.now() - serverStartTimeMs) / 1000);
                const newDisplayTime = Math.max(0, initialRemainingSeconds - elapsedSeconds);
                setDisplayTime(newDisplayTime);
                if (newDisplayTime <= 0 && game.isTimerRunning) {
                    clearInterval(timerId);
                    if (!isEndingPeriod) handleEndPeriod();
                }
            };
            
            updateDisplay();
            timerId = setInterval(updateDisplay, 1000);
        }
        return () => clearInterval(timerId);
    }, [game?.isTimerRunning, game?.timerStartedAt, game?.periodTimeRemainingSeconds, handleEndPeriod, isEndingPeriod]);


    const handleGameEvent = async (teamType: 'home' | 'away', playerId: string, playerName: string, action: GameEventAction) => {
        if (!game || game.status !== 'inprogress' || !user) return;
        const result = await recordGameEvent(gameId, user.uid, { teamId: teamType, playerId, playerName, action, period: game.currentPeriod || 1, gameTimeSeconds: displayTime });
        if(!result.success){
            toast({ variant: 'destructive', title: 'Acción no permitida', description: result.error });
        } else {
            await fetchGameData(false);
        }
        setActionPlayerInfo(null);
    };

    const handleExecuteSubstitution = async (teamType: 'home' | 'away', playerIn: Player, playerOut: Player | null) => {
        if (!game || !user) return;
        const playerInInfo = { id: playerIn.id, name: `${playerIn.firstName} ${playerIn.lastName}`};
        const playerOutInfo = playerOut ? { id: playerOut.id, name: `${playerOut.firstName} ${playerOut.lastName}`} : null;
        const result = await substitutePlayer(gameId, user.uid, teamType, playerInInfo, playerOutInfo, game.currentPeriod || 1, displayTime);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error de Sustitución', description: result.error });
        } else {
            await fetchGameData(false);
        }
        setSubPlayerInfo(null);
    };

    const handleBenchPlayerClick = (player: Player, teamType: 'home' | 'away') => {
        if (!game || !profile) return;
        const canSub = ['super_admin', 'club_admin', 'coordinator', 'coach'].includes(profile.profileTypeId || "");
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
        
        const requiredPlayers = gameFormat?.name?.includes('3v3') ? 3 : 5;

        if (onCourtIds.length < requiredPlayers) {
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
        if (!game || !user) return;
        const newIsTimerRunning = !game.isTimerRunning;
        
        const updates: Partial<Game> = { 
            isTimerRunning: newIsTimerRunning,
        };

        handleUpdate(updates);
    }, [game, user, handleUpdate]);
    
    const handleResetTimer = useCallback(() => {
        if (!game || !gameFormat || !user) return;
        handleUpdate({
            isTimerRunning: false,
            periodTimeRemainingSeconds: (gameFormat.periodDurationMinutes || 10) * 60,
        });
    }, [game, gameFormat, user, handleUpdate]);
    
    const handleGameStatusChange = async (status: 'inprogress' | 'completed') => {
        if (!game || !user) return;
        let updates: Partial<Game> = { status };
        if (status === 'inprogress') {
            let format = gameFormat;
            if (!format && game.gameFormatId) {
                format = await getFormat(game.gameFormatId);
                if (format) setGameFormat(format);
            }
            updates.periodTimeRemainingSeconds = (format?.periodDurationMinutes || 10) * 60;
            updates.isTimerRunning = false;
        }
        if (status === 'completed') {
            updates.isTimerRunning = false;
        }
        await updateLiveGameState(gameId, user.uid, updates);
        await fetchGameData(false);
    }

    const handleAssignScorer = async (category: StatCategory) => {
        if (!user || !user.displayName) return;
        const result = await assignScorer(gameId, user.uid, user.displayName, category, false);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error al asignar', description: result.error });
        } else {
            await fetchGameData(false);
        }
    };

    const handleReleaseScorer = async (category: StatCategory) => {
        if (!user || !user.displayName) return;
        const result = await assignScorer(gameId, user.uid, user.displayName, category, true);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error al liberar', description: result.error });
        } else {
            await fetchGameData(false);
        }
    };

    const formatTime = (totalSeconds: number) => {
        if (isNaN(totalSeconds) || totalSeconds < 0) {
            return '00:00';
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const parentChildInfo = useMemo(() => {
        if (profile?.profileTypeId !== 'parent_guardian' || !profile.children) {
            return { teamType: null, childIds: new Set<string>() };
        }
        const childIds = new Set(profile.children.map(c => c.playerId));
        let teamType: 'home' | 'away' | null = null;
        
        for (const id of childIds) {
            if ((game?.homeTeamPlayerIds || []).includes(id)) {
                teamType = 'home';
                break;
            }
            if ((game?.awayTeamPlayerIds || []).includes(id)) {
                teamType = 'away';
                break;
            }
        }
        return { teamType, childIds };
    }, [profile, game]);
    
    if (loading || authLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    if (error || !hasPermission) return <div className="text-center p-6"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl text-destructive">Error</h1><p>{error || "No tienes permiso para ver esta página."}</p></div>;
    if (!game || !profile) return null;

    const isSuperAdmin = profile.profileTypeId === 'super_admin';
    const canManageControls = profile && ['super_admin', 'club_admin', 'coordinator', 'coach'].includes(profile.profileTypeId || "");
    
    const canRecordAnyStat = myAssignments.size > 0 || isSuperAdmin;
    const canRecordShots = myAssignments.has('shots') || isSuperAdmin;
    const canRecordOther = myAssignments.has('turnovers') || myAssignments.has('fouls') || isSuperAdmin;

    const TeamPanel = ({ teamType, playersList }: { teamType: 'home' | 'away', playersList: Player[] }) => {
        const teamName = teamType === 'home' ? game.homeTeamName : game.awayTeamName;
        const onCourtIds = new Set(teamType === 'home' ? game.homeTeamOnCourtPlayerIds : game.awayTeamOnCourtPlayerIds);
        const gameRosterIds = new Set(teamType === 'home' ? game.homeTeamPlayerIds : game.awayTeamPlayerIds);
        
        const periodFouls = game.teamFoulsByPeriod?.[teamType]?.[game.currentPeriod] || 0;

        const onCourtPlayers = playersList.filter(p => gameRosterIds.has(p.id) && onCourtIds.has(p.id));
        const onBenchPlayers = playersList.filter(p => gameRosterIds.has(p.id) && !onCourtIds.has(p.id));
        
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="truncate">{teamName}</CardTitle>
                    <CardDescription>Equipo {teamType === 'home' ? 'Local' : 'Visitante'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                        <div className="text-8xl font-bold text-primary text-center">{teamType === 'home' ? game.homeTeamScore : game.awayTeamScore}</div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-semibold text-muted-foreground">FALTAS</span>
                            <div className="flex items-center justify-center h-12 w-12 bg-destructive rounded-md text-destructive-foreground text-3xl font-bold">
                                {periodFouls}
                            </div>
                        </div>
                    </div>
                    <Separator/>
                    <h4 className="font-semibold text-center">Jugadores en Pista</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 min-h-[10rem]">
                        {onCourtPlayers.length > 0 ? onCourtPlayers.map(p => {
                             const stats = game.playerStats?.[p.id] || { ...defaultStats, playerId: p.id, playerName: `${p.firstName} ${p.lastName}` };
                             const isChild = parentChildInfo.childIds.has(p.id);
                             return <PlayerStatCard key={p.id} player={p} stats={stats as PlayerGameStats} onClick={canRecordAnyStat ? () => setActionPlayerInfo({ player: p, teamType }) : undefined} userProfileType={profile.profileTypeId} isChild={isChild} />
                        }) : <p className="text-sm text-muted-foreground text-center italic col-span-full self-center">Sin jugadores en pista</p>}
                    </div>
                    <Separator/>
                    <h4 className="font-semibold text-center">Banquillo</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 min-h-[10rem]">
                       {onBenchPlayers.length > 0 ? onBenchPlayers.map(p => {
                           const stats = game.playerStats?.[p.id] || { ...defaultStats, playerId: p.id, playerName: `${p.firstName} ${p.lastName}` };
                           const isChild = parentChildInfo.childIds.has(p.id);
                           return <PlayerStatCard key={p.id} player={p} stats={stats as PlayerGameStats} onClick={canManageControls ? () => handleBenchPlayerClick(p, teamType) : undefined} userProfileType={profile.profileTypeId} isChild={isChild}/>
                       }) : <p className="text-sm text-muted-foreground text-center italic col-span-full self-center">Banquillo vacío</p>}
                    </div>
                </CardContent>
            </Card>
        );
    };
    
    return (
        <div className="space-y-6">
            <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                {user && <ScorerAssignmentDialog game={game} user={user} onAssign={handleAssignScorer} onRelease={handleReleaseScorer} />}
            </Dialog>

            <Dialog open={!!actionPlayerInfo} onOpenChange={(isOpen) => !isOpen && setActionPlayerInfo(null)}>
                <DialogContent className="max-w-3xl">
                    {actionPlayerInfo && <>
                        <DialogHeader><DialogTitle className="text-2xl">{actionPlayerInfo.player.firstName} {actionPlayerInfo.player.lastName} (#{actionPlayerInfo.player.jerseyNumber || 'S/N'})</DialogTitle><DialogDescription>{actionPlayerInfo.teamType === 'home' ? game.homeTeamName : game.awayTeamName}</DialogDescription></DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <ShotActionButtons onAction={(action) => handleGameEvent(actionPlayerInfo.teamType, actionPlayerInfo.player.id, `${actionPlayerInfo.player.firstName} ${actionPlayerInfo.player.lastName}`, action)} disabled={!canRecordShots} />
                            <OtherActionButtons onAction={(action) => handleGameEvent(actionPlayerInfo.teamType, actionPlayerInfo.player.id, `${actionPlayerInfo.player.firstName} ${actionPlayerInfo.player.lastName}`, action)} disabled={!canRecordOther} />
                        </div>
                    </>}
                </DialogContent>
            </Dialog>

             <Dialog open={!!subPlayerInfo} onOpenChange={(isOpen) => !isOpen && setSubPlayerInfo(null)}>
                <DialogContent className="max-w-4xl">
                    {subPlayerInfo && <>
                        <DialogHeader><DialogTitle>Realizar Sustitución</DialogTitle><DialogDescription>Selecciona el jugador en pista que saldrá por {subPlayerInfo.player.firstName}.</DialogDescription></DialogHeader>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-4">
                            {(subPlayerInfo.teamType === 'home' ? homePlayers : awayPlayers).filter(p => (game[subPlayerInfo!.teamType === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds'] || []).includes(p.id))
                                .map(player => {
                                    const stats = game.playerStats?.[player.id] || { ...defaultStats, playerId: player.id, playerName: `${player.firstName} ${player.lastName}` };
                                    const isChild = parentChildInfo.childIds.has(player.id);
                                    return <PlayerStatCard key={player.id} player={player} stats={stats as PlayerGameStats} onClick={() => handleCourtPlayerClickInSubDialog(player)} userProfileType={profile.profileTypeId} isChild={isChild}/>
                                })
                            }
                        </div>
                    </>
                    }
                </DialogContent>
            </Dialog>

             <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" asChild><Link href={`/games`}><ChevronLeft className="mr-2 h-4 w-4" />Volver a la Lista de Partidos</Link></Button>
                <Button variant="secondary" size="sm" onClick={() => fetchGameData(true)}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Actualizar Datos
                </Button>
            </div>
            
            <Card>
                <CardHeader className="text-center"><CardTitle className="text-2xl">Control del Partido</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-2">
                    {canManageControls && <Button size="lg" onClick={() => setIsAssignmentDialogOpen(true)}><UserCheck className="mr-2 h-5 w-5"/>Asignar Anotadores</Button> }
                    {game.status === 'scheduled' && canManageControls && <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={() => handleGameStatusChange('inprogress')}><Play className="mr-2 h-5 w-5"/> Empezar Partido</Button>}
                    {game.status === 'inprogress' && canManageControls && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="lg" variant="destructive" className="w-full">
                                <Flag className="mr-2 h-5 w-5"/> Finalizar Partido
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Finalizar el partido?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Esta acción marcará el partido como completado y no se podrá deshacer. ¿Estás seguro?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleGameStatusChange('completed')} className="bg-destructive hover:bg-destructive/80">
                                Sí, Finalizar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {game.status === 'completed' && <p className="text-center font-bold text-lg text-green-700">Partido Finalizado</p>}
                </CardContent>
            </Card>

            {game.status !== 'scheduled' && <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2"><TimerIcon/> Tiempo y Período</CardTitle>
                        <CardDescription>Período: {game.currentPeriod || 'N/A'} de {gameFormat?.numPeriods || 'N/A'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-8xl font-mono text-center tracking-tighter py-4 bg-secondary text-secondary-foreground rounded-lg">{formatTime(displayTime)}</div>
                        {canManageControls && 
                            <div className="flex justify-center gap-2">
                                <Button onClick={handleToggleTimer} disabled={game.status !== 'inprogress'} size="lg">
                                    {game.isTimerRunning ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                                    {game.isTimerRunning ? 'Pausar' : 'Iniciar'}
                                </Button>
                                <Button onClick={handleEndPeriod} disabled={game.status !== 'inprogress' || isEndingPeriod} variant="outline" size="lg">
                                    {isEndingPeriod ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FastForward className="mr-2"/>}
                                    {isEndingPeriod ? 'Finalizando...' : 'Finalizar Período'}
                                </Button>
                                <Button onClick={handleResetTimer} disabled={game.status !== 'inprogress'} variant="secondary" size="icon" aria-label="Reiniciar cronómetro"><TimerReset/></Button>
                            </div>
                        }
                    </CardContent>
                </Card>
            }
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamPanel teamType="home" playersList={homePlayers} />
                <TeamPanel teamType="away" playersList={awayPlayers} />
            </div>
        </div>
    )
}
