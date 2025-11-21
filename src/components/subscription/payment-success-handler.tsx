"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { handleCheckoutSessionCompleted } from "@/lib/actions/payment.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessHandler() {
  const searchParams = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function handleSuccess() {
      const sessionId = searchParams.get("session_id");
      const success = searchParams.get("success");
      const canceled = searchParams.get("canceled");

      if (canceled) {
        setStatus("error");
        setMessage("Payment was canceled. Please try again.");
        return;
      }

      if (!success || !sessionId) {
        setStatus("error");
        setMessage("Invalid session. Please contact support.");
        return;
      }

      if (!user?.uid) {
        setStatus("error");
        setMessage("User not authenticated. Please log in again.");
        return;
      }

      try {
        // Process the payment in the backend
        await handleCheckoutSessionCompleted(sessionId, user.uid, "PREMIUM");
        await refreshProfile();
        setStatus("success");
        setMessage("Your subscription has been activated successfully!");
      } catch (error) {
        console.error("Error processing payment:", error);
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "An error occurred processing your payment."
        );
      }
    }

    handleSuccess();
  }, [refreshProfile, searchParams, user]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
              <CardTitle>Processing Payment</CardTitle>
              <CardDescription>
                Please wait while we process your subscription...
              </CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Payment Successful!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Payment Failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {status === "success" && (
              <>
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    You now have access to all Premium features including:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-green-700">
                    <li>• AI Mock Interviews</li>
                    <li>• AI Resume Analysis</li>
                    <li>• Smart Job Recommendations</li>
                    <li>• Advanced Filters</li>
                  </ul>
                </div>
                <Link href="/ai-toolkit">
                  <Button className="w-full" size="lg">
                    Go to AI Toolkit
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full" size="lg">
                    Go to Profile
                  </Button>
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <Link href="/subscription">
                  <Button className="w-full" size="lg">
                    Back to Subscription
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">
                  If the problem persists, please contact support
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
