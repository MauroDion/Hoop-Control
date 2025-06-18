
"use client"; 

import { TeamForm } from "@/components/teams/TeamForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Users, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import React, { useEffect, useState } from "react";
import type { GameFormat, CompetitionCategory } from "@/types";
import { getGameFormats } from "@/app/game-formats/actions";
import { getCompetitionCategories } from "@/app/competition-categories/actions";

export default function NewTeamPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const clubId = typeof params.clubId === 'string' ? params.clubId : null;

  const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
  const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDataForForm() {
      if (!user) return; // Only fetch if user is logged in
      setLoadingData(true);
      setDataError(null);
      try {
        const [formats, categories] = await Promise.all([
          getGameFormats(),
          getCompetitionCategories()
        ]);
        setGameFormats(formats);
        setCompetitionCategories(categories);
      } catch (err: any) {
        console.error("Failed to load data for team form:", err);
        setDataError("Could not load necessary data (formats/categories) for the form. Please try again.");
      } finally {
        setLoadingData(false);
      }
    }
    if (!authLoading && user) {
        fetchDataForForm();
    }
  }, [authLoading, user]);


  if (authLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading page...</p>
        </div>
    );
  }

  if (!user && !authLoading) {
    router.replace(`/login?redirect=/clubs/${clubId}/teams/new`);
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }
  
  if (!clubId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-destructive flex items-center justify-center">
                    <AlertTriangle className="mr-2 h-7 w-7"/>Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Club ID is missing from the URL.</p>
                <Button variant="outline" asChild className="mt-6">
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
       <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href={`/clubs/${clubId}`}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Club Details
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Create New Team
          </CardTitle>
          <CardDescription>Fill in the details below to add a new team to club <code className="font-mono bg-muted px-1 py-0.5 rounded">{clubId}</code>.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" /> 
              <span>Loading form options...</span>
            </div>
          )}
          {dataError && (
             <div className="my-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md flex items-center">
                <AlertTriangle className="h-5 w-5 mr-3"/>
                <p>{dataError}</p>
             </div>
          )}
          {!loadingData && !dataError && (
            <TeamForm 
              clubId={clubId} 
              gameFormats={gameFormats} 
              competitionCategories={competitionCategories} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
