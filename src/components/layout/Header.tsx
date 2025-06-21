
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import UserNav from './UserNav';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ListChecks, BarChart3, LogIn, UserCog, CalendarClock } from 'lucide-react'; // Changed UsersCog to UserCog
import { useEffect } from 'react'; 

export default function Header() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // This log is still useful for general auth debugging
    console.log('[Header] Auth State:', { user: user ? { uid: user.uid, email: user.email } : null, loading });
  }, [user, loading]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <span className="font-headline text-2xl font-bold text-primary">BCSJD App</span>
        </Link>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {!loading && user && (
            <>
              <Link href="/dashboard" className="transition-colors hover:text-primary flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Link>
              <Link href="/tasks" className="transition-colors hover:text-primary flex items-center">
                <ListChecks className="mr-2 h-4 w-4" /> Tasks
              </Link>
              <Link href="/games" className="transition-colors hover:text-primary flex items-center">
                <CalendarClock className="mr-2 h-4 w-4" /> Games
              </Link>
              <Link href="/bcsjd-api-data" className="transition-colors hover:text-primary flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" /> API Data
              </Link>
              {/* 
                Simple link for now. The page /admin/user-management will handle actual role verification.
                In a more advanced setup, this link itself could be conditionally rendered based on user role
                if the role is available in the useAuth() hook.
              */}
              <Link href="/admin/user-management" className="transition-colors hover:text-primary flex items-center">
                <UserCog className="mr-2 h-4 w-4" /> Admin Users
              </Link>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {!loading && user ? (
            <UserNav />
          ) : !loading ? ( 
            <Button asChild variant="default" size="sm">
              <Link href="/login" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" /> Login / Register
              </Link>
            </Button>
          ) : null } 
        </div>
      </div>
    </header>
  );
}
