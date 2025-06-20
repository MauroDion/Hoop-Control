
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
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { createUserFirestoreProfile } from "@/app/users/actions";
import { getApprovedClubs } from "@/app/clubs/actions";
import { getProfileTypeOptions } from "@/app/profile-types/actions";
import type { Club, ProfileType, ProfileTypeOption } from "@/types";
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
        const fetchedClubs = await getApprovedClubs();
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
    let profileResult = { success: false, error: "Profile creation not attempted." };

    try {
      userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      firebaseUser = userCredential.user;
      console.log("RegisterForm: onSubmit - Firebase Auth user created:", firebaseUser?.uid);

      if (firebaseUser) {
        await updateFirebaseAuthProfile(firebaseUser, { displayName: values.name });
        console.log("RegisterForm: onSubmit - Firebase Auth profile updated with displayName.");

        const profileDataForFirestore = {
          email: firebaseUser.email,
          displayName: values.name,
          profileType: values.profileType,
          selectedClubId: values.selectedClubId,
          photoURL: firebaseUser.photoURL,
        };
        console.log("RegisterForm: onSubmit - Data being passed to createUserFirestoreProfile:", profileDataForFirestore);

        profileResult = await createUserFirestoreProfile(firebaseUser.uid, profileDataForFirestore);
        console.log("RegisterForm: onSubmit - Firestore profile creation result:", profileResult);

        if (profileResult.success) {
          toast({
            title: "Registration Submitted",
            description: "Your account is created and awaiting administrator approval. You will be signed out.",
            duration: 7000,
          });
        } else {
          // Firestore profile creation failed
          let detailedDescription = profileResult.error || "Failed to create user profile data.";
            if (profileResult.error && profileResult.error.toLowerCase().includes('permission denied')) {
                detailedDescription = `Permission denied by Firestore. Please check your Firestore security rules for 'user_profiles' and server logs. Firestore error code: ${profileResult.error.split('code: ')[1] || 'unknown'}`;
            } else if (profileResult.error && profileResult.error.toLowerCase().includes('invalid data') && profileResult.error.toLowerCase().includes('undefined')) {
                detailedDescription = `Failed to save profile: Invalid data sent to Firestore (field undefined). Error: ${profileResult.error.split('Error: ')[1] || profileResult.error}`;
            }
          toast({
            variant: "destructive",
            title: "Profile Creation Failed",
            description: detailedDescription,
            duration: 9000,
          });
        }
      } else {
        console.error("RegisterForm: onSubmit - User creation failed in Firebase Auth (user object is null).");
        toast({ variant: "destructive", title: "Registration Failed", description: "User authentication failed." });
        // No firebaseUser, so can't proceed to signOut or redirect based on profileResult.
        // Form submission will effectively end here for this case.
        return;
      }

    } catch (error: any) {
      console.error("RegisterForm: onSubmit - ERROR during Firebase Auth user creation:", error);
      let description = "An unexpected error occurred during registration.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use. Please use a different email or try logging in.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: description,
      });
      // If auth creation failed, profileResult remains as initial failure.
      // We'll still proceed to finally block to attempt sign out if firebaseUser was somehow partially set.
    } finally {
      // Attempt to sign out regardless of where the process failed,
      // as long as auth object is available.
      // This ensures the user isn't left in a partially logged-in state on the client
      // if any part of the registration (Auth or Firestore profile) fails.
      if (auth.currentUser) { // Check if there's a current user to sign out
        try {
          await signOut(auth);
          console.log("RegisterForm: onSubmit (finally) - User signed out.");
        } catch (signOutError) {
          console.error("RegisterForm: onSubmit (finally) - Error signing out user:", signOutError);
        }
      } else {
          console.log("RegisterForm: onSubmit (finally) - No current user to sign out.");
      }
      
      // Redirect based on whether the Firestore profile was successfully created
      if (profileResult.success) {
        router.push("/login?status=pending_approval");
      } else {
        // If profile creation failed (or was not attempted due to Auth failure),
        // just go to login. The error toasts should inform the user.
        router.push("/login");
      }
      router.refresh(); // To update any server-side session/cookie state if applicable
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
