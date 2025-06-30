"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
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
    BarChart2,
    Settings as SettingsIcon,
    Dribbble,
    Menu,
    Database
} from 'lucide-react';
import { useState } from 'react'; 
import Image from 'next/image';
import { UserNav } from './UserNav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
  const { user, loading, profile, branding } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {branding.logoHeaderUrl ? (
            <div className="relative h-12 w-32">
              <Image src={branding.logoHeaderUrl} alt={branding.appName || "Logo"} fill style={{ objectFit: 'contain' }}/>
            </div>
          ) : (
             <>
              <Dribbble className="h-9 w-9 text-primary" />
              <span className="font-headline text-2xl font-bold text-primary hidden sm:inline-block">{branding.appName || 'Hoop Control'}</span>
             </>
          )}
        </Link>
        
        {/* --- Desktop Navigation --- */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {!loading && user && (
            <>
              <Link href="/dashboard" className="transition-colors hover:text-primary flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Panel
              </Link>
              <Link href="/games" className="transition-colors hover:text-primary flex items-center">
                <CalendarClock className="mr-2 h-4 w-4" /> Partidos
              </Link>
              <Link href="/analysis" className="transition-colors hover:text-primary flex items-center">
                <BarChart2 className="mr-2 h-4 w-4" /> Análisis
              </Link>
              <Link href="/tasks" className="transition-colors hover:text-primary flex items-center">
                <ListChecks className="mr-2 h-4 w-4" /> Tareas
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
                    <DropdownMenuItem asChild><Link href="/admin/user-management" className="flex items-center w-full cursor-pointer"><UserCog className="mr-2 h-4 w-4" /><span>Usuarios</span></Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/clubs" className="flex items-center w-full cursor-pointer"><Building className="mr-2 h-4 w-4" /><span>Clubs</span></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/seasons" className="flex items-center w-full cursor-pointer"><CalendarCheck className="mr-2 h-4 w-4" /><span>Temporadas</span></Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/admin/competition-categories" className="flex items-center w-full cursor-pointer"><Tag className="mr-2 h-4 w-4" /><span>Categorías</span></Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/admin/game-formats" className="flex items-center w-full cursor-pointer"><ListOrdered className="mr-2 h-4 w-4" /><span>Formatos de Partido</span></Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild><Link href="/admin/settings" className="flex items-center w-full cursor-pointer"><SettingsIcon className="mr-2 h-4 w-4" /><span>Ajustes de Marca</span></Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/admin/seeder" className="flex items-center w-full cursor-pointer"><Database className="mr-2 h-4 w-4" /><span>Poblar Datos (Dev)</span></Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </nav>
        
        {/* --- UserNav & Mobile Menu --- */}
        <div className="ml-auto flex items-center space-x-2">
          {!loading && user ? (
            <>
              <UserNav />
              <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Abrir menú</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] p-4">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="mb-8 flex items-center space-x-2">
                        {branding.logoHeaderUrl ? (
                            <div className="relative h-10 w-28">
                                <Image src={branding.logoHeaderUrl} alt={branding.appName || "Logo"} fill style={{ objectFit: 'contain' }}/>
                            </div>
                        ) : (
                            <>
                            <Dribbble className="h-8 w-8 text-primary" />
                            <span className="font-headline text-xl font-bold text-primary">{branding.appName || 'Hoop Control'}</span>
                            </>
                        )}
                    </Link>
                    <nav className="flex flex-col space-y-2">
                        <Button variant="ghost" asChild className="justify-start"><Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}><LayoutDashboard className="mr-2 h-4 w-4" /> Panel</Link></Button>
                        <Button variant="ghost" asChild className="justify-start"><Link href="/games" onClick={() => setIsMobileMenuOpen(false)}><CalendarClock className="mr-2 h-4 w-4" /> Partidos</Link></Button>
                        <Button variant="ghost" asChild className="justify-start"><Link href="/analysis" onClick={() => setIsMobileMenuOpen(false)}><BarChart2 className="mr-2 h-4 w-4" /> Análisis</Link></Button>
                        <Button variant="ghost" asChild className="justify-start"><Link href="/tasks" onClick={() => setIsMobileMenuOpen(false)}><ListChecks className="mr-2 h-4 w-4" /> Tareas</Link></Button>
                        <Button variant="ghost" asChild className="justify-start"><Link href="/api-data" onClick={() => setIsMobileMenuOpen(false)}><BarChart3 className="mr-2 h-4 w-4" /> Datos API</Link></Button>
                    </nav>
                    {profile?.profileTypeId === 'super_admin' && (
                        <div className="mt-6 pt-6 border-t">
                            <h4 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">Admin</h4>
                            <nav className="flex flex-col space-y-2">
                                <Button variant="ghost" asChild className="justify-start"><Link href="/admin/user-management" onClick={() => setIsMobileMenuOpen(false)}><UserCog className="mr-2 h-4 w-4" /> Usuarios</Link></Button>
                                <Button variant="ghost" asChild className="justify-start"><Link href="/clubs" onClick={() => setIsMobileMenuOpen(false)}><Building className="mr-2 h-4 w-4" /> Clubs</Link></Button>
                                <Button variant="ghost" asChild className="justify-start"><Link href="/seasons" onClick={() => setIsMobileMenuOpen(false)}><CalendarCheck className="mr-2 h-4 w-4" /> Temporadas</Link></Button>
                                <Button variant="ghost" asChild className="justify-start"><Link href="/admin/competition-categories" onClick={() => setIsMobileMenuOpen(false)}><Tag className="mr-2 h-4 w-4" /> Categorías</Link></Button>
                                <Button variant="ghost" asChild className="justify-start"><Link href="/admin/game-formats" onClick={() => setIsMobileMenuOpen(false)}><ListOrdered className="mr-2 h-4 w-4" /> Formatos</Link></Button>
                                <Button variant="ghost" asChild className="justify-start"><Link href="/admin/settings" onClick={() => setIsMobileMenuOpen(false)}><SettingsIcon className="mr-2 h-4 w-4" /> Ajustes</Link></Button>
                                <Button variant="ghost" asChild className="justify-start"><Link href="/admin/seeder" onClick={() => setIsMobileMenuOpen(false)}><Database className="mr-2 h-4 w-4" /> Poblar Datos</Link></Button>
                            </nav>
                        </div>
                    )}
                  </SheetContent>
                </Sheet>
              </div>
            </>
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
