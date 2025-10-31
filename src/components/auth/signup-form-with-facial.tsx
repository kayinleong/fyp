"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signUpWithEmailAndPassword } from "@/lib/firebase/client";
import { createSessionCookie } from "@/lib/actions/auth.action";
import { createProfile } from "@/lib/actions/profile.action";
import { storeFacialData } from "@/lib/actions/facial.action";
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
import { Icons } from "@/components/icons";
import { toast } from "sonner";
import { Profile } from "@/lib/domains/profile.domain";
import FacialRecognition from "./facial-recognition";
import { useAuth } from "@/lib/contexts/auth-context";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  role: z.enum(["GUEST", "COMPANY"], {
    required_error: "Please select an account type.",
  }),
});

type SignupStep = "form" | "facial" | "complete";

export default function SignupFormWithFacial() {
  const router = useRouter();
  const { refreshFacialStatus } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<SignupStep>("form");
  const [userData, setUserData] = useState<{
    userId: string;
    name: string;
    email: string;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "GUEST",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // Sign up with Firebase Authentication
      const userCredential = await signUpWithEmailAndPassword(
        values.email,
        values.password
      );

      // Get the ID token and user ID
      const idToken = await userCredential.user.getIdToken();
      const userId = userCredential.user.uid;

      // Create a user profile in Firestore
      const profileResult = await createProfile({
        user_id: userId,
        name: values.name,
        gender: 0, // Default value, can be updated later
        university: "", // Default value, can be updated later
        role: values.role, // Set the user role
      } as Profile);

      if (!profileResult.success) {
        console.error("Profile creation error:", profileResult.error);
        // Continue anyway, as the authentication was successful
      }

      // Create a session cookie on the server
      const result = await createSessionCookie(idToken);

      if (result.success) {
        // Store user data for the facial recognition step
        setUserData({
          userId,
          name: values.name,
          email: values.email,
        });

        // Move to facial recognition step
        setCurrentStep("facial");
        toast("Account created! Now let's set up facial recognition.");
      } else {
        throw new Error(result.error || "Failed to create session");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast(
        "Registration failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleFacialComplete = async (faceDescriptor: number[] | null) => {
    if (!userData || !faceDescriptor) {
      toast.error("Failed to capture facial data. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await storeFacialData(userData.userId, faceDescriptor);

      if (result.success) {
        // Small delay to ensure database operation completes
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Refresh facial status in AuthContext
        await refreshFacialStatus();

        setCurrentStep("complete");
        toast.success("Facial recognition setup complete!");

        // Redirect after a brief delay with completion flag
        setTimeout(() => {
          router.push("/?facial_completed=true");
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to store facial data");
      }
    } catch (error) {
      console.error("Facial data storage error:", error);
      toast.error("Failed to save facial data. Please try again.");

      // Redirect to setup page to try again
      setTimeout(() => {
        router.push("/setup-facial");
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipFacial = () => {
    toast("Facial recognition setup is required to continue using RabbitJob.");
    // Don't actually skip - redirect to setup page
    router.push("/setup-facial");
  };

  if (currentStep === "facial") {
    return (
      <FacialRecognition
        mode="register"
        onComplete={handleFacialComplete}
        onCancel={handleSkipFacial}
        userName={userData?.name}
      />
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 border border-blue-100 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.checkCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-blue-800">
              Setup Complete!
            </h1>
            <p className="text-gray-600">
              Your account and facial recognition have been configured
              successfully.
            </p>
          </div>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} disabled={isLoading} />
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
                <Input
                  placeholder="john@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  {...field}
                  disabled={isLoading}
                />
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
                <Input
                  placeholder="********"
                  type="password"
                  autoComplete="new-password"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="GUEST">Job Finder/Intern</SelectItem>
                  <SelectItem value="COMPANY">Company/Employer</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose &quot;Job Finder&quot; if you&apos;re looking for
                opportunities, or &quot;Company&quot; if you want to post jobs.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Sign Up
        </Button>
      </form>
    </Form>
  );
}
