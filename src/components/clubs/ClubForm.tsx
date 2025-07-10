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
import type { ClubFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createClub } from "@/lib/actions/clubs";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";

const clubFormSchema = z.object({
  name: z.string().min(2, "Club name must be at least 2 characters."),
  shortName: z.string().optional(),
  province_name: z.string().optional(),
  city_name: z.string().optional(),
  logoUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
});

interface ClubFormProps {
  onFormSubmit: () => void;
}

export function ClubForm({ onFormSubmit }: ClubFormProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof clubFormSchema>>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      name: "",
      shortName: "",
      province_name: "",
      city_name: "",
      logoUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof clubFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }

    const result = await createClub(values, user.uid);

    if (result.success) {
      toast({
        title: "Club Created",
        description: `Club "${values.name}" has been created and is pending approval.`,
      });
      form.reset();
      onFormSubmit();
    } else {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: result.error || "An unexpected error occurred.",
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
              <FormLabel>Club Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Real Madrid" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., RMA" {...field} value={field.value ?? ""} />
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
                    <Input type="url" placeholder="https://..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="province_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Province (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Madrid" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Madrid" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {form.formState.isSubmitting ? "Creating..." : "Create Club"}
        </Button>
      </form>
    </Form>
  );
}
