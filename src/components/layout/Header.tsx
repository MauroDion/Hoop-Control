
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserNav } from './UserNav';
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
    Dribbble,
    Settings
} from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, loading, profile, branding } = useAuth();
  const { appName, logoHeaderUrl } = branding || {};

  const showAdminTools = profile && ['super_admin'].includes(profile.profileTypeId);
  const showGameTools = profile && ['super_admin', 'club_admin', 'coordinator', 'coach'].includes(profile.profileTypeId);
  const showAnalysisTools = profile && ['super_admin', 'club_admin', 'coordinator', 'coach', 'parent_guardian'].includes(profile.profileTypeId);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
            {logoHeaderUrl ? (
                <div className="relative h-12 w-40">
                    <Image src={logoHeaderUrl} alt={appName || "Hoop Control Logo"} fill style={{objectFit: 'contain'}} />
                </div>
            ) : (
                <>
                 <Dribbble className="h-8 w-8 text-primary" />
                 <span className="font-headline text-2xl font-bold text-primary">{appName || "Hoop Control"}</span>
                </>
            )}
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {!loading && user && (
            <>
              <Link href="/dashboard" className="transition-colors hover:text-primary flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Panel
              </Link>
              {showGameTools && (
                <Link href="/games" className="transition-colors hover:text-primary flex items-center">
                  <CalendarClock className="mr-2 h-4 w-4" /> Partidos
                </Link>
              )}
               {showAnalysisTools && (
                <Link href="/analysis" className="transition-colors hover:text-primary flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" /> Análisis
                </Link>
              )}
              {showAdminTools && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="transition-colors hover:text-primary flex items-center px-3">
                      Admin
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/admin/user-management" className="w-full cursor-pointer flex items-center"><UserCog className="mr-2 h-4 w-4" /><span>Usuarios</span></Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/clubs" className="w-full cursor-pointer flex items-center"><Building className="mr-2 h-4 w-4" /><span>Clubs</span></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/seasons" className="w-full cursor-pointer flex items-center"><CalendarCheck className="mr-2 h-4 w-4" /><span>Temporadas</span></Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/admin/competition-categories" className="w-full cursor-pointer flex items-center"><Tag className="mr-2 h-4 w-4" /><span>Categorías</span></Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/admin/game-formats" className="w-full cursor-pointer flex items-center"><ListOrdered className="mr-2 h-4 w-4" /><span>Formatos Partido</span></Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild><Link href="/admin/settings" className="w-full cursor-pointer flex items-center"><Settings className="mr-2 h-4 w-4" /><span>Ajustes Generales</span></Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/admin/seeder" className="w-full cursor-pointer flex items-center"><Database className="mr-2 h-4 w-4" /><span>Poblar Datos (Dev)</span></Link></DropdownMenuItem>
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
