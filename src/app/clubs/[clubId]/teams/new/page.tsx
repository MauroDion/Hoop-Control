
"use client"; // This page uses client-side hooks for params and auth

import { TeamForm } from "@/components/teams/TeamForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation"; // Use next/navigation for App Router
import { ChevronLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth"; // To protect the page somewhat

// You might want to fetch club details here to display the club name
// For now, we'll just use the clubId.

export default function NewTeamPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const clubId = typeof params.clubId === 'string' ? params.clubId : null;

  // Basic protection, middleware is better for robust auth checks
  if (authLoading) {
    return <p className="text-center py-10">Loading page...</p>;
  }
  if (!user && !authLoading) {
    // Redirect to login if user is not authenticated
    // Ideally, middleware should handle this more gracefully
    router.replace(`/login?redirect=/clubs/${clubId}/teams/new`);
    return <p className="text-center py-10">Redirecting to login...</p>;
  }
  
  if (!clubId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p className="text-muted-foreground">Club ID is missing from the URL.</p>
        <Button variant="outline" asChild className="mt-4">
            <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
       <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href={`/clubs/${clubId}`}> {/* Adjust if club detail page is different */}
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Club
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
          <TeamForm clubId={clubId} />
        </CardContent>
      </Card>
    </div>
  );
}
