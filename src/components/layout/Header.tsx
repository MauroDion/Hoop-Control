
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
    LayoutDashboard, 
    BarChart3, 
    UserCog, 
    CalendarClock, 
    CalendarCheck,
    Tag,
    ChevronDown,
    Building,
    ListOrdered,
    Database,
    Dribbble,
    Settings,
    UserCircle,
    LogOut,
    Menu,
    Users
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';


export default function Header() {
  const { user, profile, branding, logout } = useAuth();
  const { appName, logoHeaderUrl } = branding || {};
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showAdminTools = profile && ['super_admin'].includes(profile.profileTypeId);
  const showGameTools = profile && ['super_admin', 'club_admin', 'coordinator', 'coach', 'parent_guardian'].includes(profile.profileTypeId);
  const showAnalysisTools = profile && ['super_admin', 'club_admin', 'coordinator', 'coach', 'parent_guardian'].includes(profile.profileTypeId);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const navLinks = (
    <>
      <Link href="/dashboard" className="transition-colors hover:text-primary flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
        <LayoutDashboard className="mr-2 h-4 w-4" /> Panel
      </Link>
      {showGameTools && (
        <Link href="/games" className="transition-colors hover:text-primary flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
          <CalendarClock className="mr-2 h-4 w-4" /> Partidos
        </Link>
      )}
       {showAnalysisTools && (
        <Link href="/analysis" className="transition-colors hover:text-primary flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
          <BarChart3 className="mr-2 h-4 w-4" /> Análisis
        </Link>
      )}
      {showAdminTools && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="transition-colors hover:text-primary flex items-center px-3 -ml-3 md:ml-0 md:px-3">
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
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center">
        <Link href="/dashboard" className="mr-4 flex items-center space-x-2">
            {logoHeaderUrl ? (
                <div className="relative h-10 w-32 sm:h-12 sm:w-40">
                    <Image src={logoHeaderUrl} alt={appName || "Hoop Control Logo"} fill style={{objectFit: 'contain'}} />
                </div>
            ) : (
                <>
                 <Dribbble className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                 <span className="hidden sm:inline-block font-headline text-xl sm:text-2xl font-bold text-primary">{appName || "Hoop Control"}</span>
                </>
            )}
        </Link>
        
        <nav className="hidden md:flex flex-grow items-center space-x-6 text-sm font-medium">
          {user && navLinks}
        </nav>

        <div className="ml-auto flex items-center space-x-2 md:space-x-4">
           {user && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'Usuario'} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>Mi Perfil</span>
                        </Link>
                    </DropdownMenuItem>
                    {profile?.profileTypeId === 'parent_guardian' && (
                       <DropdownMenuItem asChild>
                           <Link href="/profile/my-children" className="cursor-pointer">
                                <Users className="mr-2 h-4 w-4" />
                                <span>Mis Hijos/as</span>
                           </Link>
                       </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
           )}
           <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <nav className="flex flex-col space-y-4 pt-6 text-lg">
                        {user && navLinks}
                    </nav>
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
