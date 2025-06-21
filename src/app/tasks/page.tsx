
"use client";

import React, { useEffect, useState } from 'react';
import { getTasks } from "@/app/tasks/actions";
import type { Task } from "@/types";
import { TasksList } from "@/components/tasks/TasksList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router


export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
       async function fetchTasks() {
        try {
          setLoading(true);
          const fetchedTasks = await getTasks(user.uid); // Pass user.uid to fetch tasks for this user
          setTasks(fetchedTasks);
        } catch (e: any) {
          console.error("Failed to fetch tasks:", e);
          setError(e.message || "Could not load tasks. Please try again later.");
        } finally {
          setLoading(false);
        }
      }
      fetchTasks();
    } else if (!authLoading) {
      // If auth is resolved and there's no user, we don't fetch.
      // The middleware should handle redirection. We just stop loading.
      setLoading(false);
    }
  }, [user, authLoading]);

  // Show a loader only while authentication is in progress.
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-semibold">Verifying Access...</h1>
        <p className="text-muted-foreground">Please wait.</p>
      </div>
    );
  }

  // If auth is resolved, and there is no user, show an error.
  // This page should not be reachable if the middleware is working correctly.
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to view this page.</p>
        <Button onClick={() => router.push('/login')}>Go to Login</Button>
      </div>
    );
  }

  // If we are still loading the tasks data for an authenticated user.
  if (loading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-semibold">Loading Tasks...</h1>
        <p className="text-muted-foreground">Please wait while we fetch your tasks.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Failed to Load Tasks</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary">My Tasks</h1>
        <Button asChild>
          <Link href="/tasks/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Task
          </Link>
        </Button>
      </div>
      <TasksList tasks={tasks} />
    </div>
  );
}
