
"use client";

import { Button } from "@/components/ui/button";
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createFirestoreUserProfile } from '@/lib/actions/users';

const provider = new GoogleAuthProvider();

export function GoogleSignInButton() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const additionalInfo = getAdditionalUserInfo(result);

            if (additionalInfo?.isNewUser) {
                await createFirestoreUserProfile(user.uid, {
                    email: user.email!,
                    displayName: user.displayName!,
                    photoURL: user.photoURL,
                });
                router.push('/profile/complete-registration');
            } else {
                // For existing users, the AuthProvider's onIdTokenChanged will handle redirection
                // after session login is successful.
                toast({ title: "Inicio de sesión exitoso", description: `¡Bienvenido de nuevo, ${user.displayName}!` });
            }

        } catch (error: any) {
            console.error("Google Sign-In Error:", error);
            toast({
                variant: 'destructive',
                title: 'Error de inicio de sesión',
                description: error.message,
            });
        }
    };
    
    return (
        <Button onClick={handleSignIn} variant="outline" className="w-full">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.5l-62.7 62.7C337 97.2 296.3 80 248 80c-82.8 0-150.5 67.7-150.5 150.5S165.2 431 248 431c9.4 0 18.6-1.3 27.6-3.6 11.2-2.8 21.6-7.3 31.4-13.4 10.9-6.8 21.1-15.1 29.8-25.2l62.7 62.7c-40.3 38.4-94.8 61.5-151.5 61.5C110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.5l-62.7 62.7C337 97.2 296.3 80 248 80c-82.8 0-150.5 67.7-150.5 150.5S165.2 431 248 431c9.4 0 18.6-1.3 27.6-3.6 11.2-2.8 21.6-7.3 31.4-13.4 10.9-6.8 21.1-15.1 29.8-25.2l62.7 62.7c-40.3 38.4-94.8 61.5-151.5 61.5-133.5 0-241.5-108.1-241.5-241.5S114.5 14.5 248 14.5c80.3 0 150.2 46.2 189.6 115.6l-62.7 62.7c-19.5-23.4-48.2-39.6-80.6-39.6-66.8 0-120.9 54.1-120.9 120.9s54.1 120.9 120.9 120.9c47.7 0 88.5-27.5 108.3-66.9H248v-85.3h236.2c4.7 25.5 7.8 52.4 7.8 81.3z"></path>
            </svg>
            Continuar con Google
        </Button>
    );
}
