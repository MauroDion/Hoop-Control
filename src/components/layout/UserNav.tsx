
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { signOut as firebaseClientSignOut } from 'firebase/auth'; // Renamed to avoid conflict
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { LogOut, UserCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Call the server API endpoint to clear the session cookie
      const response = await fetch('/api/auth/session-logout', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Log server-side logout error but proceed with client-side logout
        console.error('Server-side session logout failed:', errorData.error);
        toast({ variant: "destructive", title: "Logout Incomplete", description: "Could not clear server session fully, but logging out locally." });
      } else {
        console.log("UserNav: Session cookie should be cleared by server.");
      }

      // Perform client-side Firebase sign out
      await firebaseClientSignOut(auth);
      
      toast({ title: "Logged out", description: "You have been successfully logged out." });
      router.push('/login'); 
      router.refresh(); 
    } catch (error: any) {
      console.error('Full logout failed:', error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log you out. Please try again." });
       // Still attempt client-side logout and redirect if server call failed before client signOut
      if (auth.currentUser) {
        try {
          await firebaseClientSignOut(auth);
        } catch (clientSignOutError) {
          console.error('Client-side signOut also failed:', clientSignOutError);
        }
      }
      router.push('/login');
      router.refresh();
    }
  };

  if (!user) {
    return null;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
            <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center">
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="flex items-center cursor-not-allowed">
            <Settings className="mr-2 h-4 w-4" />
            Settings
            <span className="ml-auto text-xs text-muted-foreground">(Soon)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
