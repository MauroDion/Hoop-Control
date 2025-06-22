
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { getTeamById } from '@/app/teams/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import { getUserProfileById, getUsersByProfileTypeAndClub } from '@/app/users/actions';

import type { Team, Player, UserFirestoreProfile } from '@/types';

import { PlayerForm } from "@/components/players/PlayerForm";
import { ManageCoachesForm } from '@/components/teams/ManageCoachesForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, Users, UserPlus, ChevronLeft, Shield } from 'lucide-react';

export default function TeamManagementPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const clubId = typeof params.clubId === 'string' ? params.clubId : '';
    const teamId = typeof params.teamId === 'string' ? params.teamId : '';

    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
    const [availableCoaches, setAvailableCoaches] = useState<UserFirestoreProfile[]>([]);
    const [canManageCoaches, setCanManageCoaches] = useState(false);

    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPageData = useCallback(async () => {
        if (!user) return;
        setLoadingData(true);
        setError(null);
        try {
            if (!teamId || !clubId) {
                setError("Team or Club ID is missing from the URL.");
                return;
            }
            const [teamData, playersData, profileData] = await Promise.all([
                getTeamById(teamId),
                getPlayersByTeamId(teamId),
                getUserProfileById(user.uid),
            ]);

            if (!teamData) {
                setError("Team not found.");
                setTeam(null);
            } else {
                setTeam(teamData);
                setPlayers(playersData);
            }

            if (!profileData) {
                setError("Could not load your user profile.");
                setUserProfile(null);
            } else {
                setUserProfile(profileData);
            }

            // Permission Check & Fetch Coaches
            if (teamData && profileData) {
                const isSuperAdmin = profileData.profileTypeId === 'super_admin';
                const isClubAdmin = profileData.profileTypeId === 'club_admin' && profileData.clubId === teamData.clubId;
                const isCoordinator = profileData.profileTypeId === 'coordinator' && teamData.coordinatorIds?.includes(profileData.uid);
                
                const hasPermission = isSuperAdmin || isClubAdmin || isCoordinator;
                setCanManageCoaches(hasPermission);

                if (hasPermission) {
                    const coaches = await getUsersByProfileTypeAndClub('coach', teamData.clubId);
                    setAvailableCoaches(coaches);
                }
            } else {
                setCanManageCoaches(false);
            }

        } catch (err: any) {
            console.error("Failed to load team management data:", err);
            setError(err.message || "Failed to load data.");
        } finally {
            setLoadingData(false);
        }
    }, [teamId, clubId, user]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/clubs/${clubId}/teams/${teamId}`);
            return;
        }
        loadPageData();
    }, [user, authLoading, router, loadPageData, clubId, teamId]);

    if (authLoading || (loadingData && !error)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">
                    {authLoading ? "Authenticating..." : "Loading team data..."}
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
                    <Link href={`/clubs/${clubId}`}>Back to Club Details</Link>
                </Button>
            </div>
        );
    }

    if (!team) {
        return <p>Team not found.</p>;
    }
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                 <Button variant="outline" size="sm" asChild>
                    <Link href={`/clubs/${clubId}`}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Club Page
                    </Link>
                </Button>
            </div>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline font-bold text-primary flex items-center">
                       <Shield className="mr-3 h-10 w-10" /> {team.name}
                    </CardTitle>
                    <CardDescription>
                        Managing team details and players.
                    </CardDescription>
                </CardHeader>
            </Card>

            {canManageCoaches && (
                <ManageCoachesForm 
                    teamId={teamId}
                    assignedCoachIds={team.coachIds || []}
                    availableCoaches={availableCoaches}
                    onFormSubmit={loadPageData}
                />
            )}
            
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6"/> Player Roster</CardTitle>
                    <CardDescription>
                        List of players registered for {team.name}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingData ? (
                        <div className="flex justify-center items-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : players.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No Players Found</h2>
                            <p className="text-muted-foreground">This team doesn't have any players yet. Add one below.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>First Name</TableHead>
                                    <TableHead>Last Name</TableHead>
                                    <TableHead>Jersey #</TableHead>
                                    <TableHead>Position</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {players.map((player) => (
                                    <TableRow key={player.id}>
                                        <TableCell className="font-medium">{player.firstName}</TableCell>
                                        <TableCell>{player.lastName}</TableCell>
                                        <TableCell>{player.jerseyNumber || 'N/A'}</TableCell>
                                        <TableCell>{player.position || 'N/A'}</TableCell>
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
                        <UserPlus className="mr-3 h-8 w-8 text-primary" />
                        Add New Player
                    </CardTitle>
                    <CardDescription>Add a new player to the "{team.name}" roster.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PlayerForm
                        clubId={clubId}
                        teamId={teamId}
                        onFormSubmit={loadPageData}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
