
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Building, CheckSquare, Users, AlertTriangle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createTestGame, finishAllTestGames } from '@/lib/actions/games';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingGame, setIsCreatingGame] = React.useState(false);
  const [isFinishingGames, setIsFinishingGames] = React.useState(false);

  const handleCreateTestGame = async () => {
    if (!user) return;
    setIsCreatingGame(true);
    const result = await createTestGame(user.uid);
    if (result.success) {
      toast({
        title: "Partido de Prueba Creado",
        description: `El partido ha sido creado con éxito. ID: ${result.gameId}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error al Crear Partido",
        description: result.error || "Ocurrió un error desconocido.",
      });
    }
    setIsCreatingGame(false);
  };
  
  const handleFinishAllGames = async () => {
      if (!user) return;
      setIsFinishingGames(true);
      const result = await finishAllTestGames(user.uid);
      if (result.success) {
          toast({
              title: "Partidos Finalizados",
              description: `${result.count || 0} partidos de prueba han sido marcados como completados.`,
          });
      } else {
          toast({
              variant: "destructive",
              title: "Error al Finalizar Partidos",
              description: result.error,
          });
      }
      setIsFinishingGames(false);
  }

  const renderClubManagement = () => {
    if (loading || !profile) {
      return (
        <div className="flex items-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>Cargando información de usuario...</span>
        </div>
      );
    }
    
    if (profile.profileTypeId === 'super_admin') {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            Como Super Admin, tienes control total sobre clubs y equipos.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild>
              <Link href={`/clubs`}>
                <Building className="mr-2 h-5 w-5" /> Gestionar Clubs
              </Link>
            </Button>
          </div>
        </>
      );
    }
    
    if (profile.clubId && ['club_admin', 'coordinator'].includes(profile.profileTypeId!)) {
       return (
        <>
          <p className="text-sm text-muted-foreground">
            Puedes gestionar los equipos de tu club.
          </p>
          <Button asChild>
            <Link href={`/clubs/${profile.clubId}`}>
              <Users className="mr-2 h-5 w-5" /> Gestionar mi Club
            </Link>
          </Button>
        </>
      );
    }

    return (
      <div className="flex items-center text-muted-foreground">
        <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
        <span>No tienes permisos de gestión de club.</span>
      </div>
    );
  };
  
  if (loading || !user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-headline font-semibold">Verificando sesión...</h1>
        <p className="text-muted-foreground">Por favor, espera.</p>
      </div>
    );
  }

  // Dummy data
  const summaryData = {
    activeProjects: 5,
    completedTasks: 120,
    teamMembers: 15,
    alerts: 2,
  };

  const bcsjdApiSampleData = [
    { keyMetric: "Progreso General", value: "75%" },
    { keyMetric: "Uso del Presupuesto", value: "60%" },
  ];


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card rounded-lg shadow-lg">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">¡Bienvenido, {user.displayName || user.email}!</h1>
          <p className="text-lg text-muted-foreground mt-1">Este es un resumen de tu espacio de trabajo en Hoop Control.</p>
        </div>
        <Image 
          src="https://placehold.co/150x150.png" 
          alt="Avatar de usuario o imagen decorativa" 
          width={100} 
          height={100} 
          className="rounded-full shadow-md hidden sm:block"
          data-ai-hint="professional avatar"
        />
      </div>
      
      {profile?.profileTypeId === 'super_admin' && (
           <Card className="shadow-lg">
             <CardHeader>
                <CardTitle>Acciones de Desarrollo</CardTitle>
                <CardDescription>Botones para facilitar las pruebas durante el desarrollo.</CardDescription>
             </CardHeader>
              <CardContent className="flex gap-4">
                <Button onClick={handleCreateTestGame} disabled={isCreatingGame}>
                    {isCreatingGame && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Crear Partido de Prueba
                </Button>
                 <Button onClick={handleFinishAllGames} variant="destructive" disabled={isFinishingGames}>
                    {isFinishingGames && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Finalizar Partidos de Prueba
                </Button>
              </CardContent>
           </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.activeProjects}</div>
            <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.completedTasks}</div>
            <p className="text-xs text-muted-foreground">+15 esta semana</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros del Equipo</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.teamMembers}</div>
            <p className="text-xs text-muted-foreground">Todos activos</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticas (Ejemplo)</CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summaryData.alerts}</div>
            <p className="text-xs text-muted-foreground">Esto es una tarjeta de ejemplo</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            Gestión de Club y Equipos
          </CardTitle>
          <CardDescription>Gestiona los detalles de tu club y crea nuevos equipos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderClubManagement()}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <BarChart className="mr-3 h-6 w-6 text-accent" />
            Resumen de la API
          </CardTitle>
          <CardDescription>Métricas clave obtenidas de la API integrada.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {bcsjdApiSampleData.map((item, index) => (
            <div key={index} className="p-4 border rounded-md bg-secondary/30">
              <h3 className="text-sm font-medium text-muted-foreground">{item.keyMetric}</h3>
              <p className="text-2xl font-bold text-primary">{item.value}</p>
            </div>
          ))}
           <div className="p-4 border rounded-md bg-secondary/30 flex items-center justify-center">
             <Image 
                src="https://placehold.co/300x150.png" 
                alt="Gráfico de ejemplo" 
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
