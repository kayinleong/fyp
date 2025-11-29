"use server";

import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase/server";
import { convertTimestamps } from "../timestamp";
import { validateSession } from "./auth.action";
import {
  SwipeAISettings,
  FirestoreSwipeAISettings,
  DEFAULT_SWIPE_SETTINGS,
  MainCategoryPriorities,
  JobTitlePriorities,
} from "@/lib/domains/swipe-settings.domain";
import { FirestoreTimestamp } from "@/lib/domains/base";

// Helper function to get Firestore instance
function getDb() {
  return getFirestore();
}

interface SwipeAISettingsResponse {
  success: boolean;
  settings?: SwipeAISettings;
  error?: string;
}

/**
 * Get user's swipe AI settings
 */
export async function getSwipeAISettings(
  userId?: string
): Promise<SwipeAISettingsResponse> {
  try {
    const sessionResponse = await validateSession();
    const authedUserId = sessionResponse.user?.uid;

    if (!authedUserId) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    const targetUserId = userId || authedUserId;
    const db = getDb();
    const settingsCollection = "SwipeAISettings";

    const settingsRef = db.collection(settingsCollection).doc(targetUserId);
    const settingsSnapshot = await settingsRef.get();

    if (!settingsSnapshot.exists) {
      // Return default settings if none exist
      const defaultSettings: SwipeAISettings = {
        id: targetUserId,
        user_id: targetUserId,
        mainCategoryPriorities: DEFAULT_SWIPE_SETTINGS.mainCategoryPriorities,
        jobTitlePriorities: DEFAULT_SWIPE_SETTINGS.jobTitlePriorities,
      };
      return {
        success: true,
        settings: defaultSettings,
      };
    }

    const rawData = settingsSnapshot.data();
    const settingsWithId = {
      id: targetUserId,
      ...rawData,
    };

    const settingsData = convertTimestamps(settingsWithId) as SwipeAISettings;

    return {
      success: true,
      settings: settingsData,
    };
  } catch (error) {
    console.error("Error getting swipe AI settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Save/Update user's swipe AI settings
 */
export async function saveSwipeAISettings(
  settings: Partial<SwipeAISettings>
): Promise<SwipeAISettingsResponse> {
  try {
    const sessionResponse = await validateSession();
    const authedUserId = sessionResponse.user?.uid;

    if (!authedUserId) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    if (settings.user_id && settings.user_id !== authedUserId) {
      return {
        success: false,
        error: "You can only update your own settings.",
      };
    }

    const db = getDb();
    const settingsCollection = "SwipeAISettings";

    const settingsRef = db.collection(settingsCollection).doc(authedUserId);

    // Get existing settings to merge with defaults
    const existingSnapshot = await settingsRef.get();
    let existingSettings: Partial<SwipeAISettings> = {};

    if (existingSnapshot.exists) {
      const rawData = existingSnapshot.data();
      existingSettings = convertTimestamps(
        rawData || {}
      ) as Partial<SwipeAISettings>;
    }

    // Merge with defaults, then with existing, then with new settings
    // Ensure we always have complete mainCategoryPriorities and jobTitlePriorities
    const mergedMainCategoryPriorities = {
      ...DEFAULT_SWIPE_SETTINGS.mainCategoryPriorities,
      ...(existingSettings.mainCategoryPriorities || {}),
      ...(settings.mainCategoryPriorities || {}),
    };

    const mergedJobTitlePriorities = {
      ...DEFAULT_SWIPE_SETTINGS.jobTitlePriorities,
      ...(existingSettings.jobTitlePriorities || {}),
      ...(settings.jobTitlePriorities || {}),
    };

    const mergedSettings: FirestoreSwipeAISettings = {
      id: authedUserId,
      user_id: authedUserId,
      mainCategoryPriorities: mergedMainCategoryPriorities,
      jobTitlePriorities: mergedJobTitlePriorities,
      updated_at:
        admin.firestore.FieldValue.serverTimestamp() as unknown as FirestoreTimestamp,
    };

    // Ensure created_at is set only if document doesn't exist
    if (!existingSnapshot.exists) {
      mergedSettings.created_at =
        admin.firestore.FieldValue.serverTimestamp() as unknown as FirestoreTimestamp;
    }

    // Use set to ensure complete replacement (not merge which can cause partial updates)
    await settingsRef.set(mergedSettings);

    // Fetch the saved settings back to ensure we return the complete, saved version
    // This ensures we have the actual timestamps from Firestore
    const savedSnapshot = await settingsRef.get();
    if (!savedSnapshot.exists) {
      throw new Error("Failed to verify saved settings");
    }

    const savedData = savedSnapshot.data();
    const savedWithId = {
      id: authedUserId,
      user_id: authedUserId,
      ...savedData,
    };

    // Convert back to regular format for response
    const responseSettings = convertTimestamps(savedWithId) as SwipeAISettings;

    // Ensure all required fields are present
    if (
      !responseSettings.mainCategoryPriorities ||
      !responseSettings.jobTitlePriorities
    ) {
      // Fallback to defaults if missing
      responseSettings.mainCategoryPriorities =
        responseSettings.mainCategoryPriorities ||
        DEFAULT_SWIPE_SETTINGS.mainCategoryPriorities;
      responseSettings.jobTitlePriorities =
        responseSettings.jobTitlePriorities ||
        DEFAULT_SWIPE_SETTINGS.jobTitlePriorities;
    }

    return {
      success: true,
      settings: responseSettings,
    };
  } catch (error) {
    console.error("Error saving swipe AI settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Reset swipe AI settings to defaults
 */
export async function resetSwipeAISettings(): Promise<SwipeAISettingsResponse> {
  try {
    const sessionResponse = await validateSession();
    const authedUserId = sessionResponse.user?.uid;

    if (!authedUserId) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    const defaultSettings: FirestoreSwipeAISettings = {
      id: authedUserId,
      user_id: authedUserId,
      mainCategoryPriorities: DEFAULT_SWIPE_SETTINGS.mainCategoryPriorities,
      jobTitlePriorities: DEFAULT_SWIPE_SETTINGS.jobTitlePriorities,
      updated_at:
        admin.firestore.FieldValue.serverTimestamp() as unknown as FirestoreTimestamp,
    };

    const db = getDb();
    const settingsCollection = "SwipeAISettings";
    const settingsRef = db.collection(settingsCollection).doc(authedUserId);

    const existingSnapshot = await settingsRef.get();
    if (existingSnapshot.exists) {
      defaultSettings.created_at = existingSnapshot.data()?.created_at;
    } else {
      defaultSettings.created_at =
        admin.firestore.FieldValue.serverTimestamp() as unknown as FirestoreTimestamp;
    }

    await settingsRef.set(defaultSettings);

    const responseSettings = convertTimestamps(
      defaultSettings
    ) as SwipeAISettings;

    return {
      success: true,
      settings: responseSettings,
    };
  } catch (error) {
    console.error("Error resetting swipe AI settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
