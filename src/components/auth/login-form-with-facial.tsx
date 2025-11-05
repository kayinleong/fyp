"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { loginWithEmailAndPassword, logoutUser } from "@/lib/firebase/client";
import { createSessionCookie } from "@/lib/actions/auth.action";
import { getFacialData, hasFacialData } from "@/lib/actions/facial.action";
import { toast } from "sonner";
import FacialRecognition from "./facial-recognition";
import { getProfileById } from "@/lib/actions/profile.action";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type LoginStep = "credentials" | "facial" | "complete";

export default function LoginFormWithFacial() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<LoginStep>("credentials");
  const [userData, setUserData] = useState<{
    userId: string;
    name: string;
    email: string;
    faceDescriptor: number[] | null;
  } | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // Sign in with Firebase Authentication
      const userCredential = await loginWithEmailAndPassword(
        values.email,
        values.password
      );

      const userId = userCredential.user.uid;

      // Check if user has facial recognition set up
      const facialDataExists = await hasFacialData(userId);

      if (!facialDataExists.success) {
        throw new Error(
          facialDataExists.error || "Failed to check facial data"
        );
      }

      if (facialDataExists.data) {
        // Store ID token for later use after facial verification
        const idToken = await userCredential.user.getIdToken();
        (window as { lastIdToken?: string }).lastIdToken = idToken;

        // User has facial recognition - proceed to facial verification
        const [facialDataResult, profileResult] = await Promise.all([
          getFacialData(userId),
          getProfileById(userId),
        ]);

        if (!facialDataResult.success || !facialDataResult.data) {
          throw new Error("Failed to retrieve facial data for verification");
        }

        const userName = profileResult.profile
          ? profileResult.profile.name
          : values.email;

        setUserData({
          userId,
          name: userName,
          email: values.email,
          faceDescriptor: facialDataResult.data,
        });

        setCurrentStep("facial");
        toast("Please verify your identity with facial recognition");
      } else {
        // No facial recognition set up - redirect to setup page
        const idToken = await userCredential.user.getIdToken();
        const sessionResult = await createSessionCookie(idToken);

        if (sessionResult.success) {
          toast("Facial recognition setup is required. Redirecting...");
          router.push("/setup-facial");
        } else {
          throw new Error(sessionResult.error || "Failed to create session");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      handleLoginError(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleFacialVerification = async (
    faceDescriptor: number[] | null,
    success?: boolean
  ) => {
    if (!userData) {
      toast.error("Login session expired. Please try again.");
      setCurrentStep("credentials");
      return;
    }

    if (success === true) {
      // Facial verification successful
      setCurrentStep("complete");
      toast.success("Facial verification successful!");

      // Complete the login process
      setTimeout(async () => {
        try {
          // Since we already have the authenticated user, we just need to create session
          const idToken = (window as { lastIdToken?: string }).lastIdToken;
          if (!idToken) {
            throw new Error("Session expired");
          }
          const result = await createSessionCookie(idToken);

          if (result.success) {
            router.push("/");
            router.refresh();
          } else {
            throw new Error(result.error || "Failed to create session");
          }
        } catch (error) {
          console.error("Session creation error:", error);
          toast.error(
            "Login completed but session creation failed. Please try logging in again."
          );
          await logoutUser();
          setCurrentStep("credentials");
        }
      }, 1500);
    } else if (success === false) {
      // Facial verification failed
      toast.error("Facial verification failed. Logging out for security.");

      // Log out the user
      await logoutUser();
      setCurrentStep("credentials");

      // Reset form
      form.reset();
    }
  };

  const handleLoginError = (error: unknown) => {
    let errorMessage = "Failed to sign in";
    if (error instanceof Error) {
      // Extract specific Firebase auth errors
      if (
        error.message.includes("auth/user-not-found") ||
        error.message.includes("auth/wrong-password") ||
        error.message.includes("auth/invalid-credential")
      ) {
        errorMessage = "Invalid email or password";
      } else if (error.message.includes("auth/too-many-requests")) {
        errorMessage =
          "Too many failed login attempts. Please try again later.";
      } else {
        errorMessage = error.message;
      }
    }
    toast.error(errorMessage);
  };

  if (currentStep === "facial" && userData) {
    return (
      <FacialRecognition
        mode="verify"
        onComplete={handleFacialVerification}
        existingFaceDescriptor={userData.faceDescriptor || undefined}
        userName={userData.name}
      />
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 border border-blue-100 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-blue-800">
              Welcome Back!
            </h1>
            <p className="text-gray-600">
              Verification successful. Signing you in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
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
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Form>
  );
}
