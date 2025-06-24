
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Actions
import { getUserProfileById } from '@/app/users/actions';
import { getTeamById } from '@/app/teams/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import { getClubById } from '@/app/clubs/actions';

// Types
import type { Club, Team, UserFirestoreProfile, Player } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, ChevronLeft, Users, PlusCircle, UserPlus, Home } from 'lucide-react';
import { PlayerForm } from '@/components/players/PlayerForm';
import { useToast } from '@/hooks/use-toast';

export default function TeamManagementPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const clubId = typeof params.clubId === 'string' ? params.clubId : '';
    const teamId = typeof params.teamId === 'string' ? params.teamId : '';

    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
    const [hasPermission, setHasPermission] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPageData = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            if (!clubId || !teamId) {
                throw new Error("Club or Team ID is missing from the URL.");
            }
            
            const profile = await getUserProfileById(userId);
            setUserProfile(profile);

            // Fetch team first to check its clubId
            const teamData = await getTeamById(teamId);
            if (!teamData) {
                throw new Error("Team not found.");
            }
            if (teamData.clubId !== clubId) {
                throw new Error("Team does not belong to this club.");
            }
            setTeam(teamData);

            const isSuperAdmin = profile?.profileTypeId === 'super_admin';
            const isClubAdmin = profile?.profileTypeId === 'club_admin' && profile.clubId === clubId;
            const isCoach = profile?.profileTypeId === 'coach' && teamData.coachIds?.includes(userId);

            if (!isSuperAdmin && !isClubAdmin && !isCoach) {
                throw new Error("Access Denied. You do not have permission to manage this team.");
            }
            setHasPermission(true);
            
            const playersData = await getPlayersByTeamId(teamId);
            setPlayers(playersData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clubId, teamId]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/clubs/${clubId}/teams/${teamId}`);
            return;
        }
        loadPageData(user.uid);
    }, [clubId, teamId, user, authLoading, router, loadPageData]);
    
    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading team details...</p>
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
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    if (!team) return null;

    return (
        <div className="space-y-8">
            <nav className="flex items-center text-sm text-muted-foreground">
                <Link href={`/clubs/${clubId}`} className="hover:text-primary flex items-center"><Home className="mr-1 h-4 w-4"/>Club Home</Link>
                <span className="mx-2">/</span>
                <span>Team: {team.name}</span>
            </nav>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline font-bold text-primary">
                       Team: {team.name}
                    </CardTitle>
                    <CardDescription className="text-lg">
                       Manage players for this team.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6"/>Player Roster</CardTitle>
                    <CardDescription>
                        List of all players registered to this team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {players.length === 0 ? (
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
                                {players.map(player => (
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

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><UserPlus className="mr-3 h-6 w-6"/>Add New Player</CardTitle>
                    <CardDescription>
                        Fill in the details to add a new player to the roster.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PlayerForm 
                        teamId={teamId} 
                        clubId={clubId} 
                        onFormSubmit={() => loadPageData(user!.uid)} 
                    />
                </CardContent>
            </Card>
        </div>
    );
}
