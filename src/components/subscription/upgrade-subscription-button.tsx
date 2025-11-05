"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createSubscription } from "@/lib/actions/subscription.action";
import { BaseSubscription, SubscriptionPlan, SubscriptionStatus } from "@/lib/domains/subscription.domain";

interface UpgradeSubscriptionButtonProps {
  userId: string;
}

export default function UpgradeSubscriptionButton({ userId }: UpgradeSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // In a real application, this is where you would integrate with a payment provider
      // For now, we'll just create a subscription directly
      
      const subscriptionData: BaseSubscription = {
        user_id: userId,
        plan_type: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        starts_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };

      const result = await createSubscription(subscriptionData);

      if (!result.success) {
        throw new Error(result.error || "Failed to upgrade subscription");
      }

      toast.success("Successfully upgraded to Premium!");
      setShowDialog(false);
      // Refresh the page to update UI
      window.location.reload();
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      toast.error("Failed to upgrade subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="w-full"
        onClick={() => setShowDialog(true)}
        disabled={isLoading}
      >
        Upgrade to Premium
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogDescription>
              You&apos;re about to upgrade to our Premium plan with access to all AI
              features. Would you like to continue?
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <p className="text-muted-foreground text-sm">
              Premium features include:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>AI Mock Interviews</li>
              <li>AI Resume Analysis</li>
              <li>Smart Job Recommendations</li>
              <li>Advanced Job Search Filters</li>
            </ul>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpgrade} disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm Upgrade"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}