
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
import type { Club, ProfileType } from "@/types";
import { Loader2 } from "lucide-react";

const profileTypes: { value: ProfileType; label: string }[] = [
  { value: "club_admin", label: "Club Admin" },
  { value: "coach", label: "Coach" },
  { value: "player", label: "Player" },
  { value: "parent_guardian", label: "Parent/Guardian" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  profileType: z.custom<ProfileType>((val) => profileTypes.map(pt => pt.value).includes(val as ProfileType), {
    message: "Please select a valid profile type.",
  }),
  selectedClubId: z.string().min(1, { message: "Please select a club." }),
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);

  useEffect(() => {
    async function fetchClubs() {
      console.log("RegisterForm: useEffect fetchClubs - START");
      setLoadingClubs(true);
      try {
        const fetchedClubs = await getApprovedClubs();
        console.log("RegisterForm: useEffect fetchClubs - Raw fetched clubs data from action:", fetchedClubs);
        if (Array.isArray(fetchedClubs)) {
          setClubs(fetchedClubs);
          console.log(`RegisterForm: useEffect fetchClubs - Set ${fetchedClubs.length} clubs.`);
        } else {
          console.error("RegisterForm: useEffect fetchClubs - Fetched clubs is not an array:", fetchedClubs);
          setClubs([]);
           toast({
            variant: "destructive",
            title: "Error Loading Clubs",
            description: "Received invalid data for clubs. Please contact support.",
          });
        }
      } catch (error: any) {
        console.error("RegisterForm: useEffect fetchClubs - Failed to fetch clubs:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Clubs",
          description: error.message || "Could not load the list of clubs. Please try refreshing the page.",
        });
        setClubs([]);
      } finally {
        setLoadingClubs(false);
        console.log("RegisterForm: useEffect fetchClubs - FINISHED. loadingClubs state: false");
      }
    }
    fetchClubs();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      // profileType and selectedClubId will be undefined initially, Zod handles this
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
        profileType: values.profileType,
        selectedClubId: values.selectedClubId,
        photoURL: user.photoURL,
      });
      console.log("RegisterForm: onSubmit - Firestore profile creation result:", profileResult);

      if (!profileResult.success) {
        throw new Error(profileResult.error || "Failed to create user profile data.");
      }

      toast({
        title: "Registration Submitted",
        description: "Your account has been created and is pending admin approval. You will be notified once approved.",
        duration: 5000,
      });
      router.push("/login");
    } catch (error: any) {
      console.error("RegisterForm: onSubmit - ERROR:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  }
  
  console.log("RegisterForm: Rendering component. loadingClubs:", loadingClubs, "Clubs count:", clubs.length, "ProfileTypes count:", profileTypes.length);

  return (
    <>
      {/* TEMPORARY DEBUG INFO - REMOVE LATER */}
      <div className="p-2 mb-4 border border-dashed border-red-500 bg-red-50 text-red-700 text-xs">
        <p><strong>DEBUG INFO (Remove Later):</strong></p>
        <p>Loading Clubs: {loadingClubs.toString()}</p>
        <p>Clubs Loaded: {clubs.length}</p>
        <p>Profile Types Available: {profileTypes.length}</p>
      </div>
      {/* END TEMPORARY DEBUG INFO */}

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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your profile type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profileTypes.length === 0 && <div className="p-2 text-sm text-muted-foreground text-center">No profile types available.</div>}
                    {console.log("RegisterForm: Rendering ProfileType Select. Items to render:", profileTypes)}
                    {profileTypes.map((type, index) => {
                      console.log("RegisterForm: Rendering profile type SelectItem", index, type);
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      );
                    })}
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
                    {console.log("RegisterForm: Rendering Clubs Select. loadingClubs:", loadingClubs, "Clubs to render:", clubs)}
                    { loadingClubs ? (
                       <div className="p-2 text-sm text-muted-foreground text-center">Loading clubs...</div>
                    ) : clubs.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">No clubs found. Check Firestore (collection 'clubs', field 'name', indexes, rules) or terminal logs for errors.</div>
                    ) : (
                      clubs.map((club, index) => {
                         console.log("RegisterForm: Rendering club SelectItem", index, "ID:", club.id, "Name:", club.name);
                         return (
                           <SelectItem key={club.id} value={club.id}>
                             {club.name || 'Unnamed Club'}
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
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || loadingClubs}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {form.formState.isSubmitting ? "Registering..." : "Create Account"}
          </Button>
        </form>
      </Form>
    </>
  );
}

    