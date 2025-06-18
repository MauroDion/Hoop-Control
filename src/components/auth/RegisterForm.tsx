
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
import { createUserWithEmailAndPassword, updateProfile as updateFirebaseAuthProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { createUserFirestoreProfile } from "@/app/users/actions";
import { getApprovedClubs } from "@/app/clubs/actions";
import { getProfileTypeOptions } from "@/app/profile-types/actions";
import type { Club, ProfileType, ProfileTypeOption } from "@/types";
import { Loader2 } from "lucide-react";

// Schema uses explicit enum values from ProfileType for validation
// This list MUST match the ProfileType definition in src/types/index.ts
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
      // Fetch Clubs
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

      // Fetch Profile Types
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
      // profileType and selectedClubId will be undefined initially, user must select
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("RegisterForm: onSubmit - Values:", values);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      console.log("RegisterForm: onSubmit - Firebase Auth user created:", user?.uid);

      if (user) {
        await updateFirebaseAuthProfile(user, { displayName: values.name });
        console.log("RegisterForm: onSubmit - Firebase Auth profile updated with displayName.");
      } else {
        console.error("RegisterForm: onSubmit - User creation failed in Firebase Auth (user object is null).");
        toast({ variant: "destructive", title: "Registration Failed", description: "User authentication failed." });
        return;
      }

      const profileResult = await createUserFirestoreProfile(user.uid, {
        email: user.email,
        displayName: values.name,
        profileType: values.profileType, 
        selectedClubId: values.selectedClubId,
        photoURL: user.photoURL,
      });
      console.log("RegisterForm: onSubmit - Firestore profile creation result:", profileResult);

      if (!profileResult.success) {
        let detailedDescription = profileResult.error || "Failed to create user profile data.";
        // Check for the specific permission denied error string that our server action returns
        if (profileResult.error && profileResult.error.toLowerCase().includes("permission denied")) {
            detailedDescription = "Failed to save profile: Permission denied by Firestore. Please check your Firestore security rules for the 'users' collection and ensure they allow profile creation (e.g., with 'pending_approval' status and matching UIDs). Also, review server logs for details on the data being sent.";
        }
        toast({
            variant: "destructive",
            title: "Profile Creation Failed",
            description: detailedDescription,
            duration: 9000, 
        });
        return; 
      }

      toast({
        title: "Registration Submitted",
        description: "Your account has been created. It may require admin approval before full access.",
        duration: 7000, 
      });
      router.push("/login"); 
    } catch (error: any) {
      console.error("RegisterForm: onSubmit - ERROR:", error);
      let description = "An unexpected error occurred during registration.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use. Please use a different email or try logging in.";
      } else if (error.message) {
        // For other Firebase Auth errors or general errors during auth step
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: description,
      });
    }
  }
  
  return (
    <>
      <div className="p-2 mb-4 border border-dashed border-blue-500 bg-blue-50 text-blue-700 text-xs">
        <p><strong>DEBUG INFO (Remove When Stable):</strong></p>
        <p>Loading Clubs: {loadingClubs.toString()}</p>
        <p>Clubs Loaded: {clubs.length}</p>
        <p>Loading Profile Types: {loadingProfileTypes.toString()}</p>
        <p>Profile Types Loaded: {profileTypeOptions.length}</p>
        {clubs.length > 0 && <p>First club name: {clubs[0].name}</p>}
        {profileTypeOptions.length > 0 && <p>First profile type option: {profileTypeOptions[0].label} (ID: {profileTypeOptions[0].id})</p>}
      </div>

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
                      <div className="p-2 text-sm text-muted-foreground text-center">No profile types found. Ensure 'profileTypes' collection exists in Firestore, has readable documents with valid 'id' and 'label' fields, server action has permissions, and the required Firestore index for 'label' ordering is present. Check server logs for 'ProfileTypeActions'.</div>
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
                      <div className="p-2 text-sm text-muted-foreground text-center">No clubs found. Check server logs for 'ClubActions', Firestore collection 'clubs', its content (especially 'name' field), and security rules allowing read access.</div>
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

