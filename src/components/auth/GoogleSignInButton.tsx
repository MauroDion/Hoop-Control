
"use client";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/client";
import { GoogleAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);


export function GoogleSignInButton() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      
      if (result.user) {
        const idToken = await result.user.getIdToken();
        const response = await fetch('/api/auth/session-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Session login failed for Google Sign-In.');
        }
        console.log("GoogleSignInButton: Session cookie should be set by server.");
      }

      toast({ title: "Signed in with Google", description: `Welcome, ${result.user.displayName}!` });
      router.push(redirectUrl);
      router.refresh(); 
    } catch (error: any) {
      console.error("Google Sign-In error: ", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  return (
    <Button variant="outline" type="button" onClick={handleSignIn} className="w-full">
      <GoogleIcon />
      Sign in with Google
    </Button>
  );
}
