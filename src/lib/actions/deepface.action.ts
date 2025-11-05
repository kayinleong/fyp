// Client-side DeepFace API functions
// This file contains client-side functions for communicating with the DeepFace server

import { auth } from "@/lib/firebase/client";

// Configuration for DeepFace server - Google Cloud Run endpoints
const ENDPOINTS = {
  detect_face: process.env.NEXT_PUBLIC_DEEPFACE_DETECT_FACE_URL,
  verify_faces: process.env.NEXT_PUBLIC_DEEPFACE_VERIFY_FACES_URL,
  health: process.env.NEXT_PUBLIC_DEEPFACE_HEALTH_URL,
  models_info: process.env.NEXT_PUBLIC_DEEPFACE_MODELS_INFO_URL,
};

/**
 * Get the current user's ID token for authentication
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const idToken = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    };
  } catch (error) {
    console.error("Error getting auth token:", error);
    throw new Error("Failed to get authentication token");
  }
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ModelsInfo {
  success: boolean;
  deepface_home: string;
  weights_path: string;
  directories_exist: {
    home: boolean;
    weights: boolean;
  };
  downloaded_models: string[];
  total_models_size_mb: number;
  environment_variable: string;
}

/**
 * Capture image from video element (client-side only)
 */
function captureImageFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Flip the image horizontally to match the mirror effect
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width, 0);
  ctx.drawImage(video, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.8);
}

/**
 * Detect face and extract embeddings using DeepFace (client-side)
 */
export async function detectFaceDeepFace(
  video: HTMLVideoElement
): Promise<ActionResult<number[]>> {
  try {
    // Capture image from video
    const imageBase64 = captureImageFromVideo(video);

    // Get authentication headers
    const headers = await getAuthHeaders();

    // Send to DeepFace Cloud Run Functions with authentication
    const response = await fetch(ENDPOINTS.detect_face!, {
      method: "POST",
      headers,
      body: JSON.stringify({
        image: imageBase64,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepFace server error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Face detection failed",
      };
    }

    return {
      success: true,
      data: result.embedding,
    };
  } catch (error) {
    console.error("Error detecting face with DeepFace:", error);

    // Handle authentication errors specifically
    if (error instanceof Error && error.message.includes("authentication")) {
      return {
        success: false,
        error: "Authentication required. Please log in and try again.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to detect face",
    };
  }
}

/**
 * Verify two face embeddings using DeepFace
 */
export async function verifyFacesDeepFace(
  embedding1: number[],
  embedding2: number[]
): Promise<
  ActionResult<{
    isMatch: boolean;
    confidence: number;
    similarity: number;
    distance: number;
  }>
> {
  try {
    // Get authentication headers
    const headers = await getAuthHeaders();

    const response = await fetch(ENDPOINTS.verify_faces!, {
      method: "POST",
      headers,
      body: JSON.stringify({
        embedding1,
        embedding2,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepFace server error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Face verification failed",
      };
    }

    return {
      success: true,
      data: {
        isMatch: result.is_match,
        confidence: result.confidence,
        similarity: result.cosine_similarity,
        distance: result.euclidean_distance,
      },
    };
  } catch (error) {
    console.error("Error verifying faces with DeepFace:", error);

    // Handle authentication errors specifically
    if (error instanceof Error && error.message.includes("authentication")) {
      return {
        success: false,
        error: "Authentication required. Please log in and try again.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify faces",
    };
  }
}

/**
 * Check if DeepFace server is healthy
 */
export async function checkDeepFaceHealth(): Promise<ActionResult<boolean>> {
  try {
    // Get authentication headers
    const headers = await getAuthHeaders();

    const response = await fetch(ENDPOINTS.health!, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return {
        success: false,
        error: "DeepFace server not responding",
      };
    }

    const result = await response.json();

    return {
      success: true,
      data: result.status === "healthy",
    };
  } catch (error) {
    console.error("DeepFace health check error:", error);

    // Handle authentication errors specifically
    if (error instanceof Error && error.message.includes("authentication")) {
      return {
        success: false,
        error: "Authentication required. Please log in and try again.",
      };
    }

    return {
      success: false,
      error: "DeepFace server unreachable",
    };
  }
}

/**
 * Get models information from DeepFace server
 */
export async function getModelsInfo(): Promise<ActionResult<ModelsInfo>> {
  try {
    // Get authentication headers
    const headers = await getAuthHeaders();

    const response = await fetch(ENDPOINTS.models_info!, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return {
        success: false,
        error: "DeepFace server not responding",
      };
    }

    const result = await response.json();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("DeepFace models info error:", error);

    // Handle authentication errors specifically
    if (error instanceof Error && error.message.includes("authentication")) {
      return {
        success: false,
        error: "Authentication required. Please log in and try again.",
      };
    }

    return {
      success: false,
      error: "Failed to get models info",
    };
  }
}
