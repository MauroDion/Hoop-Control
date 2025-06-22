
"use client";

import { SeasonForm } from "@/components/seasons/SeasonForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getUserProfileById } from '@/app/users/actions';
import { getCompetitionCategories } from "@/app/competition-categories/actions";
import { getAllTeams } from "@/app/teams/actions";
import type { CompetitionCategory, Team } from "@/types";
import { Loader2, AlertTriangle, ChevronLeft, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewSeasonPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/seasons/new');
      return;
    }

    const verifyAdminAndFetchData = async () => {
      setLoading(true);
      setDataError(null);
      try {
        const profile = await getUserProfileById(user.uid);
        if (profile?.profileTypeId !== 'super_admin') {
          setIsSuperAdmin(false);
          setLoading(false);
          return;
        }
        setIsSuperAdmin(true);

        const [categories, teams] = await Promise.all([
            getCompetitionCategories(),
            getAllTeams()
        ]);
        setCompetitionCategories(categories);
        setAllTeams(teams);

      } catch (err: any) {
        console.error("Failed to load data for season form:", err);
        setDataError("Could not load required data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    verifyAdminAndFetchData();
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Verifying permissions and loading data...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You must be a Super Admin to create a new season.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/seasons">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Seasons
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <CalendarPlus className="mr-3 h-8 w-8 text-primary" />
            Create New Season
          </CardTitle>
          <CardDescription>Define a new season and configure its participating competitions and teams.</CardDescription>
        </CardHeader>
        <CardContent>
           {dataError ? (
             <div className="my-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md flex items-center">
                <AlertTriangle className="h-5 w-5 mr-3"/>
                <p>{dataError}</p>
             </div>
          ) : (
            <SeasonForm 
                competitionCategories={competitionCategories}
                allTeams={allTeams}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
