"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { Icons } from "@/components/icons";

interface FacialProtectionWrapperProps {
  children: React.ReactNode;
}

// Routes that don't require any protection
const UNRESTRICTED_ROUTES = [
  "/login",
  "/signup",
  "/setup-facial",
  "/login-facial",
  "/terms",
  "/privacy",
  "/cookies",
];

export default function FacialProtectionWrapper({
  children,
}: FacialProtectionWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    hasFacialSetup,
    loginScanFace,
    isLoading,
    needsFacialSetup,
    needsLoginScan,
  } = useAuth();
  const hasRedirected = useRef(false);
  const navigationBlocked = useRef(false);

  // Check if user just completed facial recognition
  const justCompletedFacial =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("facial_completed") ===
      "true";

  // Reset redirect flag when pathname changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  // Handle facial completion flag
  useEffect(() => {
    if (justCompletedFacial && user) {
      // Clean up the URL parameter after a delay
      const timer = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("facial_completed");
        window.history.replaceState({}, "", url.toString());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [justCompletedFacial, user]);

  // Block navigation and browser history manipulation for users without facial setup
  useEffect(() => {
    if (isLoading) return;

    const isUnrestricted = UNRESTRICTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    // If user needs facial setup or login scan and not on unrestricted route, block navigation
    if (
      !isUnrestricted &&
      user &&
      (needsFacialSetup || needsLoginScan) &&
      !navigationBlocked.current
    ) {
      navigationBlocked.current = true;

      // Determine redirect target
      const redirectTarget = needsFacialSetup
        ? "/setup-facial"
        : "/login-facial";

      // Prevent back button from working by adding history entries
      const blockNavigation = () => {
        // Push current state to prevent back navigation
        window.history.pushState(null, "", window.location.href);
        // Immediately redirect to appropriate page
        router.replace(redirectTarget);
      };

      // Block popstate (back/forward button)
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        blockNavigation();
      };

      // Block beforeunload (page refresh/close attempts)
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        const message = needsFacialSetup
          ? "Facial recognition setup is required to continue."
          : "Please scan your face to verify your identity.";
        e.returnValue = message;
        return message;
      };

      window.addEventListener("popstate", handlePopState);
      window.addEventListener("beforeunload", handleBeforeUnload);

      // Clean up listeners when facial setup is complete or component unmounts
      return () => {
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        navigationBlocked.current = false;
      };
    } else {
      navigationBlocked.current = false;
    }
  }, [user, needsFacialSetup, needsLoginScan, pathname, isLoading, router]);

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    // Don't redirect if already redirected for this path
    if (hasRedirected.current) return;

    // Allow unrestricted routes
    if (UNRESTRICTED_ROUTES.some((route) => pathname.startsWith(route))) {
      return;
    }

    // Block unauthenticated users
    if (!user) {
      hasRedirected.current = true;
      router.replace("/login");
      return;
    }

    // Block users without facial setup - AGGRESSIVE BLOCKING
    if (needsFacialSetup) {
      hasRedirected.current = true;
      router.replace("/setup-facial");
      return;
    }

    // Block users who need login scan - AGGRESSIVE BLOCKING
    if (needsLoginScan) {
      hasRedirected.current = true;
      router.replace("/login-facial");
      return;
    }
  }, [
    user,
    hasFacialSetup,
    loginScanFace,
    isLoading,
    needsFacialSetup,
    needsLoginScan,
    pathname,
    router,
  ]);

  // IMMEDIATE BLOCKING: Check right after hooks
  const isUnrestrictedRoute = UNRESTRICTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // IMMEDIATE BLOCKING for users who need facial setup (unless they just completed it)
  if (
    !isLoading &&
    user &&
    needsFacialSetup &&
    !isUnrestrictedRoute &&
    !justCompletedFacial
  ) {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/setup-facial");
    }
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg border-2 border-red-300">
          <div className="text-red-600 text-8xl mb-4">🛑</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">
            ACCESS DENIED
          </h1>
          <p className="text-red-600">Facial recognition setup required</p>
          <p className="text-sm text-red-500 mt-2">Redirecting to setup...</p>
        </div>
      </div>
    );
  }

  // IMMEDIATE BLOCKING for users who need login facial scan
  if (!isLoading && user && needsLoginScan && !isUnrestrictedRoute) {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/login-facial");
    }
    return (
      <div className="min-h-screen bg-orange-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg border-2 border-orange-300">
          <div className="text-orange-600 text-8xl mb-4">�</div>
          <h1 className="text-2xl font-bold text-orange-800 mb-2">
            FACIAL VERIFICATION REQUIRED
          </h1>
          <p className="text-orange-600">Please scan your face to continue</p>
          <p className="text-sm text-orange-500 mt-2">
            Redirecting to face scan...
          </p>
        </div>
      </div>
    );
  }

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Icons.spinner className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Final check - render content if authenticated and no blocking needed
  return <>{children}</>;
}
