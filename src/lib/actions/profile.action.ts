"use server"

import { getFirestore } from "firebase-admin/firestore";
import { Profile } from "@/lib/domains/profile.domain";
import { convertTimestamps } from "../timestamp";
import admin from "../firebase/server";

// Helper function to get Firestore instance
function getDb() {
    return getFirestore();
}

/**
 * Creates a new profile in Firestore
 */
export async function createProfile(profile: Profile): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getDb();
        const profilesCollection = 'Profiles';

        // Use the user_id as the document ID
        const profileRef = db.collection(profilesCollection).doc(profile.user_id);

        // Check if the profile already exists
        const profileSnapshot = await profileRef.get();
        if (profileSnapshot.exists) {
            return {
                success: false,
                error: "Profile already exists for this user"
            };
        }

        // Add creation timestamp
        const profileWithTimestamp = {
            ...profile,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        // Create the profile document
        await profileRef.set(profileWithTimestamp);

        return { success: true };
    } catch (error) {
        console.error("Error creating profile:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Updates an existing profile in Firestore
 */
export async function updateProfile(
    userId: string,
    profileData: Partial<Profile>
): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getDb();
        const profilesCollection = 'Profiles';

        // Reference to the profile document
        const profileRef = db.collection(profilesCollection).doc(userId);

        // Check if the profile exists
        const profileSnapshot = await profileRef.get();
        if (!profileSnapshot.exists) {
            return {
                success: false,
                error: "Profile not found"
            };
        }

        // Add update timestamp
        const dataToUpdate = {
            ...profileData,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        // Don't allow changing the user_id
        if ('user_id' in dataToUpdate) {
            delete dataToUpdate.user_id;
        }

        // Update the profile
        await profileRef.update(dataToUpdate);

        return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}


/**
 * Gets a profile by user ID from Firestore
 */
export async function getProfileById(userId: string): Promise<{ profile: Profile | null; error?: string }> {
    try {
        const db = getDb();
        const profilesCollection = 'Profiles';

        // Reference to the profile document
        const profileRef = db.collection(profilesCollection).doc(userId);

        // Get the profile document
        const profileSnapshot = await profileRef.get();

        if (!profileSnapshot.exists) {
            return { profile: null, error: "Profile not found" };
        }

        // Get the raw data
        const rawData = profileSnapshot.data();

        // Convert timestamps to serializable format
        const profileData = convertTimestamps(rawData) as Profile;

        return { profile: profileData };
    } catch (error) {
        console.error("Error getting profile:", error);
        return {
            profile: null,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}