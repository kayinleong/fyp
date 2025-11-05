import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check } from "lucide-react";
import { validateSession } from "@/lib/actions/auth.action";
import { getProfileById } from "@/lib/actions/profile.action";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from "@/lib/domains/subscription.domain";
import { redirect } from "next/navigation";
import UpgradeSubscriptionButton from "@/components/subscription/upgrade-subscription-button";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Check if user is authenticated
  const sessionResponse = await validateSession();
  const userId = sessionResponse.user?.uid;

  if (!userId) {
    redirect("/login?redirect=/subscription");
  }

  // Get user's profile to check current subscription
  const { profile } = await getProfileById(userId);
  const currentPlan = profile?.subscription_plan || "FREE";

  const resolvedSearchParams = await searchParams;
  const showPremiumRequired = resolvedSearchParams.error === "premium-required";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="w-full">
        <div className="text-center mb-12">
          {showPremiumRequired && (
            <Alert className="mb-6 bg-yellow-50 border-yellow-200">
              <AlertDescription className="text-yellow-800">
                This feature requires a Premium subscription. Please upgrade
                your plan to access AI tools.
              </AlertDescription>
            </Alert>
          )}
          <h1 className="text-4xl font-bold mb-3">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get access to powerful AI tools to enhance your job search
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mx-auto max-w-4xl">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
            <Card
              key={plan.plan}
              className={`${
                plan.plan === currentPlan
                  ? "border-primary shadow-lg"
                  : "hover:border-primary/50 transition-all"
              } w-full`}
            >
              <CardHeader className="text-center">
                <CardTitle className="flex flex-col items-center gap-2">
                  {plan.name}
                  {plan.price > 0 && (
                    <div className="text-2xl font-bold">
                      ${plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /month
                      </span>
                    </div>
                  )}
                </CardTitle>
                <CardDescription className="text-center">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 justify-center"
                    >
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-center">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-center">
                  {plan.plan === currentPlan ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.plan === SubscriptionPlan.PREMIUM ? (
                    <UpgradeSubscriptionButton userId={userId} />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {currentPlan === SubscriptionPlan.FREE && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-2">
              Want to access advanced AI features?
            </p>
            <p className="text-sm text-muted-foreground">
              Upgrade to Premium to unlock AI Mock Interviews, Resume Analysis,
              and more!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
