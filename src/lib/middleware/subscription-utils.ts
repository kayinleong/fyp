/* eslint-disable @typescript-eslint/no-explicit-any */

import { validateSession } from "@/lib/actions/auth.action";
import { checkPremiumAccess } from "@/lib/actions/subscription.action";

// For server actions - utility function (not a server action itself)
export function withSubscriptionAction<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      // Check if user is authenticated
      const sessionResponse = await validateSession();
      const userId = sessionResponse.user?.uid;

      if (!userId) {
        throw new Error("Authentication required");
      }

      // Check if user has premium access
      const { hasPremiumAccess, error } = await checkPremiumAccess(userId);

      if (error) {
        throw new Error("Error checking subscription status");
      }

      if (!hasPremiumAccess) {
        throw new Error("Premium subscription required");
      }

      // If all checks pass, execute the handler
      return await handler(...args);
    } catch (error) {
      console.error("Error in subscription middleware:", error);
      throw error;
    }
  };
}
