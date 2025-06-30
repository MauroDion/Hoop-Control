
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createTestGame, finishAllTestGames } from '@/app/games/actions';
import { seedDatabase } from '@/app/admin/seeder/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Building, BarChart2, Gamepad2, TestTube, Zap, Database } from 'lucide-react';
import Link from 'next/link';
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


export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingTestGame, setIsCreatingTestGame] = useState(false);
  const [isFinishingGames, setIsFinishingGames] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const canCreateTestGame = profile && ['super_admin', 'club_admin', 'coordinator', 'coach'].includes(profile.profileTypeId);
  const canManageClubs = profile && ['super_admin', 'club_admin', 'coordinator'].includes(profile.profileTypeId);

  const handleCreateTestGame = async () => {
    if (!user) return;
    setIsCreatingTestGame(true);
    const result = await createTestGame(user.uid);
    if(result.success) {
        toast({ title: 'Partido de Prueba Creado', description: `El partido con ID ${result.gameId} ha sido creado.`});
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsCreatingTestGame(false);
  };

  const handleFinishTestGames = async () => {
    if (!user) return;
    setIsFinishingGames(true);
    const result = await finishAllTestGames(user.uid);
     if(result.success) {
        toast({ title: 'Partidos de Prueba Finalizados', description: `${result.count} partidos han sido marcados como completados.`});
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsFinishingGames(false);
  }

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    const result = await seedDatabase();
    if (result.success) {
      toast({
        title: '¡Base de Datos Poblada!',
        description: 'Los datos de prueba se han cargado. La página se recargará.',
        duration: 5000,
      });
      setTimeout(() => window.location.reload(), 2000);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al Poblar la Base de Datos',
        description: result.error,
      });
    }
    setIsSeeding(false);
  };
  
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-headline font-semibold">Cargando...</h1>
        <p className="text-muted-foreground">Por favor, espera.</p>
      </div>
    );
  }
  
  if (!user || !profile) {
      return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Error de Autenticación</h1>
                <p className="text-muted-foreground mb-4">No se pudo cargar el perfil de usuario. Intenta iniciar sesión de nuevo.</p>
                <Button asChild><Link href="/login">Ir a Iniciar Sesión</Link></Button>
            </div>
      )
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-headline font-bold text-primary">¡Bienvenido, {user.displayName || user.email}!</CardTitle>
          <CardDescription className="text-lg">Este es tu panel central de Hoop Control.</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Gamepad2 className="mr-3 h-6 w-6 text-accent"/>Partidos</CardTitle>
            <CardDescription>Ver partidos programados y registrar resultados en vivo.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild><Link href="/games">Gestionar Partidos</Link></Button>
          </CardContent>
        </Card>
        
        { canManageClubs && 
            <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center"><Building className="mr-3 h-6 w-6 text-accent"/>Mi Club</CardTitle>
                    <CardDescription>Gestionar equipos y jugadores de tu club.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild><Link href={profile.profileTypeId === 'super_admin' ? '/clubs' : `/clubs/${profile.clubId}`}>Gestionar {profile.profileTypeId === 'super_admin' ? 'Clubs' : 'mi Club'}</Link></Button>
                </CardContent>
            </Card>
        }

         <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart2 className="mr-3 h-6 w-6 text-accent"/>Análisis</CardTitle>
            <CardDescription>Revisar estadísticas de partidos completados.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild><Link href="/analysis">Ver Análisis</Link></Button>
          </CardContent>
        </Card>
      </div>

       { canCreateTestGame &&
          <Card className="border-amber-500">
            <CardHeader>
                <CardTitle className="flex items-center text-amber-700"><TestTube className="mr-3 h-6 w-6"/>Zona de Pruebas</CardTitle>
                <CardDescription>Acciones de desarrollo para probar la funcionalidad.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button variant="secondary" onClick={handleCreateTestGame} disabled={isCreatingTestGame}>
                    {isCreatingTestGame ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Gamepad2 className="mr-2 h-4 w-4"/>}
                    {isCreatingTestGame ? 'Generando...' : 'Generar Partido de Prueba'}
                </Button>
                {profile.profileTypeId === 'super_admin' && (
                    <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="destructive" disabled={isFinishingGames}>
                                {isFinishingGames ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4"/>}
                                {isFinishingGames ? 'Finalizando...' : 'Finalizar Partidos de Prueba'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción finalizará todos los partidos creados con el botón de prueba que estén aún en progreso o programados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleFinishTestGames}
                                className="bg-destructive hover:bg-destructive/80"
                              >
                                Sí, finalizar partidos
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isSeeding}>
                                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Database className="mr-2 h-4 w-4"/>}
                                {isSeeding ? 'Poblando...' : 'Poblar Base de Datos'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¡Acción Irreversible!</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esto borrará todos los datos de prueba existentes (equipos, jugadores, partidos, etc.) y los reemplazará con un nuevo conjunto de datos. ¿Continuar?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleSeedDatabase}
                                className="bg-destructive hover:bg-destructive/80"
                              >
                                Sí, poblar la base de datos
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </CardContent>
          </Card>
        }

    </div>
  );
}
