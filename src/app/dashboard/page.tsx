
"use client"; // Required for using hooks like useAuth

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Building, CheckSquare, Users, AlertTriangle, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
  const { user } = useAuth(); // Get user info if needed

  if (!user) {
    // This should ideally be handled by middleware, but as a fallback:
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-headline font-semibold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">Please log in to view the dashboard.</p>
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
        <Card className="shadow-md hover:shadow-lg transition-shadow border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Critical Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{summaryData.alerts}</div>
            <p className="text-xs text-muted-foreground">Action required</p>
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
          <p className="text-sm text-muted-foreground">
            To create a new team, you&apos;ll need the ID of the club it belongs to. 
            Replace <strong>`your-club-id-here`</strong> in the link with an actual Club ID.
          </p>
          <Button asChild>
            <Link href="/clubs/your-club-id-here/teams/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Team
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground pt-2">
            In a full application, you would typically navigate from a specific club&apos;s page to create a team for it, or select your club first.
          </p>
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
