/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkPaymentAndActivate } from "@/lib/actions/payment.action";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PaymentSuccessPollerProps {
  sessionId: string;
}

export default function PaymentSuccessPoller({
  sessionId,
}: PaymentSuccessPollerProps) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: any = 0;

    const checkStatus = async () => {
      try {
        const result = await checkPaymentAndActivate(sessionId);

        if (result.success && result.isPremium) {
          // Payment confirmed and premium active
          setIsVerifying(false);
          clearInterval(intervalId);
          // Redirect to subscription page without query params to show updated state
          router.replace("/subscription");
          router.refresh();
        } else if (result.error) {
          // Stop polling on error
          setIsVerifying(false);
          setError(result.error);
          clearInterval(intervalId);
        }
        // If success but not premium yet (e.g. webhook delay), keep polling
      } catch (err) {
        console.error("Polling error:", err);
        // Don't stop polling on transient network errors, but maybe log it
      }
    };

    // Initial check
    checkStatus();

    // Poll every 2 seconds
    intervalId = setInterval(checkStatus, 2000);

    return () => clearInterval(intervalId);
  }, [sessionId, router]);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Verification Failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isVerifying) {
    return (
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertTitle className="ml-2 text-blue-800">
          Verifying Payment
        </AlertTitle>
        <AlertDescription className="ml-2 text-blue-700">
          Please wait while we confirm your subscription...
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
