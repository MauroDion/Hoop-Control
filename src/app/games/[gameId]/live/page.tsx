"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { updateLiveGameState, recordGameEvent, substitutePlayer } from '@/app/games/actions';
import { getGameFormatById } from '@/app/game-formats/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import type { Game, GameFormat, Player, GameEvent, GameEventAction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, ChevronLeft, Play, Flag, Pause, TimerReset, FastForward, Timer as TimerIcon, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ActionButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="outline" className="w-full h-12 text-xs md:text-sm" {...props}>
        {children}
    </Button>
);

export default function LiveGamePage() {
    const params = useParams();
    const { toast } = useToast();
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const { loading: authLoading } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [gameFormat, setGameFormat] = useState<GameFormat | null>(null);
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
    const [events, setEvents] = useState<GameEvent[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<{ id: string, teamId: 'home' | 'away', name: string } | null>(null);
    
    const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);
    const [playerToSubIn, setPlayerToSubIn] = useState<Player | null>(null);
    
    const [displayTime, setDisplayTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => setIsClient(true), []);

    const fetchPlayers = useCallback(async (gameData: Game) => {
        if (gameData.homeTeamId) setHomePlayers(await getPlayersByTeamId(gameData.homeTeamId));
        if (gameData.awayTeamId) setAwayPlayers(await getPlayersByTeamId(gameData.awayTeamId));
    }, []);

    useEffect(() => {
        if (!gameId) {
            setError("ID del partido no encontrado.");
            setLoading(false);
            return;
        }

        const gameRef = doc(db, 'games', gameId);
        const unsubscribeGame = onSnapshot(gameRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const gameData = { 
                    id: docSnap.id, 
                    ...data, 
                    date: data.date.toDate().toISOString(),
                    createdAt: data.createdAt?.toDate().toISOString(),
                    updatedAt: data.updatedAt?.toDate().toISOString(),
                 } as Game;
                setGame(gameData);
                fetchPlayers(gameData);
                
                if (!gameFormat && gameData.gameFormatId) {
                    const format = await getGameFormatById(gameData.gameFormatId);
                    setGameFormat(format);
                }
            } else {
                setError("El partido no existe o ha sido eliminado.");
            }
            setLoading(false);
        }, (err) => {
            setError("No se pudo conectar para recibir actualizaciones del partido.");
            setLoading(false);
        });

        const eventsQuery = query(collection(db, 'games', gameId, 'events'), orderBy('createdAt', 'desc'), limit(10));
        const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
            setEvents(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: doc.data().createdAt?.toDate().toISOString() } as GameEvent)));
        });

        return () => {
            unsubscribeGame();
            unsubscribeEvents();
        };
    }, [gameId, gameFormat, fetchPlayers]);

    useEffect(() => {
       if (game?.isTimerRunning && displayTime > 0) {
           const timerId = setInterval(() => setDisplayTime(prev => prev > 0 ? prev - 1 : 0), 1000);
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
        if (!result.success) toast({ variant: 'destructive', title: 'Error al Actualizar', description: result.error });
    }, [gameId, toast]);
    
    const handleToggleTimer = () => {
        if (!game) return;
        const newIsTimerRunning = !game.isTimerRunning;
        const updates: Partial<Game> = { isTimerRunning: newIsTimerRunning };
        if (!newIsTimerRunning) updates.periodTimeRemainingSeconds = displayTime;
        handleUpdate(updates);
    };

    const handleRecordAction = async (action: GameEventAction) => {
        if (!game || !selectedPlayer) return;
        await recordGameEvent(gameId, {
            teamId: selectedPlayer.teamId,
            playerId: selectedPlayer.id,
            playerName: selectedPlayer.name,
            action,
            period: game.currentPeriod || 1,
            gameTimeSeconds: displayTime,
        });
        setSelectedPlayer(null);
    };

    const handleSubstitution = async (playerOut: Player) => {
        if (!game || !playerToSubIn) return;
        const teamId = homePlayers.some(p => p.id === playerToSubIn.id) ? 'home' : 'away';
        const result = await substitutePlayer(gameId, teamId, playerToSubIn.id, playerOut.id);
        if (result.success) {
            toast({ title: 'Sustitución Realizada', description: `${playerToSubIn.firstName} entra por ${playerOut.firstName}.` });
        } else {
             toast({ variant: 'destructive', title: 'Error en la Sustitución', description: result.error });
        }
        setIsSubDialogOpen(false);
        setPlayerToSubIn(null);
    }

    const openSubDialog = (player: Player) => {
        const teamId = homePlayers.some(p => p.id === player.id) ? 'home' : 'away';
        const onCourtPlayers = teamId === 'home' ? homeOnCourt : awayOnCourt;

        if (onCourtPlayers.length >= 5) {
            setPlayerToSubIn(player);
            setIsSubDialogOpen(true);
        } else {
            substitutePlayer(gameId, teamId, player.id, null).then(result => {
                if (result.success) {
                    toast({ title: 'Jugador en Pista', description: `${player.firstName} ha entrado al partido.` });
                } else {
                    toast({ variant: 'destructive', title: 'Error al añadir jugador', description: result.error });
                }
            });
        }
    };

    const { homeOnCourt, homeBench, awayOnCourt, awayBench } = useMemo(() => {
        const safeGame = game || {};
        return {
            homeOnCourt: homePlayers.filter(p => safeGame.homeTeamOnCourtPlayerIds?.includes(p.id)),
            homeBench: homePlayers.filter(p => !safeGame.homeTeamOnCourtPlayerIds?.includes(p.id)),
            awayOnCourt: awayPlayers.filter(p => safeGame.awayTeamOnCourtPlayerIds?.includes(p.id)),
            awayBench: awayPlayers.filter(p => !safeGame.awayTeamOnCourtPlayerIds?.includes(p.id)),
        }
    }, [homePlayers, awayPlayers, game]);

    const formatTime = (totalSeconds: number) => `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
    
    if (loading || authLoading) return <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto my-20" />;
    if (error) return <AlertTriangle className="h-12 w-12 text-destructive mx-auto my-20" />;
    if (!game) return null;

    const TeamPanel = ({ teamType, onCourt, bench }: { teamType: 'home' | 'away', onCourt: Player[], bench: Player[]}) => (
        <Card className="flex flex-col">
            <CardHeader className="text-center">
                <CardTitle className="truncate text-xl">{teamType === 'home' ? game.homeTeamName : game.awayTeamName}</CardTitle>
                <div className="text-6xl font-bold text-primary pt-2">{teamType === 'home' ? game.homeTeamScore : game.awayTeamScore}</div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
                 <div>
                    <h4 className="font-semibold text-center mb-2">En Pista</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {onCourt.map(p => <Button key={p.id} variant={selectedPlayer?.id === p.id ? 'default' : 'outline'} className="h-auto flex flex-col p-2" onClick={() => setSelectedPlayer({id: p.id, teamId: teamType, name: `${p.firstName} ${p.lastName}`})}>
                                <span className="font-bold text-lg">{p.jerseyNumber || 'S/N'}</span>
                                <span className="text-xs truncate w-full">{p.firstName}</span>
                            </Button>)}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-center mb-2">Banquillo</h4>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {bench.map(p => <Button key={p.id} variant="secondary" className="h-auto flex flex-col p-2" onClick={() => openSubDialog(p)}><span className="font-bold text-lg">{p.jerseyNumber || 'S/N'}</span><span className="text-xs truncate w-full">{p.firstName}</span></Button>)}
                    </div>
                 </div>
            </CardContent>
        </Card>
    );

    const renderActionButtons = () => (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ActionButton onClick={() => handleRecordAction('shot_made_1p')}>+1 Pto.</ActionButton>
            <ActionButton onClick={() => handleRecordAction('shot_miss_1p')}>Fallo 1 Pto.</ActionButton>
            <ActionButton onClick={() => handleRecordAction('shot_made_2p')}>+2 Ptos.</ActionButton>
            <ActionButton onClick={() => handleRecordAction('shot_miss_2p')}>Fallo 2 Ptos.</ActionButton>
            <ActionButton onClick={() => handleRecordAction('shot_made_3p')}>+3 Ptos.</ActionButton>
            <ActionButton onClick={() => handleRecordAction('shot_miss_3p')}>Fallo 3 Ptos.</ActionButton>
            <ActionButton onClick={() => handleRecordAction('rebound_offensive')}>Reb. Of.</ActionButton>
            <ActionButton onClick={() => handleRecordAction('rebound_defensive')}>Reb. Def.</ActionButton>
            <ActionButton onClick={() => handleRecordAction('assist')}>Asistencia</ActionButton>
            <ActionButton onClick={() => handleRecordAction('steal')}>Robo</ActionButton>
            <ActionButton onClick={() => handleRecordAction('block')}>Tapón</ActionButton>
            <ActionButton onClick={() => handleRecordAction('turnover')}>Pérdida</ActionButton>
            <ActionButton onClick={() => handleRecordAction('foul')}>Falta</ActionButton>
        </div>
    );

    return (
        <div className="space-y-6">
            <Dialog open={isSubDialogOpen} onOpenChange={setIsSubDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Realizar Sustitución</DialogTitle><DialogDescription>Selecciona el jugador que saldrá de la pista para que entre {playerToSubIn?.firstName}.</DialogDescription></DialogHeader>
                    <div className="grid grid-cols-3 gap-2 py-4">
                        {(playerToSubIn && (homePlayers.some(p => p.id === playerToSubIn.id) ? homeOnCourt : awayOnCourt)).map(p => <Button key={p.id} variant="outline" onClick={() => handleSubstitution(p)}>{p.firstName} #{p.jerseyNumber}</Button>)}
                    </div>
                </DialogContent>
            </Dialog>
            <div className="flex justify-between items-center">
                 <Button variant="outline" size="sm" asChild>
                    <Link href={`/games`}><ChevronLeft className="mr-2 h-4 w-4" />Volver</Link>
                </Button>
                <div className="text-center">
                    <h1 className="font-bold text-xl">Partido en Vivo</h1>
                    <p className="text-sm text-muted-foreground">{format(new Date(game.date), "PPP", { locale: es })}</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => openSubDialog(selectedPlayer ? homePlayers.find(p=>p.id===selectedPlayer.id) || awayPlayers.find(p=>p.id===selectedPlayer.id)! : null)} disabled={!selectedPlayer}>
                    <Repeat className="h-4 w-4"/>
                    <span className="sr-only">Sustituir</span>
                </Button>
            </div>
            
             <Card>
                <CardContent className="flex flex-col items-center gap-4 p-4">
                     <div className="text-6xl font-mono text-center tracking-tighter py-2 px-4 bg-secondary text-secondary-foreground rounded-lg">
                        {isClient ? formatTime(displayTime) : '00:00'}
                    </div>
                    <div className="flex justify-center flex-wrap gap-2">
                        {game.status === 'scheduled' && <Button size="lg" className="w-full md:w-auto bg-green-600 hover:bg-green-700" onClick={() => handleUpdate({ status: 'inprogress', periodTimeRemainingSeconds: (gameFormat?.periodDurationMinutes || 10) * 60 })}><Play className="mr-2"/> Empezar Partido</Button>}
                        {game.status === 'inprogress' && (<>
                                <Button onClick={handleToggleTimer} size="lg">{game.isTimerRunning ? <><Pause className="mr-2"/>Pausar</> : <><Play className="mr-2"/>Iniciar</>}</Button>
                                <Button onClick={handleNextPeriod} disabled={game.isTimerRunning || (game.currentPeriod || 0) >= (gameFormat?.numPeriods || 4)} variant="outline" size="lg"><FastForward className="mr-2"/> Siguiente Per.</Button>
                                <Button onClick={handleResetTimer} variant="secondary" size="icon" aria-label="Reiniciar"><TimerReset/></Button>
                                <Button size="lg" variant="destructive" className="w-full mt-2 md:mt-0 md:w-auto" onClick={() => handleUpdate({ status: 'completed', isTimerRunning: false })}><Flag className="mr-2"/> Finalizar</Button>
                        </>)}
                        {game.status === 'completed' && <p className="text-center font-bold text-lg text-green-700">Partido Finalizado</p>}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <TeamPanel teamType="home" onCourt={homeOnCourt} bench={homeBench} />
                <Card className="lg:sticky lg:top-24">
                     <CardHeader><CardTitle className="text-center">Registrar Acción</CardTitle><CardDescription className="text-center truncate h-5">{selectedPlayer ? `Para: ${selectedPlayer.name}` : 'Selecciona un jugador'}</CardDescription></CardHeader>
                     <CardContent className={cn(!selectedPlayer && 'opacity-50 pointer-events-none')}>{renderActionButtons()}</CardContent>
                </Card>
                <TeamPanel teamType="away" onCourt={awayOnCourt} bench={awayBench} />
            </div>
             <Card>
                 <CardHeader><CardTitle>Eventos Recientes</CardTitle></CardHeader>
                 <CardContent>
                    <ul className="space-y-2 max-h-48 overflow-y-auto text-sm">
                    {events.map(event => (<li key={event.id} className="p-2 bg-muted/50 rounded-md">
                           <span className="font-bold">{event.teamId === 'home' ? game.homeTeamName : game.awayTeamName}</span> ({event.playerName}): {event.action.replace(/_/g, ' ')}
                           <span className="text-muted-foreground text-xs ml-2">({event.createdAt ? format(new Date(event.createdAt), 'HH:mm:ss') : ''})</span>
                        </li>))}
                    </ul>
                 </CardContent>
            </Card>
        </div>
    );
}
