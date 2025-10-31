"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/firebase/client";
import { storeFacialData, hasFacialData } from "@/lib/actions/facial.action";
import FacialRecognition from "@/components/auth/facial-recognition";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { User } from "firebase/auth";
import { useAuth } from "@/lib/contexts/auth-context";

export default function SetupFacialPage() {
  const router = useRouter();
  const { refreshFacialStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const user = getCurrentUser();

      if (!user) {
        // Not authenticated, redirect to login
        router.push("/login");
        return;
      }

      // Check if user already has facial data
      const facialCheck = await hasFacialData(user.uid);
      if (facialCheck.success && facialCheck.data) {
        // User already has facial recognition set up, redirect to home
        router.push("/");
        return;
      }

      setCurrentUser(user);
      setIsLoading(false);
    };

    checkUser();
  }, [router]);

  // Block navigation away from this page until facial setup is complete
  useEffect(() => {
    if (!currentUser || isCompleting) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You must complete facial recognition setup to continue.";
      return "You must complete facial recognition setup to continue.";
    };

    const handlePopState = () => {
      // If user tries to go back, redirect them back to setup-facial
      router.replace("/setup-facial");
    };

    // Add history entry to prevent back navigation
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentUser, isCompleting, router]);

  const handleFacialComplete = async (faceDescriptor: number[] | null) => {
    if (!currentUser || !faceDescriptor) {
      toast.error("Failed to capture facial data. Please try again.");
      return;
    }

    setIsCompleting(true);
    try {
      const result = await storeFacialData(currentUser.uid, faceDescriptor);

      if (result.success) {
        // Refresh facial status in AuthContext immediately
        await refreshFacialStatus();

        toast.success(
          "Facial recognition setup complete! Welcome to RabbitJob."
        );

        // Redirect to home page after setup
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to store facial data");
      }
    } catch (error) {
      console.error("Facial data storage error:", error);
      toast.error("Failed to save facial data. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = () => {
    // For now, we don't allow skipping - users must complete facial recognition
    toast.error(
      "Facial recognition setup is required to continue using RabbitJob."
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 border border-blue-100 text-center">
          <Icons.spinner className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 border border-blue-100 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.spinner className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-blue-800">
              Setting Up Security
            </h1>
            <p className="text-gray-600">
              Configuring your facial recognition settings...
            </p>
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
            Security Setup Required
          </h1>
          <p className="text-gray-600">
            To ensure the security of your account and comply with our security
            policies, please complete facial recognition setup.
          </p>
        </div>
      </div>

      <FacialRecognition
        mode="register"
        onComplete={handleFacialComplete}
        onCancel={handleSkip} // Will show error message instead of skipping
        userName={currentUser?.displayName || currentUser?.email || "User"}
        fullPage={true}
      />

      <div className="absolute bottom-0 left-0 w-full p-4 text-center bg-blue-50/90">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-gray-500">
            This is a one-time setup to enhance your account security. Your
            facial data is encrypted and stored securely.
          </p>
        </div>
      </div>
    </>
  );
}
