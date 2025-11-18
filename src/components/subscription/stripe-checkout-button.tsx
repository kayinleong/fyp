"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/lib/actions/payment.action";
import { toast } from "sonner";
import { SubscriptionPlan } from "@/lib/domains/subscription.domain";

interface StripeCheckoutButtonProps {
  userId: string;
  userEmail: string;
  planType: SubscriptionPlan;
  planName: string;
  disabled?: boolean;
}

export default function StripeCheckoutButton({
  userId,
  userEmail,
  planType,
  planName,
  disabled = false,
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);

      const response = await createCheckoutSession({
        userId,
        planType,
        userEmail,
      });

      if (response.success && response.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = response.checkoutUrl;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      // Friendly handling for missing Stripe configuration
      const msg =
        error instanceof Error ? error.message : "An error occurred during checkout";

      if (msg.includes("STRIPE_SECRET_KEY") || msg.includes("not configured")) {
        toast.error(
          "Payments are not configured on this environment.\nPlease set your Stripe keys (see STRIPE_SETUP.md) or contact the site administrator."
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading || disabled}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Upgrade to ${planName}`
      )}
    </Button>
  );
}
