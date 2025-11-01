"use server"

import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";

interface SessionResponse {
    success: boolean;
    error?: string;
}

interface ValidateSessionResponse {
    user: {
        uid: string;
        email: string | undefined;
        emailVerified: boolean | undefined;
    } | null;
}

export async function createSessionCookie(idToken: string): Promise<SessionResponse> {
    // Set session expiration to 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    try {
        const auth = getAuth();
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        (await cookies()).set('session', sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        });

        return { success: true };
    } catch {
        return { success: false, error: "Failed to create session" };
    }
}

export async function validateSession(): Promise<ValidateSessionResponse> {
    const session = (await cookies()).get('session')?.value;

    if (!session) {
        return { user: null };
    }

    try {
        const auth = getAuth();
        const decodedClaims = await auth.verifySessionCookie(session, true);

        return {
            user: {
                uid: decodedClaims.uid,
                email: decodedClaims.email,
                emailVerified: decodedClaims.email_verified,
            }
        };
    } catch {
        // Session is invalid
        (await cookies()).delete('session');
        return { user: null };
    }
}

export async function logoutSession(): Promise<SessionResponse> {
    (await cookies()).delete('session');
    return { success: true };
}
