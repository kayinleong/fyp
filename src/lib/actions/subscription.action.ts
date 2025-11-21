"use server"

import { getFirestore } from "firebase-admin/firestore";
import { Subscription, BaseSubscription, SubscriptionPlan, SubscriptionStatus } from "@/lib/domains/subscription.domain";
import admin from "@/lib/firebase/server";
import { convertTimestamps } from "../timestamp";

function getDb() {
    return getFirestore();
}

interface SubscriptionResponse {
    success: boolean;
    error?: string;
    subscriptionId?: string;
}

/**
 * Create a new subscription
 */
export async function createSubscription(subscription: BaseSubscription): Promise<SubscriptionResponse> {
    try {
        const db = getDb();
        const subscriptionsCollection = 'Subscriptions';

        // Create a new document with auto-generated ID
        const subscriptionRef = db.collection(subscriptionsCollection).doc();

        // Add timestamps
        const subscriptionWithMetadata = {
            ...subscription,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Create the subscription document
        await subscriptionRef.set(subscriptionWithMetadata);

        return {
            success: true,
            subscriptionId: subscriptionRef.id
        };
    } catch (error) {
        console.error("Error creating subscription:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Get a subscription by ID
 */
export async function getSubscriptionById(subscriptionId: string): Promise<{ subscription: Subscription | null; error?: string }> {
    try {
        const db = getDb();
        const subscriptionsCollection = 'Subscriptions';

        const subscriptionRef = db.collection(subscriptionsCollection).doc(subscriptionId);
        const subscriptionSnapshot = await subscriptionRef.get();

        if (!subscriptionSnapshot.exists) {
            return { subscription: null, error: "Subscription not found" };
        }

        const subscriptionData = subscriptionSnapshot.data();
        return {
            subscription: {
                id: subscriptionSnapshot.id,
                ...convertTimestamps(subscriptionData)
            } as Subscription
        };
    } catch (error) {
        console.error("Error getting subscription:", error);
        return {
            subscription: null,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Get active subscription for a user
 */
export async function getUserActiveSubscription(userId: string): Promise<{ subscription: Subscription | null; error?: string }> {
    try {
        const db = getDb();
        const subscriptionsCollection = 'Subscriptions';

        const query = db.collection(subscriptionsCollection)
            .where('user_id', '==', userId)
            .where('status', '==', SubscriptionStatus.ACTIVE)
            .where('expires_at', '>', admin.firestore.Timestamp.now())
            .limit(1);

        const querySnapshot = await query.get();

        if (querySnapshot.empty) {
            return { subscription: null };
        }

        const subscriptionDoc = querySnapshot.docs[0];
        const subscriptionData = subscriptionDoc.data();

        return {
            subscription: {
                id: subscriptionDoc.id,
                ...convertTimestamps(subscriptionData)
            } as Subscription
        };
    } catch (error) {
        console.error("Error getting user subscription:", error);
        return {
            subscription: null,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Check if a user has active premium access
 */
export async function checkPremiumAccess(userId: string): Promise<{ hasPremiumAccess: boolean; error?: string }> {
    try {
        const { subscription, error } = await getUserActiveSubscription(userId);
        
        if (error) {
            return { hasPremiumAccess: false, error };
        }

        const expiresAt =
            subscription?.expires_at instanceof Date
                ? subscription.expires_at
                : subscription?.expires_at
                ? new Date(subscription.expires_at)
                : undefined;

        // Check if user has an active premium subscription
        const hasPremiumAccess =
            subscription?.plan_type === SubscriptionPlan.PREMIUM &&
            subscription?.status === SubscriptionStatus.ACTIVE &&
            !!expiresAt &&
            expiresAt > new Date();

        return { hasPremiumAccess };
    } catch (error) {
        console.error("Error checking premium access:", error);
        return {
            hasPremiumAccess: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, userId: string): Promise<SubscriptionResponse> {
    try {
        const db = getDb();
        const subscriptionsCollection = 'Subscriptions';

        const subscriptionRef = db.collection(subscriptionsCollection).doc(subscriptionId);
        const subscriptionSnapshot = await subscriptionRef.get();

        if (!subscriptionSnapshot.exists) {
            return {
                success: false,
                error: "Subscription not found"
            };
        }

        const subscriptionData = subscriptionSnapshot.data();
        if (subscriptionData?.user_id !== userId) {
            return {
                success: false,
                error: "You don't have permission to cancel this subscription"
            };
        }

        await subscriptionRef.update({
            status: SubscriptionStatus.CANCELLED,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}