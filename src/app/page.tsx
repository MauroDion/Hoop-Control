'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Dribbble, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading, branding } = useAuth();
  const router = useRouter();
  const { appName, logoHeroUrl } = branding || {};

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6 bg-gradient-to-br from-background to-secondary/30 rounded-xl shadow-2xl">
      <div className="max-w-2xl">
        <div className="mb-10 shadow-lg">
          <Image 
            src={logoHeroUrl || "https://placehold.co/600x300.png"} 
            alt={appName || "Hoop Control Platform Illustration"} 
            width={600} 
            height={300} 
            priority 
            className="rounded-lg object-cover"
            data-ai-hint="basketball court"
          />
        </div>
        <h1 className="text-5xl md:text-6xl font-headline font-extrabold mb-6 text-primary tracking-tight flex justify-center items-center gap-4">
          <Dribbble className="h-16 w-16" />
          {appName || "Hoop Control"}
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-10 leading-relaxed">
          Seguimiento de partidos de baloncesto  simplificado. Gestiona equipos, jugadores y estadísticas en vivo.
        </p>
        <div className="space-x-6">
          <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <Link href="/login">Comenzar</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-md transition-shadow duration-300">
            <Link href="/register">Crear Cuenta</Link>
          </Button>
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          Impulsado por tecnología de KILRON SOFTWARE
        </p>
      </div>
    </div>
  );
}
