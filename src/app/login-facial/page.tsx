"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { getFacialData } from "@/lib/actions/facial.action";
import FacialRecognition from "@/components/auth/facial-recognition";
import { toast } from "sonner";
import { Icons } from "@/components/icons";

export default function LoginFacialPage() {
  const router = useRouter();
  const { user, hasFacialSetup, setLoginScanFace } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [existingFaceDescriptor, setExistingFaceDescriptor] = useState<
    number[] | null
  >(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  useEffect(() => {
    const checkUserAndLoadFacialData = async () => {
      if (!user) {
        // Not authenticated, redirect to login
        router.push("/login");
        return;
      }

      if (hasFacialSetup !== true) {
        // User doesn't have facial setup, redirect to setup
        router.push("/setup-facial");
        return;
      }

      // Load existing facial data for verification
      try {
        const result = await getFacialData(user.uid);
        if (result.success && result.data) {
          // Data is now a number[] from getFacialData (DeepFace format)
          setExistingFaceDescriptor(result.data);
        } else {
          throw new Error("No facial data found");
        }
      } catch (error) {
        console.error("Error loading facial data:", error);
        toast.error("Error loading facial data. Please try again.");
        router.push("/setup-facial");
        return;
      }

      setIsLoading(false);
    };

    checkUserAndLoadFacialData();
  }, [user, hasFacialSetup, router]);

  const handleFacialVerification = (
    faceDescriptor: number[] | null,
    success?: boolean
  ) => {
    setIsVerifying(false);
    setVerificationAttempts((prev) => prev + 1);

    if (success) {
      // Mark user as having completed login facial scan
      setLoginScanFace(true);

      toast.success("Facial verification successful! Welcome back.");

      // Redirect to home page after successful verification
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } else {
      const attemptText =
        verificationAttempts >= 2
          ? ` (Attempt ${verificationAttempts + 1})`
          : "";
      toast.error(
        `Facial verification failed${attemptText}. Your face doesn't match the registered profile. Please ensure good lighting and try again.`
      );

      // After 3 failed attempts, offer alternative
      if (verificationAttempts >= 2) {
        setTimeout(() => {
          toast.info(
            "Having trouble? You can go back to regular login instead."
          );
        }, 2000);
      }
    }
  };

  const handleCancel = () => {
    // User cancelled verification, redirect to login
    router.push("/login");
  };

  // Block navigation away from this page until verification is complete
  useEffect(() => {
    if (!user || isVerifying) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Please complete facial verification to continue.";
      return "Please complete facial verification to continue.";
    };

    const handlePopState = () => {
      // If user tries to go back, redirect them back to login-facial
      router.replace("/login-facial");
    };

    // Add history entry to prevent back navigation
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [user, isVerifying, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 border border-blue-100 text-center">
          <Icons.spinner className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading facial verification...</p>
        </div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 border border-blue-100 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.spinner className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-blue-800">
              Verifying Your Identity
            </h1>
            <p className="text-gray-600">Processing facial verification...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-4 text-center bg-blue-50/90">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-600">
            Please scan your face to verify your identity and complete the login
            process.
          </p>
        </div>
      </div>

      <FacialRecognition
        mode="verify"
        onComplete={handleFacialVerification}
        onCancel={handleCancel}
        existingFaceDescriptor={existingFaceDescriptor || undefined}
        userName={user?.displayName || user?.email || "User"}
        fullPage={true}
      />

      <div className="absolute bottom-0 left-0 w-full p-4 text-center bg-blue-50/90">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-gray-500">
            This verification is required each time you log in to ensure account
            security.
          </p>
        </div>
      </div>
    </>
  );
}
