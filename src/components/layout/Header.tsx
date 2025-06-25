"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import UserNav from './UserNav';
import { Button } from '@/components/ui/button';
import { 
    LayoutDashboard, 
    ListChecks, 
    BarChart3, 
    LogIn, 
    UserCog, 
    CalendarClock, 
    CalendarCheck,
    Tag,
    ChevronDown,
    Building,
    ListOrdered,
    Database
} from 'lucide-react';
import { useEffect, useState } from 'react'; 
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);

  useEffect(() => {
    if (user && !profile) {
      getUserProfileById(user.uid).then(setProfile);
    }
    if (!user) {
      setProfile(null);
    }
  }, [user, profile]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-primary">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm6.352 3.396a8.55 8.55 0 0 1 2.25 5.539h-4.41a17.2 17.2 0 0 0-1.42-3.053c1.232.228 2.39.814 3.48 1.514zM12 4.027c.65 1.455 1.054 3.128 1.22 4.908h-2.44c.166-1.78.57-3.453 1.22-4.908zM5.648 5.396c1.09-.7 2.248-1.286 3.48-1.514a17.2 17.2 0 0 0-1.42 3.053H3.293a8.55 8.55 0 0 1 2.355-3.539zM3.415 11h4.41c-.134.935-.205 1.91-.205 2.915 0 1.006.07 1.98.205 2.915H3.415a8.547 8.547 0 0 1 0-5.83zm12.38 5.83h4.41a8.547 8.547 0 0 1 0-5.83h-4.41c.134.935.205 1.91.205 2.915 0 1.006-.07 1.98-.205 2.915zM12 19.973c-.65-1.455-1.054-3.128-1.22-4.908h2.44c-.166 1.78-.57 3.453-1.22 4.908zm-4.32-2.915c.29-.824.697-1.802 1.208-2.915h6.224c.51 1.113.918 2.091 1.208 2.915a8.528 8.528 0 0 1-8.64 0z" />
          </svg>
          <span className="font-headline text-2xl font-bold text-primary">Hoop Control</span>
        </Link>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {!loading && user && (
            <>
              <Link href="/dashboard" className="transition-colors hover:text-primary flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Panel
              </Link>
              <Link href="/tasks" className="transition-colors hover:text-primary flex items-center">
                <ListChecks className="mr-2 h-4 w-4" /> Tareas
              </Link>
              <Link href="/games" className="transition-colors hover:text-primary flex items-center">
                <CalendarClock className="mr-2 h-4 w-4" /> Partidos
              </Link>
              <Link href="/api-data" className="transition-colors hover:text-primary flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" /> Datos API
              </Link>
              
              {profile?.profileTypeId === 'super_admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="transition-colors hover:text-primary flex items-center">
                      Admin
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/user-management" className="flex items-center w-full cursor-pointer">
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>Usuarios</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/clubs" className="flex items-center w-full cursor-pointer">
                        <Building className="mr-2 h-4 w-4" />
                        <span>Clubs</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/seasons" className="flex items-center w-full cursor-pointer">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        <span>Temporadas</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/admin/competition-categories" className="flex items-center w-full cursor-pointer">
                        <Tag className="mr-2 h-4 w-4" />
                        <span>Categorías</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/admin/game-formats" className="flex items-center w-full cursor-pointer">
                        <ListOrdered className="mr-2 h-4 w-4" />
                        <span>Formatos de Partido</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                      <Link href="/admin/seeder" className="flex items-center w-full cursor-pointer">
                        <Database className="mr-2 h-4 w-4" />
                        <span>Poblar Datos (Dev)</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {!loading && user ? (
            <UserNav />
          ) : !loading ? ( 
            <Button asChild variant="default" size="sm">
              <Link href="/login" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión / Registro
              </Link>
            </Button>
          ) : null } 
        </div>
      </div>
    </header>
  );
}
