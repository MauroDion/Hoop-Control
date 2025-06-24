"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Actions
import { getUserProfileById, getUsersByProfileTypeAndClub } from '@/app/users/actions';
import { getTeamById } from '@/app/teams/actions';
import { getPlayersByTeamId, deletePlayer } from '@/app/players/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';
import { getGameFormats } from '@/app/game-formats/actions';


// Types
import type { Team, UserFirestoreProfile, Player, CompetitionCategory, GameFormat } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, ChevronLeft, Users, UserPlus, Home, Settings, Trash2, Edit } from 'lucide-react';
import { PlayerForm } from '@/components/players/PlayerForm';
import { TeamForm } from '@/components/teams/TeamForm';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TeamManagementPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const clubId = typeof params.clubId === 'string' ? params.clubId : '';
    const teamId = typeof params.teamId === 'string' ? params.teamId : '';

    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [coaches, setCoaches] = useState<UserFirestoreProfile[]>([]);
    const [coordinators, setCoordinators] = useState<UserFirestoreProfile[]>([]);
    const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
    const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
    const [hasPermission, setHasPermission] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

    const loadPageData = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            if (!clubId || !teamId) throw new Error("Club or Team ID is missing.");
            
            const [profile, teamData, playersData, clubCoaches, clubCoordinators, cats, formats] = await Promise.all([
                getUserProfileById(userId),
                getTeamById(teamId),
                getPlayersByTeamId(teamId),
                getUsersByProfileTypeAndClub('coach', clubId),
                getUsersByProfileTypeAndClub('coordinator', clubId),
                getCompetitionCategories(),
                getGameFormats(),
            ]);

            if (!teamData) throw new Error("Team not found.");
            if (teamData.clubId !== clubId) throw new Error("Team does not belong to this club.");
            
            const isSuperAdmin = profile?.profileTypeId === 'super_admin';
            const isClubAdmin = profile?.profileTypeId === 'club_admin' && profile.clubId === clubId;
            const isCoach = profile?.profileTypeId === 'coach' && teamData.coachIds?.includes(userId);

            if (!isSuperAdmin && !isClubAdmin && !isCoach) {
                throw new Error("Access Denied. You do not have permission to manage this team.");
            }
            
            setHasPermission(true);
            setTeam(teamData);
            setPlayers(playersData);
            setCoaches(clubCoaches);
            setCoordinators(clubCoordinators);
            setCompetitionCategories(cats);
            setGameFormats(formats);

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

    const handlePlayerDelete = async (player: Player) => {
        const result = await deletePlayer(player.id, clubId, teamId);
        if (result.success) {
            toast({ title: "Player Deleted", description: `${player.firstName} ${player.lastName} has been removed.` });
            loadPageData(user!.uid);
        } else {
            toast({ variant: "destructive", title: "Deletion Failed", description: result.error });
        }
    };
    
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

            <Dialog open={!!playerToEdit} onOpenChange={(isOpen) => !isOpen && setPlayerToEdit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Player</DialogTitle>
                        <DialogDescription>Update the details for {playerToEdit?.firstName} {playerToEdit?.lastName}.</DialogDescription>
                    </DialogHeader>
                    <PlayerForm 
                        teamId={teamId}
                        clubId={clubId}
                        player={playerToEdit}
                        onFormSubmit={() => {
                            setPlayerToEdit(null);
                            loadPageData(user!.uid);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Card className="shadow-xl">
                <CardHeader><CardTitle className="text-3xl font-headline font-bold text-primary">Manage Team: {team.name}</CardTitle></CardHeader>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Settings className="mr-3 h-6 w-6"/>Team Settings</CardTitle>
                    <CardDescription>
                        Update team name, category, and assigned personnel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TeamForm
                        clubId={clubId}
                        team={team}
                        gameFormats={gameFormats}
                        competitionCategories={competitionCategories}
                        coaches={coaches}
                        coordinators={coordinators}
                        onFormSubmit={() => loadPageData(user!.uid)}
                    />
                </CardContent>
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
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {players.map(player => (
                                    <TableRow key={player.id}>
                                        <TableCell className="font-medium">{player.firstName}</TableCell>
                                        <TableCell>{player.lastName}</TableCell>
                                        <TableCell>{player.jerseyNumber || 'N/A'}</TableCell>
                                        <TableCell>{player.position || 'N/A'}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setPlayerToEdit(player)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete {player.firstName} {player.lastName} from the roster.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handlePlayerDelete(player)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
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
                        Fill in the details to add a new player to the team roster.
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
