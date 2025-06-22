"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createGameFormat } from "@/app/game-formats/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Format name must be at least 2 characters."),
  description: z.string().optional(),
  numPeriods: z.coerce.number().int().positive().optional(),
  periodDurationMinutes: z.coerce.number().int().positive().optional(),
  defaultTotalTimeouts: z.coerce.number().int().nonnegative().optional(),
  minPeriodsPlayerMustPlay: z.coerce.number().int().nonnegative().optional(),
});

interface GameFormatFormProps {
  onFormSubmit: () => void;
}

export function GameFormatForm({ onFormSubmit }: GameFormatFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a format." });
      return;
    }
    const result = await createGameFormat(values, user.uid);
    if (result.success) {
      toast({ title: "Game Format Created", description: `Format "${values.name}" has been created.` });
      form.reset();
      onFormSubmit();
    } else {
      toast({ variant: "destructive", title: "Creation Failed", description: result.error });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Format Name</FormLabel>
            <FormControl><Input placeholder="e.g., Standard 5v5" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl><Textarea placeholder="Describe the format rules" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="numPeriods" render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Periods</FormLabel>
              <FormControl><Input type="number" placeholder="e.g., 4" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="periodDurationMinutes" render={({ field }) => (
            <FormItem>
              <FormLabel>Period Duration (minutes)</FormLabel>
              <FormControl><Input type="number" placeholder="e.g., 8" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="defaultTotalTimeouts" render={({ field }) => (
                <FormItem>
                <FormLabel>Total Timeouts</FormLabel>
                <FormControl><Input type="number" placeholder="e.g., 4" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="minPeriodsPlayerMustPlay" render={({ field }) => (
                <FormItem>
                <FormLabel>Min. Periods Player Must Play</FormLabel>
                <FormControl><Input type="number" placeholder="e.g., 2" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Format
        </Button>
      </form>
    </Form>
  );
}
