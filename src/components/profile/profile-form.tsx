"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfileById, updateProfile } from "@/lib/actions/profile.action";
import { Profile } from "@/lib/domains/profile.domain";
import { Icons } from "@/components/icons";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  gender: z.coerce.number().min(0).max(2),
  university: z.string().optional(),
  role: z.enum(["GUEST", "COMPANY"]).optional(),
});

interface ProfileFormProps {
  userId: string;
  isAdmin?: boolean;
}

export default function ProfileForm({
  userId,
  isAdmin = false,
}: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      gender: 0,
      university: "",
      role: "GUEST",
    },
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { profile: userProfile } = await getProfileById(userId);
        if (userProfile) {
          setProfile(userProfile);
          // Update form with profile values
          form.reset({
            name: userProfile.name,
            gender: userProfile.gender,
            university: userProfile.university || "",
            role: userProfile.role || "GUEST",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast("Error loading profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      const result = await updateProfile(userId, {
        name: values.name,
        gender: values.gender,
        university: values.university || "",
        role: values.role,
        user_id: userId, // This won't be updated due to the logic in updateProfile
      });

      if (result.success) {
        toast("Profile updated successfully");
        // Update local state
        setProfile({
          ...profile!,
          name: values.name,
          gender: values.gender,
          university: values.university || "",
          role: values.role,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast(
        "Failed to update profile: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Icons.spinner className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the name that will be displayed on your profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Prefer not to say</SelectItem>
                      <SelectItem value="1">Male</SelectItem>
                      <SelectItem value="2">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>University</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Your university or educational institution.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Only show role selector for admins */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GUEST">Job Seeker</SelectItem>
                        <SelectItem value="COMPANY">Company</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This determines what features are available to this
                      account.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
