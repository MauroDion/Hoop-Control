"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Building, CheckSquare, Users, AlertTriangle, Loader2, TestTube2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createTestGame } from '@/app/games/actions';

// Dummy data - replace with actual data fetching
const summaryData = {
  activeProjects: 5,
  completedTasks: 120,
  teamMembers: 15,
  alerts: 2,
};

// Placeholder for API data state
interface ApiData {
  keyMetric: string;
  value: number | string;
}
const apiSampleData: ApiData[] = [
  { keyMetric: "Progreso General", value: "75%" },
  { keyMetric: "Uso del Presupuesto", value: "60%" },
];

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isCreatingTestGame, setIsCreatingTestGame] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user) {
      setLoadingProfile(true);
      setProfileError(null);
      getUserProfileById(user.uid)
        .then(profile => {
          if (profile) {
            setUserProfile(profile);
          } else {
            setProfileError("Tu perfil no se encontró en la base de datos. Se cerrará la sesión.");
            logout(false); // Force logout if profile is missing
          }
        })
        .catch(err => {
          setProfileError("Ocurrió un error al cargar tu perfil.");
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    } else {
      // If auth is resolved and there's no user, the middleware should have redirected.
      // This is a failsafe.
      router.replace('/login');
    }
  }, [user, authLoading, logout, router]);

  const handleCreateTestGame = async () => {
    if (!user) return;
    setIsCreatingTestGame(true);
    const result = await createTestGame(user.uid);
    if (result.success && result.gameId) {
        toast({
            title: "Partido de Prueba Creado",
            description: "Redirigiendo a la página del partido...",
        });
        router.push(`/games/${result.gameId}`);
    } else {
        toast({
            variant: "destructive",
            title: "Error al Crear Partido",
            description: result.error || "No se pudo crear el partido de prueba.",
        });
    }
    setIsCreatingTestGame(false);
  }
  
  // The AuthProvider shows a loader, so we only need to care about profile loading here.
  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando información del panel...</p>
      </div>
    );
  }

  const renderClubManagement = () => {
    if (profileError) {
      return (
        <div className="flex items-center text-destructive p-4 bg-destructive/10 rounded-md">
          <AlertTriangle className="mr-3 h-5 w-5 flex-shrink-0" />
          <span>{profileError}</span>
        </div>
      );
    }
    
    if (userProfile?.profileTypeId === 'super_admin') {
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
    
    if (userProfile?.clubId) {
       return (
        <>
          <p className="text-sm text-muted-foreground">
            Puedes gestionar los equipos de tu club.
          </p>
          <Button asChild>
            <Link href={`/clubs/${userProfile.clubId}`}>
              <Users className="mr-2 h-5 w-5" /> Gestionar mi Club
            </Link>
          </Button>
        </>
      );
    }

    return (
      <div className="flex items-center text-muted-foreground">
        <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
        <span>Tu perfil no está asociado a un club. La gestión de equipos está desactivada.</span>
      </div>
    );
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card rounded-lg shadow-lg">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">¡Bienvenido, {user?.displayName || user?.email}!</h1>
          <p className="text-lg text-muted-foreground mt-1">Este es un resumen de tu espacio de trabajo en Hoop Control.</p>
        </div>
         <Image 
            src={"https://placehold.co/150x150.png"} 
            alt="Avatar decorativo del panel" 
            width={100} 
            height={100} 
            className="rounded-full shadow-md hidden sm:block object-cover"
            data-ai-hint="professional avatar"
          />
      </div>

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

      {userProfile && ['super_admin', 'club_admin', 'coordinator', 'coach'].includes(userProfile.profileTypeId) && (
        <Card className="shadow-lg bg-secondary/30">
            <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center">
                    <TestTube2 className="mr-3 h-6 w-6 text-accent" />
                    Zona de Pruebas Rápidas
                </CardTitle>
                <CardDescription>
                    Crea un partido de prueba instantáneo para probar la funcionalidad de anotación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Esto generará un nuevo partido programado con dos equipos del sistema, asignándote uno como equipo local si es posible.
                </p>
                <Button onClick={handleCreateTestGame} disabled={isCreatingTestGame}>
                    {isCreatingTestGame ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <TestTube2 className="mr-2 h-4 w-4" />
                    )}
                    {isCreatingTestGame ? 'Creando partido...' : 'Generar Partido de Prueba'}
                </Button>
            </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <BarChart className="mr-3 h-6 w-6 text-accent" />
            Resumen de la API de Hoop Control
          </CardTitle>
          <CardDescription>Métricas clave obtenidas de la API integrada.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {apiSampleData.map((item) => (
            <div key={item.keyMetric} className="p-4 border rounded-md bg-secondary/30">
              <h3 className="text-sm font-medium text-muted-foreground">{item.keyMetric}</h3>
              <p className="text-2xl font-bold text-primary">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
