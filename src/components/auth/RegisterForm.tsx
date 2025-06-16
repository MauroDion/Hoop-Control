
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
      setLoadingClubs(true);
      try {
        const approvedClubs = await getApprovedClubs();
        setClubs(approvedClubs);
      } catch (error) {
        console.error("Failed to fetch clubs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load clubs. Please try again later.",
        });
      } finally {
        setLoadingClubs(false);
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
      // profileType: undefined, // Let zod handle if not selected
      // selectedClubId: undefined, // Let zod handle if not selected
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Update Firebase Auth profile (displayName)
      if (user) {
        await updateFirebaseAuthProfile(user, { displayName: values.name });
      } else {
        throw new Error("User creation failed in Firebase Auth.");
      }

      // 3. Create user profile in Firestore via Server Action
      const profileResult = await createUserFirestoreProfile(user.uid, {
        email: user.email,
        displayName: values.name, // Use name from form as displayName
        profileType: values.profileType,
        selectedClubId: values.selectedClubId,
        photoURL: user.photoURL,
      });

      if (!profileResult.success) {
        // Potentially roll back Auth user creation or mark for cleanup if Firestore profile creation fails
        // For now, just show an error. A more robust solution would handle this inconsistency.
        throw new Error(profileResult.error || "Failed to create user profile data.");
      }

      toast({
        title: "Registration Submitted",
        description: "Your account has been created and is pending admin approval. You will be notified once approved.",
        duration: 5000, // Keep message longer
      });
      router.push("/login"); // Redirect to login page
      // No router.refresh() here as this is client-side nav after submission.
      // If middleware relies on server state for redirect from /login, it might be needed upon navigating to /login.
      // However, user is not "authenticated" yet in the sense of approved.
    } catch (error: any) {
      console.error("Registration error: ", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  }

  return (
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
                  {profileTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
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
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingClubs}>
                <FormControl>
                  <SelectTrigger>
                    {loadingClubs ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading clubs...
                      </span>
                    ) : (
                      <SelectValue placeholder="Select the club you belong to" />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!loadingClubs && clubs.length === 0 && (
                    <p className="p-2 text-sm text-muted-foreground">No clubs available.</p>
                  )}
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || loadingClubs}>
          {form.formState.isSubmitting ? "Registering..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
