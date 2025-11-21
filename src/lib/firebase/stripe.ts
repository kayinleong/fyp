import Stripe from "stripe";

// Lazily initialize the Stripe client to avoid throwing during module import.
// This allows the app to start even when env vars are not set, and only
// throws an informative error when the Stripe client is actually needed.

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is not set.\nSet STRIPE_SECRET_KEY in your environment (e.g. .env.local) before starting the server. See STRIPE_SETUP.md for details."
    );
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      apiVersion: "2025-10-29.clover",
    });
  }

  return stripeInstance;
}

export default getStripe;
