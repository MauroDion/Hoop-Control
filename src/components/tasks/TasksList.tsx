"use client";

import type { Task } from "@/types";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, PlusCircle, AlertTriangle, ListFilter, CalendarDays } from "lucide-react";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { deleteTask } from "@/app/tasks/actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation"; 
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

interface TasksListProps {
  tasks: Task[];
}

const statusColors: Record<Task['status'], string> = {
  todo: "border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
  inprogress: "border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100",
  done: "border-green-400 bg-green-50 text-green-700 hover:bg-green-100",
};

const priorityText: Record<Task['priority'], string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'd MMM, yyyy', { locale: es });
};

export function TasksList({ tasks }: TasksListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Task['status'] | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | "all">("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => (new Date(b.createdAt).getTime()) - (new Date(a.createdAt).getTime())); // Sort by creation date DESC
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const handleDelete = async (taskId: string, taskTitle: string) => {
    if (!user) {
        toast({variant: "destructive", title: "Error", description: "Debes iniciar sesión."});
        return;
    }
    const result = await deleteTask(taskId, user.uid);
    if (result.success) {
      toast({ title: "Tarea Eliminada", description: `La tarea "${taskTitle}" ha sido eliminada.` });
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Error al Eliminar", description: result.error });
    }
  };

  if (tasks.length === 0 && searchTerm === "" && statusFilter === "all" && priorityFilter === "all") {
    return (
      <div className="text-center py-10">
        <ListFilter className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">¡Aún no hay tareas!</h2>
        <p className="text-muted-foreground mb-4">Comienza creando tu primera tarea.</p>
        <Button asChild>
          <Link href="/tasks/new"><PlusCircle className="mr-2 h-4 w-4" /> Crear Tarea</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-2xl font-headline">Filtros de Tareas</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Input 
                placeholder="Buscar tareas..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-auto"
              />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Task['status'] | "all")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="todo">Por Hacer</SelectItem>
                  <SelectItem value="inprogress">En Progreso</SelectItem>
                  <SelectItem value="done">Hecho</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as Task['priority'] | "all")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Prioridades</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No hay tareas que coincidan con tus filtros.</h3>
          <p className="text-muted-foreground">Intenta ajustar tu búsqueda o criterios de filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between ${statusColors[task.status]}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold mb-1 text-primary-foreground group-hover:text-primary transition-colors">
                     <Link href={`/tasks/${task.id}`} className="hover:underline">{task.title}</Link>
                  </CardTitle>
                  <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'} className="capitalize shrink-0">
                    {priorityText[task.priority]}
                  </Badge>
                </div>
                {task.description && <CardDescription className="text-sm text-foreground/80 line-clamp-2">{task.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="text-xs text-muted-foreground flex items-center">
                   <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                   Vence: {formatDate(task.dueDate)}
                 </div>
                 <div className="text-xs text-muted-foreground mt-1">
                   Creado: {formatDate(task.createdAt)}
                 </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/tasks/${task.id}`}><Eye className="mr-1 h-4 w-4" /> Ver</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/tasks/${task.id}/edit`}><Edit className="mr-1 h-4 w-4" /> Editar</Link>
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" /> Eliminar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea "{task.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(task.id, task.title)} className="bg-destructive hover:bg-destructive/90">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
