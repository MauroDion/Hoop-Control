"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateLiveGameState, recordGameEvent } from '@/app/games/actions';
import { getGameFormatById } from '@/app/game-formats/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import type { Game, GameFormat, Player, GameEvent, GameEventAction, TeamStats } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ChevronLeft, Gamepad2, Play, Flag, Pause, TimerReset, FastForward, Timer as TimerIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
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
    
    const [displayTime, setDisplayTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch players whenever the game data is updated
    useEffect(() => {
        const fetchPlayers = async () => {
            if (!game) return;

            if (game.homeTeamId) {
                const allHomePlayers = await getPlayersByTeamId(game.homeTeamId);
                // If roster is defined and not empty, use it. Otherwise, use all players.
                const homeRoster = (game.homeTeamPlayerIds && game.homeTeamPlayerIds.length > 0)
                    ? allHomePlayers.filter(p => game.homeTeamPlayerIds!.includes(p.id))
                    : allHomePlayers;
                setHomePlayers(homeRoster);
            }
             if (game.awayTeamId) {
                const allAwayPlayers = await getPlayersByTeamId(game.awayTeamId);
                 // If roster is defined and not empty, use it. Otherwise, use all players.
                const awayRoster = (game.awayTeamPlayerIds && game.awayTeamPlayerIds.length > 0)
                    ? allAwayPlayers.filter(p => game.awayTeamPlayerIds!.includes(p.id))
                    : allAwayPlayers;
                setAwayPlayers(awayRoster);
            }
        };
        fetchPlayers();
    }, [game]);

    // Main useEffect for subscribing to game and event data
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
            const fetchedEvents = snapshot.docs.map(doc => {
                 const eventData = doc.data();
                 return { ...eventData, id: doc.id, createdAt: eventData.createdAt?.toDate().toISOString() } as GameEvent
            });
            setEvents(fetchedEvents);
        });

        return () => {
            unsubscribeGame();
            unsubscribeEvents();
        };
    }, [gameId, gameFormat]);

    // Client-side timer logic
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
        
        setSelectedPlayer(null); // Deselect player after action
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

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    if (loading || authLoading) return <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto my-20" />;
    if (error) return <AlertTriangle className="h-12 w-12 text-destructive mx-auto my-20" />;
    if (!game) return null;

    const TeamRosterPanel = ({ players, teamType }: { players: Player[], teamType: 'home' | 'away'}) => (
        <div className="space-y-2">
            <h3 className="font-bold text-center">{teamType === 'home' ? game.homeTeamName : game.awayTeamName}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {players.map(player => (
                    <Button 
                        key={player.id} 
                        variant={selectedPlayer?.id === player.id ? 'default' : 'outline'}
                        className="h-auto flex flex-col p-2"
                        onClick={() => setSelectedPlayer({id: player.id, teamId: teamType, name: `${player.firstName} ${player.lastName}`})}
                    >
                        <span className="font-bold text-lg">{player.jerseyNumber || 'S/N'}</span>
                        <span className="text-xs truncate">{player.firstName} {player.lastName}</span>
                    </Button>
                ))}
                 {players.length === 0 && <p className="text-xs text-muted-foreground col-span-full text-center">No hay jugadores en la convocatoria para este equipo.</p>}
            </div>
        </div>
    );
    
    const renderActionButtons = () => (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ActionButton onClick={() => handleRecordAction('shot_made_2p')}>Canasta de 2</ActionButton>
            <ActionButton onClick={() => handleRecordAction('shot_miss_2p')}>Fallo de 2</ActionButton>
            <ActionButton onClick={() => handleRecordAction('shot_made_3p')}>Canasta de 3</ActionButton>
            <ActionButton onClick={() => handleRecordAction('shot_miss_3p')}>Fallo de 3</ActionButton>
            <ActionButton onClick={() => handleRecordAction('shot_made_1p')}>Tiro Libre Anotado</ActionButton>
            <ActionButton onClick={() => handleRecordAction('shot_miss_1p')}>Tiro Libre Fallado</ActionButton>
            <ActionButton onClick={() => handleRecordAction('rebound')}>Rebote</ActionButton>
            <ActionButton onClick={() => handleRecordAction('assist')}>Asistencia</ActionButton>
            <ActionButton onClick={() => handleRecordAction('steal')}>Robo</ActionButton>
            <ActionButton onClick={() => handleRecordAction('block')}>Tapón</ActionButton>
            <ActionButton onClick={() => handleRecordAction('turnover')}>Pérdida</ActionButton>
            <ActionButton onClick={() => handleRecordAction('foul')}>Falta Personal</ActionButton>
        </div>
    );

    return (
        <div className="space-y-6">
             <Button variant="outline" size="sm" asChild>
                <Link href={`/games`}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver a la Lista de Partidos
                </Link>
            </Button>
            
            <Card>
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl md:text-2xl">{game.homeTeamName} vs {game.awayTeamName}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center px-4">
                    <span className="text-5xl md:text-7xl font-bold text-primary">{game.homeTeamScore ?? 0}</span>
                    <div className="text-center">
                        <p className="font-bold text-lg">Período {game.currentPeriod || 1}</p>
                        <p className="text-3xl md:text-5xl font-mono tracking-tighter">{formatTime(displayTime)}</p>
                    </div>
                    <span className="text-5xl md:text-7xl font-bold text-primary">{game.awayTeamScore ?? 0}</span>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Control del Partido</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row justify-center items-center gap-2">
                    {game.status === 'scheduled' && (
                        <Button size="lg" className="w-full md:w-auto bg-green-600 hover:bg-green-700" onClick={() => handleUpdate({ status: 'inprogress', periodTimeRemainingSeconds: (gameFormat?.periodDurationMinutes || 10) * 60 })}>
                            <Play className="mr-2 h-5 w-5"/> Empezar Partido
                        </Button>
                    )}
                     {game.status === 'inprogress' && (
                        <>
                            <Button onClick={handleToggleTimer} size="lg">
                                {game.isTimerRunning ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                                {game.isTimerRunning ? 'Pausar' : 'Iniciar'}
                            </Button>
                             <Button onClick={handleNextPeriod} disabled={game.isTimerRunning || (game.currentPeriod || 0) >= (gameFormat?.numPeriods || 4)} variant="outline" size="lg">
                                <FastForward className="mr-2"/> Siguiente Período
                            </Button>
                             <Button onClick={handleResetTimer} variant="secondary" size="icon" aria-label="Reiniciar cronómetro"><TimerReset/></Button>
                             <Button size="lg" variant="destructive" className="w-full mt-2 md:mt-0 md:w-auto" onClick={() => handleUpdate({ status: 'completed', isTimerRunning: false })}>
                                <Flag className="mr-2 h-5 w-5"/> Finalizar Partido
                            </Button>
                        </>
                    )}
                    {game.status === 'completed' && <p className="text-center font-bold text-lg text-green-700">Partido Finalizado</p>}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader><CardTitle>Anotación</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <TeamRosterPanel teamType="home" players={homePlayers} />
                         <TeamRosterPanel teamType="away" players={awayPlayers} />
                    </div>
                    <Separator />
                     <div>
                        <h3 className="text-lg font-semibold text-center mb-2">
                           {selectedPlayer ? `Registrar acción para: ${selectedPlayer.name}` : 'Selecciona un jugador para registrar una acción'}
                        </h3>
                        <div className={cn(!selectedPlayer && 'opacity-50 pointer-events-none')}>
                            {renderActionButtons()}
                        </div>
                    </div>
                 </CardContent>
            </Card>

            <Card>
                 <CardHeader><CardTitle>Registro de Eventos Recientes</CardTitle></CardHeader>
                 <CardContent>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {events.map(event => (
                        <li key={event.id} className="text-sm p-2 bg-muted/50 rounded-md">
                           <span className="font-bold">
                             {event.teamId === 'home' ? game.homeTeamName : game.awayTeamName}
                           </span> ({event.playerName}): {event.action.replace(/_/g, ' ')}
                           <span className="text-muted-foreground text-xs ml-2">
                               ({event.createdAt ? format(new Date(event.createdAt), 'HH:mm:ss') : ''})
                           </span>
                        </li>
                    ))}
                    </ul>
                 </CardContent>
            </Card>

        </div>
    );
}
