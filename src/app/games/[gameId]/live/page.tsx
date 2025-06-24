"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateLiveGameState } from '@/app/games/actions';
import type { Game } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ChevronLeft, Gamepad2, Minus, Plus, Play, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ScoreButton = ({ children, onClick, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="outline" size="lg" className="text-xl font-bold" onClick={onClick} {...props}>
        {children}
    </Button>
);

export default function LiveGamePage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';

    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real-time listener for game updates
    useEffect(() => {
        if (!gameId) {
            setError("ID del partido no encontrado.");
            setLoading(false);
            return;
        }
        const gameRef = doc(db, 'games', gameId);
        const unsubscribe = onSnapshot(gameRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setGame({
                    id: docSnap.id,
                    ...data,
                    date: data.date.toDate(),
                } as Game);
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
    }, [gameId]);

    const handleUpdate = async (updates: Partial<Pick<Game, 'status' | 'homeTeamScore' | 'awayTeamScore' | 'currentPeriod'>>) => {
        const result = await updateLiveGameState(gameId, updates);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error al Actualizar', description: result.error });
        }
    };

    const handleScoreChange = (team: 'home' | 'away', points: number) => {
        if (!game || game.status !== 'inprogress') return;
        const currentScore = team === 'home' ? game.homeTeamScore || 0 : game.awayTeamScore || 0;
        const newScore = currentScore + points;
        
        if (newScore < 0) return;

        if (team === 'home') {
            handleUpdate({ homeTeamScore: newScore });
        } else {
            handleUpdate({ awayTeamScore: newScore });
        }
    }
    
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

    const renderGameControls = () => {
        switch (game.status) {
            case 'scheduled':
                return (
                    <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleUpdate({ status: 'inprogress', homeTeamScore: 0, awayTeamScore: 0, currentPeriod: 1 })}>
                        <Play className="mr-2 h-5 w-5"/> Empezar Partido
                    </Button>
                )
            case 'inprogress':
                 return (
                    <Button size="lg" variant="destructive" className="w-full" onClick={() => handleUpdate({ status: 'completed' })}>
                        <Flag className="mr-2 h-5 w-5"/> Finalizar Partido
                    </Button>
                )
            case 'completed':
                 return <p className="text-center font-bold text-lg">Partido Finalizado</p>
            default:
                return null;
        }
    }
    
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
                    {renderGameControls()}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Team */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="truncate">{game.homeTeamName}</CardTitle>
                        <CardDescription>Equipo Local</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="text-8xl font-bold text-primary">{game.homeTeamScore ?? 0}</div>
                        <div className="grid grid-cols-4 gap-2">
                             <ScoreButton disabled={game.status !== 'inprogress'} onClick={() => handleScoreChange('home', 1)}>+1</ScoreButton>
                             <ScoreButton disabled={game.status !== 'inprogress'} onClick={() => handleScoreChange('home', 2)}>+2</ScoreButton>
                             <ScoreButton disabled={game.status !== 'inprogress'} onClick={() => handleScoreChange('home', 3)}>+3</ScoreButton>
                             <ScoreButton disabled={game.status !== 'inprogress'} variant="destructive" onClick={() => handleScoreChange('home', -1)}><Minus/></ScoreButton>
                        </div>
                    </CardContent>
                </Card>

                 {/* Away Team */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="truncate">{game.awayTeamName}</CardTitle>
                        <CardDescription>Equipo Visitante</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="text-8xl font-bold text-primary">{game.awayTeamScore ?? 0}</div>
                        <div className="grid grid-cols-4 gap-2">
                             <ScoreButton disabled={game.status !== 'inprogress'} onClick={() => handleScoreChange('away', 1)}>+1</ScoreButton>
                             <ScoreButton disabled={game.status !== 'inprogress'} onClick={() => handleScoreChange('away', 2)}>+2</ScoreButton>
                             <ScoreButton disabled={game.status !== 'inprogress'} onClick={() => handleScoreChange('away', 3)}>+3</ScoreButton>
                             <ScoreButton disabled={game.status !== 'inprogress'} variant="destructive" onClick={() => handleScoreChange('away', -1)}><Minus/></ScoreButton>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
