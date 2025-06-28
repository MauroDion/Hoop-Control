"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
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
    Database,
    BarChart2,
    Settings as SettingsIcon,
    Dribbble
} from 'lucide-react';
import { useEffect, useState } from 'react'; 
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile, BrandingSettings } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { getBrandingSettings } from '@/app/admin/settings/actions';
import { UserNav } from './UserNav';

export default function Header() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>({});

  useEffect(() => {
    if (user && (!profile || profile.uid !== user.uid)) {
      getUserProfileById(user.uid).then(profile => {
        if(profile) setProfile(profile)
      });
    }
    if (!user) {
      setProfile(null);
    }
  }, [user, profile]);

  useEffect(() => {
    getBrandingSettings().then(setBranding);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          {branding.logoHeaderUrl ? (
            <div className="relative h-12 w-32">
              <Image src={branding.logoHeaderUrl} alt={branding.appName || "Logo"} fill style={{ objectFit: 'contain' }}/>
            </div>
          ) : (
             <>
              <Dribbble className="h-9 w-9 text-primary" />
              <span className="font-headline text-2xl font-bold text-primary">{branding.appName || 'Hoop Control'}</span>
             </>
          )}
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
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
              <Link href="/analysis" className="transition-colors hover:text-primary flex items-center">
                <BarChart2 className="mr-2 h-4 w-4" /> Análisis
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
                    <DropdownMenuItem asChild>
                      <Link href="/admin/settings" className="flex items-center w-full cursor-pointer">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        <span>Ajustes de Marca</span>
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
            <UserNav profile={profile}/>
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
