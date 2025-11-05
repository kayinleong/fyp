"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { getCurrentUser, subscribeToAuthChanges } from "@/lib/firebase/client";
import { hasFacialData } from "@/lib/actions/facial.action";

interface UseFacialSetupResult {
  user: User | null;
  hasFacialSetup: boolean | null;
  isLoading: boolean;
  needsFacialSetup: boolean;
}

export function useFacialSetup(): UseFacialSetupResult {
  const [user, setUser] = useState<User | null>(null);
  const [hasFacialSetup, setHasFacialSetup] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const facialCheck = await hasFacialData(currentUser.uid);
          const hasSetup = facialCheck.success
            ? facialCheck.data || false
            : false;
          setHasFacialSetup(hasSetup);
        } catch (error) {
          console.error("Error checking facial setup:", error);
          setHasFacialSetup(false);
        }
      } else {
        setHasFacialSetup(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const needsFacialSetup = user !== null && hasFacialSetup === false;

  return {
    user,
    hasFacialSetup,
    isLoading,
    needsFacialSetup,
  };
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isLoading };
}
