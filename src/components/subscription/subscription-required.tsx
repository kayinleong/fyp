import { redirect } from "next/navigation";
import { validateSession } from "@/lib/actions/auth.action";
import { getProfileById } from "@/lib/actions/profile.action";
import { SubscriptionPlan } from "@/lib/domains/subscription.domain";

export default async function SubscriptionRequired({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const sessionResponse = await validateSession();
  const userId = sessionResponse.user?.uid;

  if (!userId) {
    redirect("/login?redirect=/subscription");
  }

  // Get user's profile to check subscription
  const { profile } = await getProfileById(userId);
  const currentPlan = profile?.subscription_plan || "FREE";

  if (currentPlan !== SubscriptionPlan.PREMIUM) {
    redirect("/subscription?error=premium-required");
  }

  return <>{children}</>;
}