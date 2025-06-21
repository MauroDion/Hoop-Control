// This page will be a client component to use useAuth for userId
"use client";

import React, { useEffect, useState } from 'react';
import { getTaskById } from "@/app/tasks/actions";
import type { Task } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, Tag, Info, Edit, Trash2, ChevronLeft, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import {format} from 'date-fns';
import { deleteTask } from '@/app/tasks/actions';
import { useToast } from '@/hooks/use-toast';
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


export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to login or show error, this should ideally be caught by middleware too
      router.push("/login?redirect=/tasks/" + params.id);
      return;
    }

    async function fetchTask() {
      try {
        setLoading(true);
        const fetchedTask = await getTaskById(params.id, user.uid);
        if (fetchedTask) {
          setTask(fetchedTask);
        } else {
          setError("Task not found or you don't have permission to view it.");
        }
      } catch (e: any) {
        setError(e.message || "Failed to load task data.");
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [params.id, user, authLoading, router]);

  const handleDelete = async () => {
    if (!task || !user) return;
    const result = await deleteTask(task.id, user.uid);
    if (result.success) {
      toast({ title: "Task Deleted", description: `Task "${task.title}" has been deleted.` });
      router.push("/tasks");
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Deletion Failed", description: result.error });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading task details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild className="mt-4">
            <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Tasks</Link>
        </Button>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold">Task Not Found</h2>
        <p className="text-muted-foreground">The task you are looking for does not exist or has been removed.</p>
        <Button asChild className="mt-4">
            <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  const statusColors = {
    todo: "bg-yellow-500/20 text-yellow-700 border-yellow-500",
    inprogress: "bg-blue-500/20 text-blue-700 border-blue-500",
    done: "bg-green-500/20 text-green-700 border-green-500",
  };

  const priorityColors = {
    low: "bg-gray-500/20 text-gray-700 border-gray-500",
    medium: "bg-orange-500/20 text-orange-700 border-orange-500",
    high: "bg-red-500/20 text-red-700 border-red-500",
  };
  
  const formatDate = (date?: Date | null) => {
    if (!date) return 'N/A';
    return format(date, 'PPP'); // e.g., Jun 20, 2023
  };


  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Tasks</Link>
      </Button>
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/10 p-6">
          <CardTitle className="text-3xl font-headline text-primary">{task.title}</CardTitle>
          {task.description && <CardDescription className="text-md text-foreground/80 pt-1">{task.description}</CardDescription>}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Info className="mr-2 h-4 w-4 text-accent" />Status</h4>
              <p className={`px-3 py-1 text-sm font-semibold rounded-full border w-fit ${statusColors[task.status]}`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4 text-accent" />Priority</h4>
              <p className={`px-3 py-1 text-sm font-semibold rounded-full border w-fit ${priorityColors[task.priority]}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </p>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-accent" />Due Date</h4>
                <p className="text-lg font-medium">{formatDate(task.dueDate)}</p>
            </div>
             <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-accent" />Created At</h4>
                <p className="text-lg font-medium">{formatDate(task.createdAt)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 flex justify-end space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/tasks/${task.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the task
                  "{task.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
