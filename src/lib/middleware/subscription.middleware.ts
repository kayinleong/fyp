"use server"

import { validateSession } from "@/lib/actions/auth.action";
import { checkPremiumAccess } from "@/lib/actions/subscription.action";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function withSubscription(handler: Function) {
    return async (...args: any[]) => {
        try {
            // Check if user is authenticated
            const sessionResponse = await validateSession();
            const userId = sessionResponse.user?.uid;

            if (!userId) {
                return NextResponse.json(
                    { error: "Authentication required" },
                    { status: 401 }
                );
            }

            // Check if user has premium access
            const { hasPremiumAccess, error } = await checkPremiumAccess(userId);

            if (error) {
                return NextResponse.json(
                    { error: "Error checking subscription status" },
                    { status: 500 }
                );
            }

            if (!hasPremiumAccess) {
                return NextResponse.json(
                    { error: "Premium subscription required" },
                    { status: 403 }
                );
            }

            // If all checks pass, execute the handler
            return handler(...args);
        } catch (error) {
            console.error("Error in subscription middleware:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }
    };
}

// Route Handler Middleware
export async function withSubscriptionRoute(request: NextRequest) {
    try {
        // Check if user is authenticated
        const sessionResponse = await validateSession();
        const userId = sessionResponse.user?.uid;

        if (!userId) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Check if user has premium access
        const { hasPremiumAccess, error } = await checkPremiumAccess(userId);

        if (error) {
            return NextResponse.json(
                { error: "Error checking subscription status" },
                { status: 500 }
            );
        }

        if (!hasPremiumAccess) {
            return NextResponse.json(
                { error: "Premium subscription required" },
                { status: 403 }
            );
        }

        // Allow the request to proceed
        return NextResponse.next();
    } catch (error) {
        console.error("Error in subscription route middleware:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Hook for checking subscription in client components
export async function useSubscriptionCheck() {
    try {
        const sessionResponse = await validateSession();
        const userId = sessionResponse.user?.uid;

        if (!userId) {
            return { hasAccess: false, error: "Authentication required" };
        }

        const { hasPremiumAccess, error } = await checkPremiumAccess(userId);

        if (error) {
            return { hasAccess: false, error };
        }

        return { hasAccess: hasPremiumAccess };
    } catch (error) {
        console.error("Error checking subscription:", error);
        return {
            hasAccess: false,
            error: "Error checking subscription status"
        };
    }
}