"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect } from "react";
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
import type { TeamFormData, GameFormat, CompetitionCategory, UserFirestoreProfile, Team } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createTeam, updateTeam } from "@/app/teams/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "../ui/separator";

const teamFormSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters long.").max(100, "Team name must be 100 characters or less."),
  competitionCategoryId: z.string().min(1, "Competition Category is required."),
  gameFormatId: z.string().optional().nullable(),
  coachIds: z.array(z.string()).optional().default([]),
  coordinatorIds: z.array(z.string()).optional().default([]),
});

interface TeamFormProps {
  clubId: string;
  gameFormats: GameFormat[];
  competitionCategories: CompetitionCategory[];
  coaches: UserFirestoreProfile[];
  coordinators: UserFirestoreProfile[];
  onFormSubmit?: () => void;
  team?: Team; // For edit mode
}

export function TeamForm({ clubId, gameFormats, competitionCategories, coaches, coordinators, onFormSubmit, team }: TeamFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name || "",
      competitionCategoryId: team?.competitionCategoryId || "",
      gameFormatId: team?.gameFormatId || undefined,
      coachIds: team?.coachIds || [],
      coordinatorIds: team?.coordinatorIds || [],
    },
  });

  const { watch, setValue, reset } = form;
  const selectedCompetitionId = watch("competitionCategoryId");

  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        competitionCategoryId: team.competitionCategoryId || "",
        gameFormatId: team.gameFormatId,
        coachIds: team.coachIds || [],
        coordinatorIds: team.coordinatorIds || [],
      });
    }
  }, [team, reset]);

  useEffect(() => {
    if (selectedCompetitionId) {
      const category = competitionCategories.find(c => c.id === selectedCompetitionId);
      if (category && category.gameFormatId) {
        setValue("gameFormatId", category.gameFormatId, { shouldValidate: true });
      } else {
        setValue("gameFormatId", null, { shouldValidate: true });
      }
    }
  }, [selectedCompetitionId, competitionCategories, setValue]);

  async function onSubmit(values: z.infer<typeof teamFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }

    const result = team 
      ? await updateTeam(team.id, values, user.uid)
      : await createTeam(values, clubId, user.uid);
      
    if (result.success) {
      toast({
        title: team ? "Team Updated" : "Team Created",
        description: `Team "${values.name}" has been successfully ${team ? 'updated' : 'created'}.`,
      });
      if (!team) form.reset();
      if (onFormSubmit) onFormSubmit();
      
    } else {
      toast({
        variant: "destructive",
        title: team ? "Update Failed" : "Creation Failed",
        description: result.error || "An unexpected error occurred.",
      });
    }
  }
  
  const selectedGameFormatName = gameFormats.find(f => f.id === watch("gameFormatId"))?.name;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          name="competitionCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Competition Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={competitionCategories.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={competitionCategories.length === 0 ? "No categories available" : "Select a category"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {competitionCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel>Game Format</FormLabel>
          <FormControl>
              <Input 
                value={selectedGameFormatName || "Automatically selected based on category"} 
                disabled 
              />
          </FormControl>
           <FormDescription>
            The game format is determined by the selected competition category.
          </FormDescription>
          <FormMessage />
        </FormItem>
        
        <Separator />
        
        <FormField
          control={form.control}
          name="coachIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Assign Coaches</FormLabel>
                <FormDescription>
                  Select from the approved coaches for this club.
                </FormDescription>
              </div>
              <div className="space-y-2">
                {coaches.length > 0 ? coaches.map((item) => (
                  <FormField
                    key={item.uid}
                    control={form.control}
                    name="coachIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.uid}
                          className="flex flex-row items-center space-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.uid)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.uid])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.uid
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">
                            {item.displayName} <span className="text-muted-foreground">({item.email})</span>
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                )) : <p className="text-sm text-muted-foreground italic">No coaches found for this club.</p>}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />

         <FormField
          control={form.control}
          name="coordinatorIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Assign Coordinators</FormLabel>
                <FormDescription>
                  Select from the approved coordinators for this club.
                </FormDescription>
              </div>
              <div className="space-y-2">
                {coordinators.length > 0 ? coordinators.map((item) => (
                  <FormField
                    key={item.uid}
                    control={form.control}
                    name="coordinatorIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.uid}
                          className="flex flex-row items-center space-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.uid)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.uid])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.uid
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">
                            {item.displayName} <span className="text-muted-foreground">({item.email})</span>
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                )) : <p className="text-sm text-muted-foreground italic">No coordinators found for this club.</p>}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {form.formState.isSubmitting ? (team ? "Saving..." : "Creating...") : (team ? "Save Changes" : "Create Team")}
        </Button>
      </form>
    </Form>
  );
}
