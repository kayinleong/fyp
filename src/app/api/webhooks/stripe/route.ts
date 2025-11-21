/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import getStripe from "@/lib/firebase/stripe";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase/server";

// This should match your Stripe webhook signing secret
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;

  try {
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: `Webhook Error: ${error}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log("Checkout session completed:", session.id);

  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType;

  if (!userId || !planType) {
    console.error("Missing userId or planType in session metadata");
    return;
  }

  try {
    const db = getFirestore();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.collection("users").doc(userId).update({
      subscription_plan: planType,
      subscription_status: "active",
      subscription_start_date: now,
      subscription_end_date: expiresAt,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      updated_at: now,
    });

    await syncProfileSubscription(userId, {
      subscription_plan: planType,
      subscription_id: session.subscription,
    });

    console.log(`Subscription activated for user ${userId}`);
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log("Subscription updated:", subscription.id);

  try {
    const db = getFirestore();
    const metadata = subscription.metadata || {};
    const userId = metadata.userId || subscription.client_reference_id;

    if (!userId) {
      console.warn("Cannot find userId for subscription:", subscription.id);
      return;
    }

    const updateData: any = {
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      updated_at: new Date(),
    };

    // Update end date based on current period end
    if (subscription.current_period_end) {
      updateData.subscription_end_date = new Date(
        subscription.current_period_end * 1000
      );
    }

    await db.collection("users").doc(userId).update(updateData);

    console.log(`Subscription updated for user ${userId}`);
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log("Subscription deleted:", subscription.id);

  try {
    const db = getFirestore();
    const metadata = subscription.metadata || {};
    const userId = metadata.userId || subscription.client_reference_id;

    if (!userId) {
      console.warn("Cannot find userId for subscription:", subscription.id);
      return;
    }

    await db.collection("users").doc(userId).update({
      subscription_plan: "FREE",
      subscription_status: "canceled",
      updated_at: new Date(),
    });

    await syncProfileSubscription(userId, {
      subscription_plan: "FREE",
      subscription_id: null,
    });

    console.log(`Subscription canceled for user ${userId}`);
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log("Invoice payment succeeded:", invoice.id);

  try {
    const db = getFirestore();
    const customerId = invoice.customer;

    // Find user by stripe_customer_id and update their payment status
    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("stripe_customer_id", "==", customerId)
      .get();

    if (snapshot.empty) {
      console.warn("No user found for customer:", customerId);
      return;
    }

    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      last_payment_date: new Date(),
      payment_status: "succeeded",
    });

    console.log(`Payment recorded for user ${userDoc.id}`);
  } catch (error) {
    console.error("Error recording payment:", error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log("Invoice payment failed:", invoice.id);

  try {
    const db = getFirestore();
    const customerId = invoice.customer;

    // Find user by stripe_customer_id and update their payment status
    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("stripe_customer_id", "==", customerId)
      .get();

    if (snapshot.empty) {
      console.warn("No user found for customer:", customerId);
      return;
    }

    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      payment_status: "failed",
      updated_at: new Date(),
    });

    console.log(`Payment failure recorded for user ${userDoc.id}`);
  } catch (error) {
    console.error("Error recording payment failure:", error);
    throw error;
  }
}

async function syncProfileSubscription(
  userId: string,
  data: { subscription_plan: string; subscription_id: string | null }
) {
  try {
    const db = getFirestore();
    const profileRef = db.collection("Profiles").doc(userId);
    const profileSnapshot = await profileRef.get();

    if (!profileSnapshot.exists) {
      return;
    }

    await profileRef.update({
      ...data,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error syncing profile subscription:", error);
  }
}
