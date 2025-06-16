import { getTaskById } from "@/app/tasks/actions";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Edit } from "lucide-react";
import { auth } from "@/lib/firebase/client"; // Assuming auth is initialized and currentUser is available
import { redirect } from "next/navigation";


export default async function EditTaskPage({ params }: { params: { id: string } }) {
  // This is a server component, so auth.currentUser might not be reliable here.
  // For robust auth in Server Components, you'd typically use a session management library
  // or verify an ID token passed from the client or from cookies.
  // For this example, we'll simulate getting userId. In real app, pass it or use server-side auth.
  // const userId = auth.currentUser?.uid; // This is NOT reliable in Server Components.
  // A common pattern is to have a server-side auth helper.
  // For now, as a placeholder for this scaffold, we will proceed.
  // Ideally, this page would be client component to use useAuth() or protected by middleware that ensures user.

  // This is a workaround, best to handle auth state properly for server components or make this a client component.
  // If not using a proper server-session, you would pass the userId from a parent client component or context.
  // For this example, we'll assume middleware protects this route and user is available.
  // However, getTaskById needs the userId. This is tricky for pure Server Component.
  // Let's assume for now that a real app would have a server-side way to get the user.
  // This page should ideally be a client component to use the useAuth hook for userId.
  // OR, the getTaskById function needs to be adapted for server-side auth (e.g. using Admin SDK and ID token).
  
  // For the purpose of this scaffold, we acknowledge this limitation for pure server component.
  // Making this a client component is a safer approach for Firebase client SDK.
  // Or, ensure the server action `getTaskById` can run without client-side `auth.currentUser`.
  // To make it work for now, we might need to pass userId or make it client.
  // Let's make it a client component to resolve this easily.
  
  // REDIRECTING to client component pattern below.
  // The actual fetching and form rendering will be in a client component.
  // This server component just acts as a loader/router.

  // This Server Component will fetch the initial task data.
  // Authentication needs to be handled, for instance, by passing userId or making it client-side.
  // Since actions.ts is server-side, it *could* use Admin SDK if properly configured.
  // For now, we'll stick to client SDK and rely on middleware for route protection.
  // The userId for getTaskById will be problematic if not passed or handled by client.

  // To simplify, we'll assume actions.ts `getTaskById` will be called from a client component
  // that provides the userId. This page will be a client component.

  // The below approach is if this were a SERVER component strictly.
  // const task = await getTaskById(params.id, "PLACEHOLDER_USER_ID_FETCH_SERVER_SIDE");
  // Since we decided on client components for pages needing auth, we'll adjust.
  // This page itself cannot reliably get userId with Firebase client SDK if it's a server component.
  // We'll structure it assuming it will become a client component or call one.
  // For now, let's just use a client component approach for the form itself.
  
  // The solution is to make the component that *needs* user.uid a client component.
  // This page can remain server, but it would pass data to a client component.
  // Or, the entire page becomes client.
  // Let's try to keep it simple: make the page client to use useAuth.
  
  // This page will be marked as "use client" to use useAuth hook.
  // It has been converted to a Client Component below by moving the logic into EditTaskClientPage.
  
  return <EditTaskClientPage taskId={params.id} />;
}


// --- Client Component Part ---
"use client"; // Make this part a client component

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types'; // Assuming Task type is defined

function EditTaskClientPage({ taskId }: { taskId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to load

    if (!user) {
      redirect("/login"); // Or show an error message
      return;
    }

    async function fetchTask() {
      try {
        setLoading(true);
        const fetchedTask = await getTaskById(taskId, user.uid); // Pass user.uid here
        if (fetchedTask) {
          setTask(fetchedTask);
        } else {
          setError("Task not found or you don't have permission to edit it.");
        }
      } catch (e: any) {
        setError(e.message || "Failed to load task.");
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [taskId, user, authLoading]);

  if (authLoading || loading) {
    return <p className="text-center py-10">Loading task details...</p>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Error Loading Task</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  if (!task) {
     return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Task Not Found</h2>
        <p className="text-muted-foreground">The requested task could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Edit className="mr-3 h-8 w-8 text-primary" />
            Edit Task
          </CardTitle>
          <CardDescription>Update the details for your task: "{task.title}".</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm task={task} />
        </CardContent>
      </Card>
    </div>
  );
}
