
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createClub } from "@/app/clubs/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const clubFormSchema = z.object({
  name: z.string().min(3, "Club name must be at least 3 characters."),
  shortName: z.string().optional(),
  province_name: z.string().optional(),
  city_name: z.string().optional(),
  logoUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
});

export function ClubForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

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
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }

    const clubData: ClubFormData = values;
    const result = await createClub(clubData, user.uid);

    if (result.success) {
      toast({
        title: "Club Created",
        description: `Club "${values.name}" has been successfully created.`,
      });
      router.push("/clubs");
      router.refresh();
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
              <FormLabel>Official Club Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Real Madrid Club de Fútbol" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shortName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Real Madrid" {...field} />
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
                <Input placeholder="e.g., Madrid" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="province_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province/State (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Community of Madrid" {...field} />
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
                <Input type="url" placeholder="https://example.com/logo.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Club...
            </>
          ) : (
            "Create Club"
          )}
        </Button>
      </form>
    </Form>
  );
}
