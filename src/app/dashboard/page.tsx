"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Building, CheckSquare, Users, AlertTriangle, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  
   useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'HH:mm:ss', { locale: es }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authLoading) {
      return; // Wait until Firebase auth state is resolved.
    }
    if (!user) {
      // If auth is resolved and there's no user, redirect to login.
      // This is a client-side safeguard.
      router.replace('/login');
      return;
    }
    
    // If user exists, fetch their profile.
    setLoadingProfile(true);
    setProfileError(null);
    getUserProfileById(user.uid)
      .then(profile => {
        if (profile) {
          setUserProfile(profile);
        } else {
          setProfileError("Tu perfil no se encontró en la base de datos. Por favor, contacta a un administrador.");
          setUserProfile(null);
        }
      })
      .catch(err => {
        setProfileError("Ocurrió un error al cargar tu perfil.");
        setUserProfile(null);
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  }, [user, authLoading, router]);

  if (authLoading || loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Cargando información del panel...</p>
      </div>
    );
  }
  
  if (!user) {
    // This case should be rare due to the redirect, but it prevents rendering with null data.
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Redirigiendo...</p>
      </div>
    )
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
        <Card className="shadow-md hover:shadow-lg transition-shadow lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hora Actual (España)</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-center font-mono py-2">
              {currentTime || "Calculando..."}
            </div>
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
