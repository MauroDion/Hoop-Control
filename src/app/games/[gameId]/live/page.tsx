"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateLiveGameState, recordGameEvent, getGameEvents } from '@/app/games/actions';
import { getGameFormatById } from '@/app/game-formats/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import type { Game, GameFormat, Player, GameEvent, GameEventAction } from '@/types';

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
    const { user, loading: authLoading } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [gameFormat, setGameFormat] = useState<GameFormat | null>(null);
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
    const [events, setEvents] = useState<GameEvent[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<{ id: string, teamId: 'home' | 'away', name: string } | null>(null);
    
    const [displayTime, setDisplayTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial data fetch
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
                const gameData = { id: docSnap.id, ...data, date: data.date.toDate().toISOString() } as Game;
                setGame(gameData);
                
                if (!gameFormat && gameData.gameFormatId) {
                    const format = await getGameFormatById(gameData.gameFormatId);
                    setGameFormat(format);
                }

                if(homePlayers.length === 0 && gameData.homeTeamId) {
                    const players = await getPlayersByTeamId(gameData.homeTeamId);
                    setHomePlayers(players.filter(p => gameData.homeTeamPlayerIds?.includes(p.id)));
                }
                if(awayPlayers.length === 0 && gameData.awayTeamId) {
                     const players = await getPlayersByTeamId(gameData.awayTeamId);
                    setAwayPlayers(players.filter(p => gameData.awayTeamPlayerIds?.includes(p.id)));
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
            const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameEvent));
            setEvents(fetchedEvents);
        });

        return () => {
            unsubscribeGame();
            unsubscribeEvents();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId]);

    // Timer logic
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
    
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    if (loading || authLoading) return <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto my-20" />;
    if (error) return <AlertTriangle className="h-12 w-12 text-destructive mx-auto my-20" />;
    if (!game) return null;

    const TeamRosterPanel = ({ team, players, teamType }: { team: 'home' | 'away', players: Player[]}) => (
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
                 <CardHeader><CardTitle>Anotación</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <TeamRosterPanel team="home" players={homePlayers} />
                         <TeamRosterPanel team="away" players={awayPlayers} />
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
                    <ul className="space-y-2">
                    {events.map(event => (
                        <li key={event.id} className="text-sm p-2 bg-muted/50 rounded-md">
                           <span className="font-bold">
                             {event.teamId === 'home' ? game.homeTeamName : game.awayTeamName}
                           </span>: {event.action.replace(/_/g, ' ')}
                           <span className="text-muted-foreground text-xs ml-2">
                               ({format(new Date(event.createdAt), 'HH:mm:ss')})
                           </span>
                        </li>
                    ))}
                    </ul>
                 </CardContent>
            </Card>

        </div>
    );
}

