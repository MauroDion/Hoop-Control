
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TeamFormData, GameFormat, CompetitionCategory } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createTeam } from "@/app/teams/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Using a unique string to represent a null selection in the form,
// and then transforming it to actual null for data processing.
const NULL_VALUE = "__NULL__";

const teamFormSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters long.").max(100, "Team name must be 100 characters or less."),
  gameFormatId: z.string().optional().nullable()
    .transform(value => value === NULL_VALUE ? null : value),
  competitionCategoryId: z.string().optional().nullable()
    .transform(value => value === NULL_VALUE ? null : value),
  coachIds: z.string().optional().describe("Comma-separated User IDs of coaches"),
  coordinatorIds: z.string().optional().describe("Comma-separated User IDs of coordinators"),
  playerIds: z.string().optional().describe("Comma-separated Player IDs"),
  logoUrl: z.string().url({ message: "Please enter a valid URL for the logo." }).optional().or(z.literal("")).nullable(),
  city: z.string().optional().nullable(),
});

interface TeamFormProps {
  clubId: string;
  gameFormats: GameFormat[];
  competitionCategories: CompetitionCategory[];
  onFormSubmit?: () => void;
}

export function TeamForm({ clubId, gameFormats, competitionCategories, onFormSubmit }: TeamFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      gameFormatId: null,
      competitionCategoryId: null,
      coachIds: "",
      coordinatorIds: "",
      playerIds: "",
      logoUrl: "",
      city: "",
    },
  });

  async function onSubmit(values: z.infer<typeof teamFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a team." });
      return;
    }

    const teamData: TeamFormData = { ...values };

    const result = await createTeam(teamData, clubId, user.uid);

    if (result.success) {
      toast({
        title: "Team Created",
        description: `Team "${values.name}" has been successfully created.`,
      });
      form.reset(); // Clear form fields on success
      if (onFormSubmit) {
        onFormSubmit(); // Callback to refresh parent data
      } else {
        // Fallback if no callback is provided
        router.push(`/clubs/${clubId}`);
        router.refresh(); 
      }
    } else {
      toast({
        variant: "destructive",
        title: "Team Creation Failed",
        description: result.error || "An unexpected error occurred.",
      });
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user data...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter team name (e.g., U12 Eagles)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gameFormatId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Format</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || undefined}
                disabled={gameFormats.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={gameFormats.length === 0 ? "No game formats available" : "Select a game format (optional)"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NULL_VALUE}>No Specific Format</SelectItem>
                  {gameFormats.map(format => (
                    <SelectItem key={format.id} value={format.id}>{format.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="competitionCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Competition Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || undefined}
                disabled={competitionCategories.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={competitionCategories.length === 0 ? "No categories available" : "Select a category (optional)"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                   <SelectItem value={NULL_VALUE}>No Specific Category</SelectItem>
                  {competitionCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Team's primary city" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL (Optional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/logo.png" {...field} value={field.value ?? ""}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="coachIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coach IDs (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter comma-separated User IDs of coaches" {...field} />
              </FormControl>
              <FormDescription>
                Enter the Firebase User IDs for each coach, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coordinatorIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coordinator IDs (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter comma-separated User IDs of coordinators" {...field} />
              </FormControl>
              <FormDescription>
                Enter the Firebase User IDs for each coordinator, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="playerIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player IDs (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter comma-separated Player IDs" {...field} />
              </FormControl>
              <FormDescription>
                Enter the unique Player IDs, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Team...
            </>
          ) : (
            "Create Team"
          )}
        </Button>
      </form>
    </Form>
  );
}
