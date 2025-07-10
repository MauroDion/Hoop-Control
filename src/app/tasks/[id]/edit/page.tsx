"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTaskById } from "@/lib/actions/tasks";
import type { Task } from "@/types";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Edit } from "lucide-react";
import { redirect } from "next/navigation";

function EditTaskClientPage({ taskId }: { taskId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      redirect("/login");
      return;
    }

    async function fetchTask() {
      try {
        setLoading(true);
        const fetchedTask = await getTaskById(taskId, user.uid);
        if (fetchedTask) {
          setTask(fetchedTask);
        } else {
          setError("Tarea no encontrada o no tienes permiso para editarla.");
        }
      } catch (e: any) {
        setError(e.message || "Error al cargar la tarea.");
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [taskId, user, authLoading]);

  if (authLoading || loading) {
    return <p className="text-center py-10">Cargando detalles de la tarea...</p>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Error al Cargar la Tarea</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  if (!task) {
     return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Tarea No Encontrada</h2>
        <p className="text-muted-foreground">La tarea solicitada no pudo ser encontrada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Edit className="mr-3 h-8 w-8 text-primary" />
            Editar Tarea
          </CardTitle>
          <CardDescription>Actualiza los detalles de tu tarea: "{task.title}".</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm task={task} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditTaskPage({ params }: { params: { id: string } }) {
  return <EditTaskClientPage taskId={params.id} />;
}
