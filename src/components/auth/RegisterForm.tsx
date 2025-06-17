
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
// This ensures that even if data comes from DB (via `profileTypes` collection's `id` field),
// it matches one of the expected types defined in src/types/index.ts.
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  profileType: z.enum(['club_admin', 'coach', 'player', 'parent_guardian', 'other'], {
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
        throw new Error("User creation failed in Firebase Auth.");
      }

      const profileResult = await createUserFirestoreProfile(user.uid, {
        email: user.email,
        displayName: values.name,
        profileType: values.profileType, // This now comes from the form, validated against the enum
        selectedClubId: values.selectedClubId,
        photoURL: user.photoURL,
      });
      console.log("RegisterForm: onSubmit - Firestore profile creation result:", profileResult);

      if (!profileResult.success) {
        throw new Error(profileResult.error || "Failed to create user profile data.");
      }

      toast({
        title: "Registration Submitted",
        description: "Your account has been created. It may require admin approval before full access.",
        duration: 7000, // Increased duration
      });
      router.push("/login"); // Redirect to login, then to dashboard after login
    } catch (error: any) {
      console.error("RegisterForm: onSubmit - ERROR:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  }
  
  console.log("RegisterForm: Rendering component. loadingClubs:", loadingClubs, "Clubs count:", clubs.length, "loadingProfileTypes:", loadingProfileTypes, "ProfileTypeOptions count:", profileTypeOptions.length);

  return (
    <>
      <div className="p-2 mb-4 border border-dashed border-red-500 bg-red-50 text-red-700 text-xs">
        <p><strong>DEBUG INFO (Remove Later):</strong></p>
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
                  defaultValue={field.value} // This should be initially undefined or match a valid value
                  disabled={loadingProfileTypes || profileTypeOptions.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingProfileTypes 
                          ? "Loading profile types..." 
                          : profileTypeOptions.length === 0 
                            ? "No profile types found (check DB/logs)" 
                            : "Select your profile type"
                        } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    { console.log("RegisterForm: Rendering ProfileType Select. loadingProfileTypes:", loadingProfileTypes, "Items to render:", profileTypeOptions) }
                    { loadingProfileTypes ? (
                       <div className="p-2 text-sm text-muted-foreground text-center">Loading profile types...</div>
                    ) : profileTypeOptions.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">No profile types found. Ensure 'profileTypes' collection exists in Firestore with 'id' and 'label' fields, and check server logs for 'ProfileTypeActions'.</div>
                    ) : (
                      profileTypeOptions.map((type, index) => {
                        console.log("RegisterForm: Rendering profile type SelectItem", index, type);
                        return (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label || `Unnamed Type ID: ${type.id}`}
                          </SelectItem>
                        );
                      })
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
                  defaultValue={field.value} // This should be initially undefined or match a valid value
                  disabled={loadingClubs || clubs.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingClubs
                            ? "Loading clubs..."
                            : clubs.length === 0
                            ? "No clubs available (check logs/DB)"
                            : "Select the club you belong to"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    { console.log("RegisterForm: Rendering Clubs Select. loadingClubs:", loadingClubs, "Clubs to render:", clubs) }
                    { loadingClubs ? (
                       <div className="p-2 text-sm text-muted-foreground text-center">Loading clubs...</div>
                    ) : clubs.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">No clubs found. Check server logs for 'ClubActions', Firestore collection 'clubs', its content (especially 'name' field), indexes, and security rules.</div>
                    ) : (
                      clubs.map((club, index) => {
                         console.log("RegisterForm: Rendering club SelectItem", index, club);
                         return (
                           <SelectItem key={club.id} value={club.id}>
                             {club.name || `Unnamed Club ID: ${club.id}`}
                           </SelectItem>
                         );
                      })
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

