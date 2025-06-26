"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Actions
import { getGameById, getPlayerStatsForGame } from '@/app/games/actions';
import { getPlayersByTeamId } from '@/app/players/actions';

// Types
import type { Game, Player, PlayerGameStats } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ChevronLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const PlayerStatCard = ({ player, stats }: { player: Player; stats: PlayerGameStats; }) => {
    return (
        <Card className="p-2 relative aspect-[3/4] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="absolute top-2 left-2 text-xl font-bold text-green-600 bg-white/70 rounded-full h-8 w-8 flex items-center justify-center backdrop-blur-sm">
                {stats.points}
            </div>
            
            <div className="absolute bottom-2 right-2 text-xl font-bold text-blue-600 bg-white/70 rounded-full h-8 w-8 flex items-center justify-center backdrop-blur-sm">
                {stats.pir}
            </div>

            <div className="text-8xl font-black text-destructive/80" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                {player.jerseyNumber || 'S/N'}
            </div>

            <p className="absolute bottom-2 text-sm text-center font-semibold w-full truncate px-2 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-1">
                {player.firstName} {player.lastName}
            </p>
        </Card>
    );
};


export default function GameAnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';

    const [game, setGame] = useState<Game | null>(null);
    const [stats, setStats] = useState<PlayerGameStats[]>([]);
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [gameData, statsData] = await Promise.all([
                getGameById(gameId),
                getPlayerStatsForGame(gameId)
            ]);

            if (!gameData) throw new Error("Partido no encontrado.");
            setGame(gameData);
            setStats(statsData);
            
            const [homePlayersData, awayPlayersData] = await Promise.all([
                getPlayersByTeamId(gameData.homeTeamId),
                getPlayersByTeamId(gameData.awayTeamId),
            ]);
            setHomePlayers(homePlayersData);
            setAwayPlayers(awayPlayersData);

        } catch(err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [gameId]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/analysis/${gameId}`);
            return;
        }
        fetchData();
    }, [gameId, user, authLoading, router, fetchData]);

    const TeamStatsPanel = ({ teamName, teamPlayers, playerStats }: {teamName: string, teamPlayers: Player[], playerStats: PlayerGameStats[]}) => {
        const teamPlayerIds = new Set(teamPlayers.map(p => p.id));
        const filteredStats = playerStats.filter(s => teamPlayerIds.has(s.playerId));

        return (
            <div className="space-y-4">
                 <h2 className="text-2xl font-bold">{teamName}</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredStats.map(stat => {
                        const player = teamPlayers.find(p => p.id === stat.playerId);
                        if (!player) return null;
                        return <PlayerStatCard key={player.id} player={player} stats={stat} />
                    })}
                 </div>
                 {filteredStats.length === 0 && <p className="text-muted-foreground italic">No hay estadísticas disponibles para este equipo.</p>}
            </div>
        )
    }

    if (loading || authLoading) {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4">Cargando análisis del partido...</p>
          </div>
        );
    }
    
    if (error) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold text-destructive">Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild onClick={() => router.push('/analysis')} className="mt-4">
                <Link href="/analysis"><ChevronLeft className="h-4 w-4 mr-2"/>Volver al Análisis</Link>
            </Button>
          </div>
        );
    }
    
    if (!game) return null;

    return (
        <div className="space-y-8">
            <Button variant="outline" size="sm" asChild>
                <Link href="/analysis">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver a la Lista de Partidos
                </Link>
            </Button>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">{game.homeTeamName} vs {game.awayTeamName}</CardTitle>
                    <CardDescription className="text-center text-5xl font-black text-primary">
                        {game.homeTeamScore} - {game.awayTeamScore}
                    </CardDescription>
                </CardHeader>
            </Card>

            <TeamStatsPanel teamName={game.homeTeamName} teamPlayers={homePlayers} playerStats={stats} />
            <Separator />
            <TeamStatsPanel teamName={game.awayTeamName} teamPlayers={awayPlayers} playerStats={stats} />

        </div>
    );
}
