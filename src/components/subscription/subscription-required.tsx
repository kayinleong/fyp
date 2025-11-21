import { redirect } from "next/navigation";
import { validateSession } from "@/lib/actions/auth.action";
import { checkPremiumAccess } from "@/lib/actions/subscription.action";

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

  const { hasPremiumAccess } = await checkPremiumAccess(userId);

  if (!hasPremiumAccess) {
    redirect("/subscription?error=premium-required");
  }

  return <>{children}</>;
}