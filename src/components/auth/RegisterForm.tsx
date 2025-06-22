
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
import { createUserWithEmailAndPassword, signOut, UserCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/client"; 
import { useRouter } from "next/navigation";
import { finalizeNewUserProfile } from "@/app/users/actions";
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
      setLoadingClubs(true);
      setLoadingProfileTypes(true);
      try {
        const [fetchedClubs, fetchedProfileTypes] = await Promise.all([
           getApprovedClubs(),
           getProfileTypeOptions()
        ]);
        
        setClubs(Array.isArray(fetchedClubs) ? fetchedClubs : []);
        setProfileTypeOptions(Array.isArray(fetchedProfileTypes) ? fetchedProfileTypes : []);
        
        if (!Array.isArray(fetchedClubs)) console.warn("RegisterForm: Fetched clubs is not an array:", fetchedClubs);
        if (!Array.isArray(fetchedProfileTypes)) console.warn("RegisterForm: Fetched profile types is not an array:", fetchedProfileTypes);

      } catch (error: any) {
        console.error("RegisterForm: Failed to fetch data for form:", error);
        toast({ variant: "destructive", title: "Error Loading Data", description: error.message || "Could not load clubs or profile types."});
        setClubs([]);
        setProfileTypeOptions([]);
      } finally {
        setLoadingClubs(false);
        setLoadingProfileTypes(false);
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
    let userCredential: UserCredential | undefined;
    
    try {
      // Step 1: Create the user in Firebase Auth client-side
      userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("User creation failed, user object is null.");
      }
      
      console.log("RegisterForm: Auth user created. Getting ID token...");
      const idToken = await firebaseUser.getIdToken();
      console.log("RegisterForm: Got ID token. Calling server action to finalize profile.");

      // Step 2: Call the robust server action to create the Firestore profile
      const profileResult = await finalizeNewUserProfile(idToken, {
        displayName: values.name,
        profileType: values.profileType,
        selectedClubId: values.selectedClubId,
      });

      if (!profileResult.success) {
        // If the backend fails, this is a critical error. The `catch` block will handle cleanup.
        throw new Error(profileResult.error || "Failed to create user profile on the server.");
      }

      // Step 3: Success! Inform the user, sign out, and redirect.
      toast({
        title: "Registration Submitted",
        description: "Your registration has been submitted. An administrator will review it shortly. You will be able to log in once your account is approved.",
        duration: 7000,
      });
      
      await signOut(auth);
      router.push("/login?status=pending_approval");
      router.refresh();

    } catch (error: any) {
      console.error("RegisterForm: ERROR during registration process:", error);

      // --- Cleanup on Failure ---
      // If we created an auth user but the process failed later, delete the auth user
      // to prevent creating a "ghost" user with no profile.
      if (userCredential?.user) {
          console.warn("RegisterForm: Deleting partially created user due to subsequent error...");
          try {
              await userCredential.user.delete();
              console.log("RegisterForm: Successfully deleted partially created user.");
          } catch (deleteError) {
              console.error("RegisterForm: CRITICAL - Failed to delete partially created user. This user must be manually removed from Firebase Auth:", userCredential.user.uid, deleteError);
          }
      }

      // --- Inform User of Failure ---
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
        duration: 9000,
      });
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
                            ? "No profile types available"
                            : "Select your profile type"
                        } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profileTypeOptions.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label || `Unnamed Type ID: ${type.id}`}
                        </SelectItem>
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
                            ? "No clubs available"
                            : "Select the club you belong to"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clubs.map((club) => (
                         <SelectItem key={club.id} value={club.id}>
                           {club.name || `Unnamed Club ID: ${club.id}`}
                         </SelectItem>
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
