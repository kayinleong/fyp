import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { getProfileById } from "@/lib/actions/profile.action";
import { SubscriptionPlan } from "@/lib/domains/subscription.domain";

export function useSubscription() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSubscription() {
      if (user?.uid) {
        try {
          const { profile } = await getProfileById(user.uid);
          setIsPremium(profile?.subscription_plan === SubscriptionPlan.PREMIUM);
        } catch (error) {
          console.error("Error checking subscription:", error);
          setIsPremium(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsPremium(false);
        setIsLoading(false);
      }
    }

    checkSubscription();
  }, [user]);

  return { isPremium, isLoading };
}