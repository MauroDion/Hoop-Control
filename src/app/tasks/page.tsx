"use client";

import React, { useEffect, useState } from 'react';
import { getTasks } from "@/lib/actions/tasks";
import type { Task } from "@/types";
import { TasksList } from "@/components/tasks/TasksList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';


export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/tasks');
      return;
    }
    
    if (user) {
       async function fetchTasks() {
        try {
          setLoading(true);
          const fetchedTasks = await getTasks(user.uid);
          setTasks(fetchedTasks);
        } catch (e: any) {
          console.error("Failed to fetch tasks:", e);
          setError(e.message || "No se pudieron cargar las tareas. Por favor, inténtalo de nuevo más tarde.");
        } finally {
          setLoading(false);
        }
      }
      fetchTasks();
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && !error)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-semibold">Verificando Acceso...</h1>
        <p className="text-muted-foreground">Por favor, espera.</p>
      </div>
    );
  }
  
  if (loading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-semibold">Cargando Tareas...</h1>
        <p className="text-muted-foreground">Por favor, espera mientras recuperamos tus tareas.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error al Cargar las Tareas</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Intentar de Nuevo</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary">Mis Tareas</h1>
        <Button asChild>
          <Link href="/tasks/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nueva Tarea
          </Link>
        </Button>
      </div>
      <TasksList tasks={tasks} />
    </div>
  );
}
