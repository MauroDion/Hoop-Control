
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { getClubById } from '@/app/clubs/actions';
import { getTeamsByClubId } from '@/app/teams/actions';
import { getGameFormats } from "@/app/game-formats/actions";
import { getCompetitionCategories } from "@/app/competition-categories/actions";

import type { Club, Team, GameFormat, CompetitionCategory } from '@/types';

import { TeamForm } from "@/components/teams/TeamForm";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, Building, Users, PlusCircle, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function ClubManagementPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const clubId = typeof params.clubId === 'string' ? params.clubId : '';

    const [club, setClub] = useState<Club | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
    const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPageData = async () => {
        setLoadingData(true);
        setError(null);
        try {
            if (!clubId) {
                setError("Club ID is missing from the URL.");
                return;
            }
            const [clubData, teamsData, formatsData, categoriesData] = await Promise.all([
                getClubById(clubId),
                getTeamsByClubId(clubId),
                getGameFormats(),
                getCompetitionCategories()
            ]);

            if (!clubData) {
                setError("Club not found.");
            } else {
                setClub(clubData);
                setTeams(teamsData);
                setGameFormats(formatsData);
                setCompetitionCategories(categoriesData);
            }
        } catch (err: any) {
            console.error("Failed to load club management data:", err);
            setError(err.message || "Failed to load data.");
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/clubs/${clubId}`);
            return;
        }
        loadPageData();
    }, [clubId, user, authLoading, router]);

    if (authLoading || (loadingData && !error)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">
                    {authLoading ? "Authenticating..." : "Loading club data..."}
                </p>
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
                    <Link href="/clubs">Back to Clubs List</Link>
                </Button>
            </div>
        );
    }

    if (!club) {
        // This case is handled by error state, but as a fallback
        return <p>Club not found.</p>;
    }
    
    return (
        <div className="space-y-8">
            <Button variant="outline" size="sm" asChild>
                <Link href="/clubs">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to All Clubs
                </Link>
            </Button>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline font-bold text-primary flex items-center">
                       <Building className="mr-3 h-10 w-10" /> {club.name}
                    </CardTitle>
                    <CardDescription>
                        Managing club details and teams.
                        {club.city_name && `, located in ${club.city_name}`}
                    </CardDescription>
                </CardHeader>
            </Card>
            
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6"/> Teams</CardTitle>
                    <CardDescription>
                        List of teams registered for {club.name}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingData ? (
                        <div className="flex justify-center items-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No Teams Found</h2>
                            <p className="text-muted-foreground">This club doesn't have any teams yet. Create one below.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Team Name</TableHead>
                                    <TableHead>Competition</TableHead>
                                    <TableHead>Game Format</TableHead>
                                    <TableHead>Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teams.map((team) => (
                                    <TableRow key={team.id}>
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell>{competitionCategories.find(c => c.id === team.competitionCategoryId)?.name || 'N/A'}</TableCell>
                                        <TableCell>{gameFormats.find(f => f.id === team.gameFormatId)?.name || 'N/A'}</TableCell>
                                        <TableCell>{format(team.createdAt, 'PP')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline flex items-center">
                        <PlusCircle className="mr-3 h-8 w-8 text-primary" />
                        Create New Team
                    </CardTitle>
                    <CardDescription>Add a new team to {club.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TeamForm
                        clubId={clubId}
                        gameFormats={gameFormats}
                        competitionCategories={competitionCategories}
                        onFormSubmit={loadPageData}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
