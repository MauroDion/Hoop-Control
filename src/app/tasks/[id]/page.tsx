// This page will be a client component to use useAuth for userId
"use client";

import React, { useEffect, useState } from 'react';
import { getTaskById, deleteTask } from "@/app/tasks/actions";
import type { Task } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, Tag, Info, Edit, Trash2, ChevronLeft, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
          setError("Tarea no encontrada o no tienes permiso para verla.");
        }
      } catch (e: any) {
        setError(e.message || "Error al cargar los datos de la tarea.");
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
      toast({ title: "Tarea Eliminada", description: `La tarea "${task.title}" ha sido eliminada.` });
      router.push("/tasks");
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Error al Eliminar", description: result.error });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Cargando detalles de la tarea...</p>
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
            <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Volver a Tareas</Link>
        </Button>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold">Tarea No Encontrada</h2>
        <p className="text-muted-foreground">La tarea que buscas no existe o ha sido eliminada.</p>
        <Button asChild className="mt-4">
            <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Volver a Tareas</Link>
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

  const statusText = {
    todo: 'Por Hacer',
    inprogress: 'En Progreso',
    done: 'Hecho',
  }

  const priorityText = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'PPP', { locale: es });
  };


  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Volver a Tareas</Link>
      </Button>
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/10 p-6">
          <CardTitle className="text-3xl font-headline text-primary">{task.title}</CardTitle>
          {task.description && <CardDescription className="text-md text-foreground/80 pt-1">{task.description}</CardDescription>}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Info className="mr-2 h-4 w-4 text-accent" />Estado</h4>
              <p className={`px-3 py-1 text-sm font-semibold rounded-full border w-fit ${statusColors[task.status]}`}>
                {statusText[task.status]}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4 text-accent" />Prioridad</h4>
              <p className={`px-3 py-1 text-sm font-semibold rounded-full border w-fit ${priorityColors[task.priority]}`}>
                {priorityText[task.priority]}
              </p>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-accent" />Fecha de Entrega</h4>
                <p className="text-lg font-medium">{formatDate(task.dueDate)}</p>
            </div>
             <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-accent" />Fecha de Creación</h4>
                <p className="text-lg font-medium">{formatDate(task.createdAt)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 flex justify-end space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/tasks/${task.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Editar</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la tarea
                  "{task.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
