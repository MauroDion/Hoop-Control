
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Building, CheckSquare, Users, AlertTriangle, PlusCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile } from '@/types';
import { useRouter } from 'next/navigation';

// Dummy data - replace with actual data fetching
const summaryData = {
  activeProjects: 5,
  completedTasks: 120,
  teamMembers: 15,
  alerts: 2,
};

// Placeholder for API data state
interface ApiData {
  keyMetric: string;
  value: number | string;
}
const bcsjdApiSampleData: ApiData[] = [
  { keyMetric: "Overall Progress", value: "75%" },
  { keyMetric: "Budget Utilization", value: "60%" },
];


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    // If auth state is resolved and there's no user, redirect to login.
    // This is a client-side safeguard in case middleware has issues or for race conditions.
    if (!authLoading && !user) {
      router.replace('/login?redirect=/dashboard');
      return; // Stop further execution
    }

    if (user) {
      console.log(`Dashboard: useEffect triggered for user: ${user.uid}`);
      setLoadingProfile(true);
      getUserProfileById(user.uid)
        .then(profile => {
          console.log("Dashboard: Successfully fetched profile data:", profile);
          if (profile) {
            console.log(`Dashboard: Profile found. Club ID: ${profile.clubId}, Profile Type: ${profile.profileTypeId}`);
          } else {
            console.warn("Dashboard: Profile not found for user. This could be due to Firestore rules or a missing profile document.");
          }
          setUserProfile(profile);
        })
        .catch(err => {
          console.error("Dashboard: An error occurred while fetching user profile:", err);
          setUserProfile(null);
        })
        .finally(() => {
          console.log("Dashboard: Finished fetching profile, setting loadingProfile to false.");
          setLoadingProfile(false);
        });
    }
  }, [user, authLoading, router]);

  // Show a loader while authentication is in progress or if there's no user yet (and we are about to redirect).
  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-headline font-semibold">Verifying Session...</h1>
        <p className="text-muted-foreground">Please wait.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card rounded-lg shadow-lg">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Welcome, {user?.displayName || user?.email}!</h1>
          <p className="text-lg text-muted-foreground mt-1">Here&apos;s a summary of your BCSJD workspace.</p>
        </div>
        <Image 
          src="https://placehold.co/150x150.png" 
          alt="User avatar or decorative image" 
          width={100} 
          height={100} 
          className="rounded-full shadow-md hidden sm:block"
          data-ai-hint="professional avatar"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.activeProjects}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.completedTasks}</div>
            <p className="text-xs text-muted-foreground">+15 this week</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.teamMembers}</div>
            <p className="text-xs text-muted-foreground">All active</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts (Sample)</CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summaryData.alerts}</div>
            <p className="text-xs text-muted-foreground">This is a sample card</p>
          </CardContent>
        </Card>
      </div>

      {/* Club & Team Management Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            Club & Team Management
          </CardTitle>
          <CardDescription>Manage your club details and create new teams.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingProfile ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Loading user information...</span>
            </div>
          ) : userProfile?.profileTypeId === 'super_admin' ? (
            <>
              <p className="text-sm text-muted-foreground">
                As a Super Admin, you have full control over clubs and teams.
              </p>
              <div className="flex space-x-2 pt-2">
                <Button asChild>
                  <Link href={`/clubs/new`}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Create New Club
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/clubs`}>
                    <Building className="mr-2 h-5 w-5" /> Manage Clubs
                  </Link>
                </Button>
              </div>
            </>
          ) : userProfile?.clubId ? (
            <>
              <p className="text-sm text-muted-foreground">
                You are associated with club <code className="font-mono bg-muted px-1 py-0.5 rounded">{userProfile.clubId}</code>.
                You can create a new team for your club now.
              </p>
              <Button asChild>
                <Link href={`/clubs/${userProfile.clubId}/teams/new`}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Create New Team
                </Link>
              </Button>
            </>
          ) : (
            <div className="flex items-center text-muted-foreground">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
              <span>Your profile is not associated with a club. Team creation is disabled.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BCSJD API Data Section (Placeholder) */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <BarChart className="mr-3 h-6 w-6 text-accent" />
            BCSJD API Overview
          </CardTitle>
          <CardDescription>Key metrics from the integrated BCSJD API.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {bcsjdApiSampleData.map((item) => (
            <div key={item.keyMetric} className="p-4 border rounded-md bg-secondary/30">
              <h3 className="text-sm font-medium text-muted-foreground">{item.keyMetric}</h3>
              <p className="text-2xl font-bold text-primary">{item.value}</p>
            </div>
          ))}
           <div className="p-4 border rounded-md bg-secondary/30 flex items-center justify-center">
             <Image 
                src="https://placehold.co/300x150.png" 
                alt="Chart Placeholder" 
                width={300} 
                height={150} 
                className="rounded shadow"
                data-ai-hint="data chart"
              />
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

    