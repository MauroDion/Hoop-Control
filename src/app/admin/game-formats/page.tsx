"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/lib/actions/users';
import { getGameFormats, deleteGameFormat } from '@/lib/actions/game-formats';
import type { GameFormat } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ListOrdered, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { GameFormatForm } from '@/components/game-formats/GameFormatForm';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export default function ManageGameFormatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [formats, setFormats] = useState<GameFormat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<GameFormat | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        if (!user) throw new Error("Autenticación requerida.");
        
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId !== 'super_admin') {
        throw new Error('Acceso Denegado. Debes ser Super Admin para ver esta página.');
      }

      const fetchedFormats = await getGameFormats();
      setFormats(fetchedFormats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin/game-formats');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);
  
  const handleEdit = (format: GameFormat) => {
    setEditingFormat(format);
    setIsFormOpen(true);
  };
  
  const handleCreateNew = () => {
    setEditingFormat(null);
    setIsFormOpen(true);
  }

  const handleDelete = async (formatId: string, formatName: string) => {
    const result = await deleteGameFormat(formatId);
    if (result.success) {
        toast({ title: "Formato Eliminado", description: `El formato "${formatName}" ha sido eliminado.`});
        fetchData();
    } else {
        toast({ variant: "destructive", title: "Error al Eliminar", description: result.error });
    }
  }


  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando datos de formatos de partido...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push('/games')} className="mt-4">Ir a Partidos</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingFormat ? "Editar Formato" : "Crear Nuevo Formato"}</DialogTitle>
                <DialogDescription>
                  {editingFormat ? `Actualiza los detalles de ${editingFormat.name}.` : "Rellena los detalles para registrar un nuevo formato."}
                </DialogDescription>
            </DialogHeader>
            <GameFormatForm
              onFormSubmit={() => {
                setIsFormOpen(false);
                fetchData();
              }}
              format={editingFormat}
            />
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <ListOrdered className="mr-3 h-10 w-10" /> Gestionar Formatos de Partido
        </h1>
        <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Formato
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Todos los Formatos de Partido</CardTitle>
          <CardDescription>A continuación se muestra una lista de todos los formatos de partido en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {formats.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No se Encontraron Formatos</h2>
                <p className="text-muted-foreground">Crea uno para empezar.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Formato</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Períodos</TableHead>
                    <TableHead>Duración (min)</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formats.map((format) => (
                    <TableRow key={format.id}>
                      <TableCell className="font-medium">{format.name}</TableCell>
                      <TableCell>{format.description || 'N/A'}</TableCell>
                      <TableCell>{format.numPeriods ?? 'N/A'}</TableCell>
                      <TableCell>{format.periodDurationMinutes ?? 'N/A'}</TableCell>
                       <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(format)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el formato "{format.name}".</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(format.id, format.name)} className="bg-destructive hover:bg-destructive/80">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
