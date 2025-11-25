"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/lib/actions/payment.action";
import { toast } from "sonner";
import { SubscriptionPlan } from "@/lib/domains/subscription.domain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FacialRecognition from "@/components/auth/facial-recognition";
import { getFacialData } from "@/lib/actions/facial.action";

interface StripeCheckoutButtonProps {
  userId: string;
  userEmail: string;
  planType: SubscriptionPlan;
  planName: string;
  disabled?: boolean;
  requireFacialVerification?: boolean;
}

export default function StripeCheckoutButton({
  userId,
  userEmail,
  planType,
  planName,
  disabled = false,
  requireFacialVerification = false,
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isFetchingDescriptor, setIsFetchingDescriptor] = useState(false);
  const [existingFaceDescriptor, setExistingFaceDescriptor] = useState<
    number[] | null
  >(null);
  const [facialVerified, setFacialVerified] = useState(false);

  useEffect(() => {
    if (!requireFacialVerification || !userId) return;

    let cancelled = false;
    const loadDescriptor = async () => {
      setIsFetchingDescriptor(true);
      try {
        const result = await getFacialData(userId);
        if (cancelled) return;

        if (result.success && result.data) {
          setExistingFaceDescriptor(result.data);
        } else {
          setExistingFaceDescriptor(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load facial data", error);
          toast.error("Unable to load your facial profile. Please try again.");
          setExistingFaceDescriptor(null);
        }
      } finally {
        if (!cancelled) {
          setIsFetchingDescriptor(false);
        }
      }
    };

    loadDescriptor();

    return () => {
      cancelled = true;
    };
  }, [requireFacialVerification, userId]);

  const runCheckout = async () => {
    try {
      setIsLoading(true);

      const response = await createCheckoutSession({
        userId,
        planType,
        userEmail,
      });

      if (response.success && response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else if (!response.success) {
        toast.error(response.error || "Unable to continue to payment.");
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "An error occurred during checkout";

      if (msg.includes("STRIPE_SECRET_KEY") || msg.includes("not configured")) {
        toast.error(
          "Payments are not configured on this environment.\nPlease set your Stripe keys (see STRIPE_SETUP.md) or contact the site administrator."
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
      setFacialVerified(false);
    }
  };

  const handleCheckout = async () => {
    if (requireFacialVerification) {
      if (isFetchingDescriptor) {
        toast.info("Preparing security check. Please wait a moment.");
        return;
      }

      if (!existingFaceDescriptor) {
        toast.error(
          "We could not find your facial profile. Please complete setup first."
        );
        window.location.href = "/setup-facial";
        return;
      }

      if (!facialVerified) {
        setScannerOpen(true);
        return;
      }
    }

    await runCheckout();
  };

  const handleVerificationComplete = (
    _descriptor: number[] | null,
    success?: boolean
  ) => {
    if (!success) {
      toast.error("Facial verification failed. Please try again.");
      return;
    }

    setScannerOpen(false);
    setFacialVerified(true);
    toast.success("Identity verified. Redirecting to payment...");
    runCheckout();
  };

  const handleCancelScan = () => {
    setScannerOpen(false);
  };

  return (
    <>
      <Button
        onClick={handleCheckout}
        disabled={
          isLoading ||
          disabled ||
          (requireFacialVerification && isFetchingDescriptor)
        }
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

      {requireFacialVerification && existingFaceDescriptor && (
        <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Verify your identity</DialogTitle>
              <DialogDescription>
                Please complete a quick facial scan before continuing to secure
                payment.
              </DialogDescription>
            </DialogHeader>

            <FacialRecognition
              mode="verify"
              existingFaceDescriptor={existingFaceDescriptor}
              onComplete={handleVerificationComplete}
              onCancel={handleCancelScan}
              userName={planName}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
