"use server";

import getStripe from "@/lib/firebase/stripe";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase/server";
import { SubscriptionPlan } from "@/lib/domains/subscription.domain";
import { headers } from "next/headers";
import { validateSession } from "@/lib/actions/auth.action";
import { checkPremiumAccess } from "@/lib/actions/subscription.action";

function getDb() {
  return getFirestore();
}

interface CreateCheckoutSessionParams {
  userId: string;
  planType: SubscriptionPlan;
  userEmail: string;
}

// Stripe product and price IDs - Configure these in your Stripe dashboard
export async function createCheckoutSession({
  userId,
  planType,
  userEmail,
}: CreateCheckoutSessionParams) {
  try {
    // STRIPE_PRICES check removed as we use inline pricing

    const headersList = await headers();
    const origin =
      headersList.get("referer") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const baseUrl = new URL(origin).origin;

    // Create Stripe checkout session
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "myr",
            product_data: {
              name: "Premium Plan",
              description: "Full access to all features including AI tools",
            },
            unit_amount: 1999, // RM19.99
            recurring: {
              interval: "month",
            },
          },
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
      error instanceof Error
        ? error.message
        : "Failed to create checkout session"
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

    // Verify user exists in Firebase Auth and get details
    const userRecord = await admin.auth().getUser(userId);
    const userEmail = userRecord.email || null;
    const userDisplayName = userRecord.displayName || null;

    // Update user subscription in Firestore
    const db = getDb();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Update or create document in Subscriptions collection using userId as doc ID
    const subscriptionRef = db.collection("Subscriptions").doc(userId);

    const subscriptionData = {
      user_id: userId,
      email: userEmail,
      displayName: userDisplayName,
      plan_type: planType,
      status: "ACTIVE",
      starts_at: now,
      expires_at: expiresAt,
      stripe_subscription_id: session.subscription,
      stripe_customer_id: session.customer,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Check if subscription exists to determine if we need to set created_at
    const subSnap = await subscriptionRef.get();

    if (!subSnap.exists) {
      await subscriptionRef.set({
        ...subscriptionData,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await subscriptionRef.update(subscriptionData);
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

export async function checkPaymentAndActivate(sessionId: string) {
  try {
    const sessionResponse = await validateSession();
    const userId = sessionResponse.user?.uid;

    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    // 1. Verify the session with Stripe
    const sessionData = await verifyCheckoutSession(sessionId);

    if (sessionData.paymentStatus !== "paid") {
      return { success: false, error: "Payment not completed yet" };
    }

    // 2. Trigger the completion handler (idempotent-ish)
    // We call this to ensure the subscription is created/updated if the webhook hasn't fired yet
    const planType = sessionData.metadata?.planType || SubscriptionPlan.PREMIUM;

    await handleCheckoutSessionCompleted(sessionId, userId, planType);

    // 3. Check if the user now has premium access
    const { hasPremiumAccess } = await checkPremiumAccess(userId);

    return {
      success: true,
      isPremium: hasPremiumAccess,
    };
  } catch (error) {
    console.error("Error checking payment and activating:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check payment",
    };
  }
}
