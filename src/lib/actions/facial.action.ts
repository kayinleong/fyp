"use server";

import admin from "@/lib/firebase/server";
import { z } from "zod";

const db = admin.firestore();

// Schema for facial data
const FacialDataSchema = z.object({
  userId: z.string(),
  faceDescriptor: z.array(z.number()),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

type FacialData = z.infer<typeof FacialDataSchema>;

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Store facial recognition data for a user
 */
export async function storeFacialData(
  userId: string,
  faceDescriptor: Float32Array | number[]
): Promise<ActionResult<void>> {
  try {
    // Convert to regular array for Firestore storage
    const descriptorArray = Array.isArray(faceDescriptor)
      ? faceDescriptor
      : Array.from(faceDescriptor);

    const facialData: FacialData = {
      userId,
      faceDescriptor: descriptorArray,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate the data
    const validatedData = FacialDataSchema.parse(facialData);

    // Store in Firestore
    await db.collection("UserFacialData").doc(userId).set(validatedData);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error storing facial data:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to store facial data",
    };
  }
}

/**
 * Retrieve facial recognition data for a user
 */
export async function getFacialData(
  userId: string
): Promise<ActionResult<number[] | null>> {
  try {
    const doc = await db.collection("UserFacialData").doc(userId).get();

    if (!doc.exists) {
      return {
        success: true,
        data: null,
      };
    }

    const data = doc.data();
    if (!data || !data.faceDescriptor) {
      return {
        success: true,
        data: null,
      };
    }

    // Return the array directly (for DeepFace compatibility)
    const faceDescriptor = data.faceDescriptor;

    return {
      success: true,
      data: faceDescriptor,
    };
  } catch (error) {
    console.error("Error retrieving facial data:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve facial data",
    };
  }
}

/**
 * Update facial recognition data for a user
 */
export async function updateFacialData(
  userId: string,
  faceDescriptor: Float32Array
): Promise<ActionResult<void>> {
  try {
    // Convert Float32Array to regular array for Firestore storage
    const descriptorArray = Array.from(faceDescriptor);

    const updateData = {
      faceDescriptor: descriptorArray,
      updatedAt: new Date(),
    };

    // Update in Firestore
    await db.collection("UserFacialData").doc(userId).update(updateData);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating facial data:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update facial data",
    };
  }
}

/**
 * Delete facial recognition data for a user
 */
export async function deleteFacialData(
  userId: string
): Promise<ActionResult<void>> {
  try {
    await db.collection("UserFacialData").doc(userId).delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting facial data:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete facial data",
    };
  }
}

/**
 * Check if facial data exists for a user
 */
export async function hasFacialData(
  userId: string
): Promise<ActionResult<boolean>> {
  try {
    const doc = await db.collection("UserFacialData").doc(userId).get();
    const exists = doc.exists;
    const hasDescriptor = exists && !!doc.data()?.faceDescriptor;

    return {
      success: true,
      data: hasDescriptor,
    };
  } catch (error) {
    console.error("Error checking facial data:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to check facial data",
    };
  }
}
