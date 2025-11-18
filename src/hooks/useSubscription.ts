"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/auth-context";

export function useSubscription() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchSubscriptionStatus() {
      if (!user?.uid) {
        if (isMounted) {
          setIsPremium(false);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/subscription/status", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setIsPremium(Boolean(data.isPremium));
        } else if (response.status === 401 || response.status === 403) {
          setIsPremium(false);
        } else {
          console.error("Failed to fetch subscription status:", response.status);
          setIsPremium(false);
        }
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        if (isMounted) {
          setIsPremium(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchSubscriptionStatus();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  return { isPremium, isLoading };
}