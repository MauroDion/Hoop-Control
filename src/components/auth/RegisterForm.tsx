
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword, updateProfile as updateFirebaseAuthProfile, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client"; // Import db
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; // Import Firestore functions
import { useRouter } from "next/navigation";
// Removed: import { createUserFirestoreProfile } from "@/app/users/actions";
import { getClubs } from "@/app/clubs/actions";
import { getProfileTypeOptions } from "@/app/profile-types/actions";
import type { Club, ProfileType, ProfileTypeOption, UserFirestoreProfile, UserProfileStatus } from "@/types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  profileType: z.enum([
    'club_admin',
    'coach',
    'coordinator',
    'parent_guardian',
    'player',
    'scorer',
    'super_admin',
    'user'
    ], {
    errorMap: () => ({ message: "Please select a valid profile type." })
  }),
  selectedClubId: z.string().min(1, { message: "Please select a club." }),
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [profileTypeOptions, setProfileTypeOptions] = useState<ProfileTypeOption[]>([]);
  const [loadingProfileTypes, setLoadingProfileTypes] = useState(true);

  useEffect(() => {
    async function fetchData() {
      console.log("RegisterForm: useEffect fetchClubs - START");
      setLoadingClubs(true);
      try {
        const fetchedClubs = await getClubs();
        console.log("RegisterForm: useEffect fetchClubs - Raw fetched clubs data from action:", fetchedClubs);
        setClubs(Array.isArray(fetchedClubs) ? fetchedClubs : []);
        if (!Array.isArray(fetchedClubs)) {
          console.warn("RegisterForm: Fetched clubs is not an array:", fetchedClubs);
           toast({ variant: "destructive", title: "Error Loading Clubs", description: "Received invalid data format for clubs."});
        } else {
           console.log(`RegisterForm: useEffect fetchClubs - Set ${fetchedClubs.length} clubs.`);
        }
      } catch (error: any) {
        console.error("RegisterForm: useEffect fetchClubs - Failed to fetch clubs:", error);
        toast({ variant: "destructive", title: "Error Loading Clubs", description: error.message || "Could not load clubs."});
        setClubs([]);
      } finally {
        setLoadingClubs(false);
        console.log("RegisterForm: useEffect fetchClubs - FINISHED. loadingClubs state: false");
      }

      console.log("RegisterForm: useEffect fetchProfileTypes - START");
      setLoadingProfileTypes(true);
      try {
        const fetchedProfileTypes = await getProfileTypeOptions();
        console.log("RegisterForm: useEffect fetchProfileTypes - Raw fetched profile types data from action:", fetchedProfileTypes);
        setProfileTypeOptions(Array.isArray(fetchedProfileTypes) ? fetchedProfileTypes : []);
         if (!Array.isArray(fetchedProfileTypes)) {
          console.warn("RegisterForm: Fetched profile types is not an array:", fetchedProfileTypes);
           toast({ variant: "destructive", title: "Error Loading Profile Types", description: "Received invalid data format for profile types."});
        } else {
           console.log(`RegisterForm: useEffect fetchProfileTypes - Set ${fetchedProfileTypes.length} profile types.`);
        }
      } catch (error: any) {
        console.error("RegisterForm: useEffect fetchProfileTypes - Failed to fetch profile types:", error);
        toast({ variant: "destructive", title: "Error Loading Profile Types", description: error.message || "Could not load profile types."});
        setProfileTypeOptions([]);
      } finally {
        setLoadingProfileTypes(false);
        console.log("RegisterForm: useEffect fetchProfileTypes - FINISHED. loadingProfileTypes state: false");
      }
    }
    fetchData();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("RegisterForm: onSubmit - Values submitted by form:", values);
    let userCredential;
    let firebaseUser;
    let firestoreProfileSuccess = false;

    try {
      userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      firebaseUser = userCredential.user;
      console.log("RegisterForm: onSubmit - Firebase Auth user created:", firebaseUser?.uid);

      if (firebaseUser) {
        await updateFirebaseAuthProfile(firebaseUser, { displayName: values.name });
        console.log("RegisterForm: onSubmit - Firebase Auth profile updated with displayName.");

        const userProfileRef = doc(db, 'user_profiles', firebaseUser.uid);
        const profileToSave: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: values.name,
            photoURL: firebaseUser.photoURL || null,
            profileTypeId: values.profileType,
            clubId: values.selectedClubId,
            status: 'pending_approval' as UserProfileStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        
        console.log("RegisterForm: onSubmit - Data being sent to Firestore (client-side setDoc):", profileToSave);
        await setDoc(userProfileRef, profileToSave);
        firestoreProfileSuccess = true;
        console.log("RegisterForm: onSubmit - Firestore profile creation (client-side setDoc) successful.");

        toast({
          title: "Registration Submitted",
          description: "Your account is created and awaiting administrator approval. You will be signed out.",
          duration: 7000,
        });
      } else {
        console.error("RegisterForm: onSubmit - User creation failed in Firebase Auth (user object is null).");
        toast({ variant: "destructive", title: "Registration Failed", description: "User authentication failed." });
      }

    } catch (error: any) {
      console.error("RegisterForm: onSubmit - ERROR during registration process:", error);
      let description = "An unexpected error occurred during registration.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use. Please use a different email or try logging in.";
      } else if (error.code && error.code.includes('firestore') && error.message && error.message.toLowerCase().includes('permission denied')) {
        description = `Firestore permission denied. Please check security rules. Error: ${error.message}`;
        firestoreProfileSuccess = false; // Ensure this is marked as failed
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: description,
        duration: 9000,
      });
    } finally {
      console.log("RegisterForm: onSubmit (finally) block executing.");
      if (auth.currentUser) {
        try {
          await signOut(auth);
          console.log("RegisterForm: onSubmit (finally) - User signed out.");
        } catch (signOutError) {
          console.error("RegisterForm: onSubmit (finally) - Error signing out user:", signOutError);
        }
      } else {
          console.log("RegisterForm: onSubmit (finally) - No current user to sign out (might have failed before full auth or already signed out).");
      }
      
      if (firestoreProfileSuccess) {
        router.push("/login?status=pending_approval");
      } else {
        // If profile creation failed or auth failed, just go to login.
        // The error toasts should inform the user.
        router.push("/login");
      }
      router.refresh();
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="profileType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loadingProfileTypes || profileTypeOptions.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingProfileTypes
                          ? "Loading profile types..."
                          : profileTypeOptions.length === 0
                            ? "No profile types (check DB/logs/rules/indexes)"
                            : "Select your profile type"
                        } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    { loadingProfileTypes ? (
                       <div className="p-2 text-sm text-muted-foreground text-center">Loading profile types...</div>
                    ) : profileTypeOptions.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">No profile types found. Ensure 'profileTypes' collection exists, is readable, and has 'name' field for ordering. Check server logs for 'ProfileTypeActions'.</div>
                    ) : (
                      profileTypeOptions.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label || `Unnamed Type ID: ${type.id}`}
                          </SelectItem>
                        )
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="selectedClubId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Your Club</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loadingClubs || clubs.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingClubs
                            ? "Loading clubs..."
                            : clubs.length === 0
                            ? "No clubs available (check logs/DB/rules)"
                            : "Select the club you belong to"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    { loadingClubs ? (
                       <div className="p-2 text-sm text-muted-foreground text-center">Loading clubs...</div>
                    ) : clubs.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">No clubs found. Ensure 'clubs' collection exists, is readable, and has 'name' field. Check server logs for 'ClubActions'.</div>
                    ) : (
                      clubs.map((club) => (
                           <SelectItem key={club.id} value={club.id}>
                             {club.name || `Unnamed Club ID: ${club.id}`}
                           </SelectItem>
                         )
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || loadingClubs || loadingProfileTypes}>
            {(form.formState.isSubmitting || loadingClubs || loadingProfileTypes) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {form.formState.isSubmitting ? "Registering..." : "Create Account"}
          </Button>
        </form>
      </Form>
    </>
  );
}

    
