"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getUserProfileById } from '@/lib/actions/users';
import { getClubById } from '@/lib/actions/clubs';
import { getTeamsByClubId } from '@/lib/actions/teams';
import { getCompetitionCategories } from '@/lib/actions/competition-categories';
import type { Club, Team, UserFirestoreProfile, CompetitionCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, ChevronLeft, Building, Users, PlusCircle, Shield, Settings } from 'lucide-react';

export default function ClubManagementPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const clubId = typeof params.clubId === 'string' ? params.clubId : '';

    const [club, setClub] = useState<Club | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
    const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
    const [hasPermission, setHasPermission] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPageData = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            if (!clubId) {
                throw new Error("Club ID is missing from the URL.");
            }
            
            const profile = await getUserProfileById(userId);
            setUserProfile(profile);

            const isSuperAdmin = profile?.profileTypeId === 'super_admin';
            const isClubAdmin = profile?.profileTypeId === 'club_admin' && profile.clubId === clubId;
            const isCoordinator = profile?.profileTypeId === 'coordinator' && profile.clubId === clubId;

            if (!isSuperAdmin && !isClubAdmin && !isCoordinator) {
                throw new Error("Access Denied. You do not have permission to manage this club.");
            }
            setHasPermission(true);

            // Fetch club, team, and category data in parallel
            const [clubData, teamsData, categoriesData] = await Promise.all([
                getClubById(clubId),
                getTeamsByClubId(clubId),
                getCompetitionCategories()
            ]);

            if (!clubData) {
                throw new Error("Club not found.");
            }
            
            setClub(clubData);
            setTeams(teamsData);
            setCompetitionCategories(categoriesData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clubId]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/clubs/${clubId}`);
            return;
        }
        loadPageData(user.uid);
    }, [clubId, user, authLoading, router, loadPageData]);
    
    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading club details...</p>
            </div>
        );
    }
    
    if (error || !hasPermission) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error || "An unknown error occurred."}</p>
                 <Button asChild variant="outline">
                    <Link href="/games">Volver a Partidos</Link>
                </Button>
            </div>
        );
    }

    if (!club) {
        return null; // Should be covered by error state
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
                       <Building className="mr-4 h-10 w-10"/> {club.name}
                    </CardTitle>
                    <CardDescription className="text-lg">
                       {club.city_name}, {club.province_name}
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6"/>Club Teams</CardTitle>
                        <CardDescription>
                            Manage the teams associated with this club.
                        </CardDescription>
                    </div>
                     <Button asChild>
                        <Link href={`/clubs/${clubId}/teams/new`}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New Team
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {teams.length === 0 ? (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No Teams Found</h2>
                            <p className="text-muted-foreground">This club doesn't have any teams yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Team Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teams.map(team => (
                                    <TableRow key={team.id}>
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell>
                                            {competitionCategories.find(c => c.id === team.competitionCategoryId)?.name || team.competitionCategoryId || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <Button asChild size="sm" variant="outline">
                                                <Link href={`/clubs/${clubId}/teams/${team.id}`}>
                                                   <Settings className="mr-2 h-4 w-4" /> Manage Team
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
