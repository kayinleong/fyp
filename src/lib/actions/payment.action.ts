"use server";

import getStripe from "@/lib/firebase/stripe";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase/server";
import { SubscriptionPlan } from "@/lib/domains/subscription.domain";
import { headers } from "next/headers";

function getDb() {
  return getFirestore();
}

interface CreateCheckoutSessionParams {
  userId: string;
  planType: SubscriptionPlan;
  userEmail: string;
}

// Stripe product and price IDs - Configure these in your Stripe dashboard
const STRIPE_PRICES: Record<string, string> = {
  [SubscriptionPlan.PREMIUM]: process.env.STRIPE_PREMIUM_PRICE_ID || "price_1234567890",
};

export async function createCheckoutSession({
  userId,
  planType,
  userEmail,
}: CreateCheckoutSessionParams) {
  try {
    if (!STRIPE_PRICES[planType]) {
      throw new Error(`No Stripe price configured for plan: ${planType}`);
    }

    const headersList = await headers();
    const origin = headersList.get("referer") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const baseUrl = new URL(origin).origin;

  // Create Stripe checkout session
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price: STRIPE_PRICES[planType],
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
      metadata: {
        userId,
        planType,
      },
    });

    return {
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create checkout session"
    );
  }
}

export async function handleCheckoutSessionCompleted(
  sessionId: string,
  userId: string,
  planType: string
) {
  try {
  // Get the checkout session details
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Update user subscription in Firestore
    const db = getDb();
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await userDocRef.update({
      subscription_plan: planType,
      subscription_status: "active",
      subscription_start_date: now,
      subscription_end_date: expiresAt,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      updated_at: now,
    });

    // Keep the user's profile document in sync if it exists
    const profileRef = db.collection("Profiles").doc(userId);
    const profileSnapshot = await profileRef.get();

    if (profileSnapshot.exists) {
      await profileRef.update({
        subscription_plan: planType,
        subscription_id: session.subscription,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error handling checkout session:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to process payment"
    );
  }
}

export async function verifyCheckoutSession(sessionId: string) {
  try {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      success: true,
      paymentStatus: session.payment_status,
      customerId: session.customer,
      subscriptionId: session.subscription,
      metadata: session.metadata,
    };
  } catch (error) {
    console.error("Error verifying checkout session:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to verify session"
    );
  }
}
