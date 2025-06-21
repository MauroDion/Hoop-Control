
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
    console.log("UserNav: Logout process initiated.");
    try {
      // Step 1: Attempt to clear the server session cookie.
      console.log("UserNav: Attempting to call /api/auth/session-logout endpoint.");
      const response = await fetch('/api/auth/session-logout', {
        method: 'POST',
      });

      if (!response.ok) {
        // If the server call fails, log the error but DO NOT stop the logout process.
        const errorData = await response.json();
        console.error('UserNav: Server-side session logout failed. Response:', errorData.error);
        toast({ variant: "destructive", title: "Logout Warning", description: "Could not clear server session. Logging out locally." });
      } else {
        console.log("UserNav: Server responded OK. Session cookie should be cleared.");
      }
    } catch (error: any) {
      // Also catch network errors, but again, DO NOT stop the logout process.
      console.error('UserNav: API call to /api/auth/session-logout failed:', error);
      toast({ variant: "destructive", title: "Logout Error", description: `Could not contact logout service: ${error.message}` });
    } finally {
      // Step 2: ALWAYS perform client-side sign-out and redirect.
      // This ensures the user is logged out on the client regardless of server state.
      try {
        await firebaseClientSignOut(auth);
        console.log("UserNav: Client-side firebaseClientSignOut() completed.");
        toast({ title: "Logged out", description: "You have been successfully logged out." });
        
        // Step 3: Redirect to a clean login page.
        router.push('/login'); 
        router.refresh(); // Crucial to ensure the app state is completely reset.
        console.log("UserNav: Redirected to /login and refreshed router state.");
      } catch (clientSignOutError: any) {
        console.error('UserNav: Critical error during client-side signOut:', clientSignOutError);
        toast({ variant: "destructive", title: "Client Logout Failed", description: clientSignOutError.message });
        // Still force redirect even if client signout fails for some reason.
        router.push('/login');
        router.refresh();
      }
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
