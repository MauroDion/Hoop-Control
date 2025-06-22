
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Actions
import { getSeasonById } from '@/app/seasons/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';
import { getAllTeams } from '@/app/teams/actions';

// Types
import type { Season, CompetitionCategory, Team } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ChevronLeft, Calendar, Shield, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ManageSeasonPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const seasonId = typeof params.seasonId === 'string' ? params.seasonId : '';

    const [season, setSeason] = useState<Season | null>(null);
    const [categories, setCategories] = useState<CompetitionCategory[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/seasons/${seasonId}`);
            return;
        }
        
        const loadPageData = async () => {
            setLoadingData(true);
            setError(null);
            try {
                if (!seasonId) {
                    setError("Season ID is missing from the URL.");
                    return;
                }
                const [seasonData, categoriesData, teamsData] = await Promise.all([
                    getSeasonById(seasonId),
                    getCompetitionCategories(),
                    getAllTeams()
                ]);

                if (!seasonData) {
                    setError("Season not found.");
                } else {
                    setSeason(seasonData);
                    setCategories(categoriesData);
                    setTeams(teamsData);
                }
            } catch (err: any) {
                console.error("Failed to load season management data:", err);
                setError(err.message || "Failed to load data.");
            } finally {
                setLoadingData(false);
            }
        };

        loadPageData();
    }, [seasonId, user, authLoading, router]);

    const competitionsWithDetails = useMemo(() => {
        if (!season || !categories.length || !teams.length) return [];
        
        return season.competitions.map(comp => {
            const category = categories.find(c => c.id === comp.competitionCategoryId);
            const participatingTeams = teams.filter(t => comp.teamIds.includes(t.id));
            
            return {
                categoryName: category?.name || 'Unknown Category',
                teams: participatingTeams,
            };
        });

    }, [season, categories, teams]);

    if (authLoading || (loadingData && !error)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading season data...</p>
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
                    <Link href="/seasons">Back to Seasons List</Link>
                </Button>
            </div>
        );
    }

    if (!season) {
        return null;
    }

    return (
        <div className="space-y-8">
            <Button variant="outline" size="sm" asChild>
                <Link href="/seasons">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to All Seasons
                </Link>
            </Button>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline font-bold text-primary flex items-center">
                       <Calendar className="mr-3 h-10 w-10" /> {season.name}
                    </CardTitle>
                    <div className="flex items-center space-x-4 pt-2">
                        <Badge variant={season.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                            {season.status}
                        </Badge>
                        <p className="text-muted-foreground">
                            {format(season.startDate, 'PPP')} - {format(season.endDate, 'PPP')}
                        </p>
                    </div>
                </CardHeader>
            </Card>
            
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center"><Shield className="mr-3 h-6 w-6"/> Competitions & Teams</CardTitle>
                    <CardDescription>
                        List of competitions and their registered teams for this season.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {competitionsWithDetails.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No Competitions Found</h2>
                            <p className="text-muted-foreground">No competitions have been configured for this season yet.</p>
                        </div>
                    ) : (
                       <Accordion type="single" collapsible className="w-full">
                           {competitionsWithDetails.map((comp, index) => (
                               <AccordionItem value={`item-${index}`} key={index}>
                                   <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                                       {comp.categoryName} ({comp.teams.length} teams)
                                   </AccordionTrigger>
                                   <AccordionContent>
                                       {comp.teams.length > 0 ? (
                                           <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                               {comp.teams.map(team => <li key={team.id}>{team.name}</li>)}
                                           </ul>
                                       ) : (
                                            <p className="text-sm text-muted-foreground pl-5">No teams registered for this competition.</p>
                                       )}
                                   </AccordionContent>
                               </AccordionItem>
                           ))}
                       </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
