/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getFirestore } from "firebase-admin/firestore";
import { SavedJob } from "@/lib/domains/saved-jobs.domain";
import { convertTimestamps } from "../timestamp";
import admin from "../firebase/server";
import { validateSession } from "./auth.action";

// Helper function to get Firestore instance
function getDb() {
  return getFirestore();
}

interface SavedJobResponse {
  success: boolean;
  error?: string;
  savedJobId?: string;
}

interface SavedJobsResponse {
  savedJobs: SavedJob[];
  error?: string;
}

/**
 * Saves a job for a user (job seeker or guest)
 */
export async function saveJob(jobId: string): Promise<SavedJobResponse> {
  try {
    const sessionResponse = await validateSession();
    const userId = sessionResponse.user?.uid;

    if (!userId) {
      return {
        success: false,
        error: "You must be logged in to save jobs",
      };
    }

    // Get user profile to check if they're a job seeker or guest
    const { getProfileById } = await import("./profile.action");
    const { profile } = await getProfileById(userId);

    if (!profile) {
      return {
        success: false,
        error: "Profile not found",
      };
    }

    // Only allow GUEST (job seeker) accounts to save jobs
    if (profile.role !== "GUEST") {
      return {
        success: false,
        error: "Only job seekers can save jobs",
      };
    }

    const db = getDb();
    const savedJobsCollection = "SavedJobs";

    // Check if job is already saved
    const existingQuery = db
      .collection(savedJobsCollection)
      .where("user_id", "==", userId)
      .where("job_id", "==", jobId)
      .limit(1);

    const existingSnapshot = await existingQuery.get();

    if (!existingSnapshot.empty) {
      return {
        success: false,
        error: "Job is already saved",
      };
    }

    // Verify job exists
    const { getJobById } = await import("./job.action");
    const { job, error: jobError } = await getJobById(jobId);

    if (!job || jobError) {
      return {
        success: false,
        error: "Job not found",
      };
    }

    // Create saved job document
    const savedJobRef = db.collection(savedJobsCollection).doc();
    const savedJobData = {
      user_id: userId,
      job_id: jobId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await savedJobRef.set(savedJobData);

    return {
      success: true,
      savedJobId: savedJobRef.id,
    };
  } catch (error) {
    console.error("Error saving job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Removes a saved job for a user
 */
export async function unsaveJob(jobId: string): Promise<SavedJobResponse> {
  try {
    const sessionResponse = await validateSession();
    const userId = sessionResponse.user?.uid;

    if (!userId) {
      return {
        success: false,
        error: "You must be logged in to unsave jobs",
      };
    }

    const db = getDb();
    const savedJobsCollection = "SavedJobs";

    // Find the saved job document
    const savedJobQuery = db
      .collection(savedJobsCollection)
      .where("user_id", "==", userId)
      .where("job_id", "==", jobId)
      .limit(1);

    const savedJobSnapshot = await savedJobQuery.get();

    if (savedJobSnapshot.empty) {
      return {
        success: false,
        error: "Saved job not found",
      };
    }

    // Delete the saved job document
    const savedJobDoc = savedJobSnapshot.docs[0];
    await savedJobDoc.ref.delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error unsaving job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Gets all saved jobs for a user
 */
export async function getSavedJobs(
  userId?: string
): Promise<SavedJobsResponse> {
  try {
    // If userId is not provided, get it from session
    let targetUserId = userId;
    if (!targetUserId) {
      const sessionResponse = await validateSession();
      targetUserId = sessionResponse.user?.uid;
    }

    if (!targetUserId) {
      return {
        savedJobs: [],
        error: "You must be logged in to view saved jobs",
      };
    }

    const db = getDb();
    const savedJobsCollection = "SavedJobs";

    // Get all saved jobs for the user (without orderBy to avoid index requirement)
    const savedJobsQuery = db
      .collection(savedJobsCollection)
      .where("user_id", "==", targetUserId);

    const savedJobsSnapshot = await savedJobsQuery.get();

    const savedJobs: SavedJob[] = [];
    savedJobsSnapshot.forEach((doc) => {
      const rawData = doc.data();
      const savedJobWithId = {
        id: doc.id,
        ...rawData,
      };
      const savedJobData = convertTimestamps(savedJobWithId) as SavedJob;
      savedJobs.push(savedJobData);
    });

    // Sort by created_at descending (newest first) client-side
    savedJobs.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return { savedJobs };
  } catch (error) {
    console.error("Error getting saved jobs:", error);
    return {
      savedJobs: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Checks if a job is saved by the current user
 */
export async function isJobSaved(
  jobId: string
): Promise<{ isSaved: boolean; error?: string }> {
  try {
    const sessionResponse = await validateSession();
    const userId = sessionResponse.user?.uid;

    if (!userId) {
      return { isSaved: false };
    }

    const db = getDb();
    const savedJobsCollection = "SavedJobs";

    // Check if job is saved
    const savedJobQuery = db
      .collection(savedJobsCollection)
      .where("user_id", "==", userId)
      .where("job_id", "==", jobId)
      .limit(1);

    const savedJobSnapshot = await savedJobQuery.get();

    return { isSaved: !savedJobSnapshot.empty };
  } catch (error) {
    console.error("Error checking if job is saved:", error);
    return {
      isSaved: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Gets saved jobs with full job details
 */
export async function getSavedJobsWithDetails(
  userId?: string
): Promise<{ jobs: any[]; error?: string }> {
  try {
    const { savedJobs, error } = await getSavedJobs(userId);

    if (error) {
      return { jobs: [], error };
    }

    // Fetch full job details for each saved job
    const { getJobById } = await import("./job.action");
    const jobs = [];

    for (const savedJob of savedJobs) {
      const { job, error: jobError } = await getJobById(savedJob.job_id);
      if (job && !jobError) {
        jobs.push({
          ...job,
          saved_at: savedJob.created_at,
          saved_job_id: savedJob.id,
        });
      }
    }

    return { jobs };
  } catch (error) {
    console.error("Error getting saved jobs with details:", error);
    return {
      jobs: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
