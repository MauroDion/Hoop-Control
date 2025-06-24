"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import type { Player, PlayerFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createPlayer, updatePlayer } from "@/app/players/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import React from 'react';

const playerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  jerseyNumber: z.coerce.number().optional().nullable(),
  position: z.string().optional().nullable(),
});

interface PlayerFormProps {
  teamId: string;
  clubId: string;
  onFormSubmit: () => void;
  player?: Player | null; // For edit mode
}

export function PlayerForm({ teamId, clubId, onFormSubmit, player }: PlayerFormProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof playerFormSchema>>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: player?.firstName || "",
      lastName: player?.lastName || "",
      jerseyNumber: player?.jerseyNumber || undefined,
      position: player?.position || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      firstName: player?.firstName || "",
      lastName: player?.lastName || "",
      jerseyNumber: player?.jerseyNumber || undefined,
      position: player?.position || "",
    });
  }, [player, form]);

  async function onSubmit(values: z.infer<typeof playerFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }

    const result = player
      ? await updatePlayer(player.id, values, clubId, teamId)
      : await createPlayer(values, teamId, clubId, user.uid);

    if (result.success) {
      toast({
        title: player ? "Player Updated" : "Player Added",
        description: `Player "${values.firstName} ${values.lastName}" has been successfully ${player ? 'updated' : 'added'}.`,
      });
      if (!player) form.reset();
      onFormSubmit();
    } else {
      toast({
        variant: "destructive",
        title: player ? "Update Failed" : "Failed to Add Player",
        description: result.error || "An unexpected error occurred.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Lionel" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Messi" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="jerseyNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Jersey Number (Optional)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 10" {...field} onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)} value={field.value ?? ''}/>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Position (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Forward" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {player ? "Save Changes" : "Add Player"}
        </Button>
      </form>
    </Form>
  );
}
