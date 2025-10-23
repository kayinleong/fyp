"use server"

import { getFirestore } from "firebase-admin/firestore";
import { JobSwipe } from "@/lib/domains/job-swipe.domain";
import admin from "@/lib/firebase/server";
import { convertTimestamps } from "../timestamp";
import { ai } from "@/lib/firebase/ai";
import { getJobById } from "@/lib/actions/job.action";

// Helper function to get Firestore instance
function getDb() {
    return getFirestore();
}

interface JobSwipeResponse {
    success: boolean;
    error?: string;
    swipeId?: string;
}

/**
 * Get user's job swipe preferences from Firestore
 */
export async function getUserSwipes(userId: string): Promise<{ swipe: JobSwipe | null; error?: string }> {
    try {
        const db = getDb();
        const swipesCollection = 'JobSwipes';

        // Reference to the swipe document
        const swipeRef = db.collection(swipesCollection).doc(userId);

        // Get the swipe document
        const swipeSnapshot = await swipeRef.get();

        if (!swipeSnapshot.exists) {
            // Create a new swipe document if it doesn't exist
            const newSwipe: JobSwipe = {
                id: userId,
                user_id: userId,
                like_job_ids: [],
                dislike_job_ids: []
            };

            await swipeRef.set({
                ...newSwipe,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });

            return { swipe: newSwipe };
        }

        // Get the raw data
        const rawData = swipeSnapshot.data();

        // Add the ID to the swipe data
        const swipeWithId = {
            id: userId,
            ...rawData
        };

        // Convert timestamps to serializable format
        const swipeData = convertTimestamps(swipeWithId) as JobSwipe;

        return { swipe: swipeData };
    } catch (error) {
        console.error("Error getting user swipes:", error);
        return {
            swipe: null,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Add a job to user's liked jobs
 */
export async function likeJob(userId: string, jobId: string): Promise<JobSwipeResponse> {
    try {
        const db = getDb();
        const swipesCollection = 'JobSwipes';

        // Reference to the swipe document
        const swipeRef = db.collection(swipesCollection).doc(userId);

        // Get the current swipe data
        const { swipe } = await getUserSwipes(userId);

        if (!swipe) {
            return {
                success: false,
                error: "Could not retrieve or create user swipes"
            };
        }

        // Convert to arrays and update
        const likedJobs = Object.values(swipe.like_job_ids || {});
        const dislikedJobs = Object.values(swipe.dislike_job_ids || {}).filter(id => id !== jobId);

        if (!likedJobs.includes(jobId)) {
            likedJobs.push(jobId);
        }

        // Update the document
        await swipeRef.update({
            like_job_ids: Object.fromEntries(likedJobs.map(id => [id, id])),
            dislike_job_ids: Object.fromEntries(dislikedJobs.map(id => [id, id])),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, swipeId: userId };
    } catch (error) {
        console.error("Error liking job:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}

/**
 * Add a job to user's disliked jobs
 */
export async function dislikeJob(userId: string, jobId: string): Promise<JobSwipeResponse> {
    try {
        const db = getDb();
        const swipesCollection = 'JobSwipes';

        // Reference to the swipe document
        const swipeRef = db.collection(swipesCollection).doc(userId);

        // Get the current swipe data
        const { swipe } = await getUserSwipes(userId);

        if (!swipe) {
            return {
                success: false,
                error: "Could not retrieve or create user swipes"
            };
        }

        // Convert to arrays and update
        const likedJobs = Object.values(swipe.like_job_ids || {}).filter(id => id !== jobId);
        const dislikedJobs = Object.values(swipe.dislike_job_ids || {});

        if (!dislikedJobs.includes(jobId)) {
            dislikedJobs.push(jobId);
        }

        // Update the document
        await swipeRef.update({
            like_job_ids: Object.fromEntries(likedJobs.map(id => [id, id])),
            dislike_job_ids: Object.fromEntries(dislikedJobs.map(id => [id, id])),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, swipeId: userId };
    } catch (error) {
        console.error("Error disliking job:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}

/**
 * Remove a job from user's liked jobs
 */
export async function unlikeJob(userId: string, jobId: string): Promise<JobSwipeResponse> {
    try {
        const db = getDb();
        const swipesCollection = 'JobSwipes';

        // Reference to the swipe document
        const swipeRef = db.collection(swipesCollection).doc(userId);

        // Get the current swipe data
        const { swipe } = await getUserSwipes(userId);

        if (!swipe) {
            return {
                success: false,
                error: "Could not retrieve or create user swipes"
            };
        }

        // Remove job from liked array
        const likedJobs = Object.values(swipe.like_job_ids || {}).filter(id => id !== jobId);

        // Update the document
        await swipeRef.update({
            like_job_ids: Object.fromEntries(likedJobs.map(id => [id, id])),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            success: true,
            swipeId: userId
        };
    } catch (error) {
        console.error("Error unliking job:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Remove a job from user's disliked jobs
 */
export async function undislikeJob(userId: string, jobId: string): Promise<JobSwipeResponse> {
    try {
        const db = getDb();
        const swipesCollection = 'JobSwipes';

        // Reference to the swipe document
        const swipeRef = db.collection(swipesCollection).doc(userId);

        // Get the current swipe data
        const { swipe } = await getUserSwipes(userId);

        if (!swipe) {
            return {
                success: false,
                error: "Could not retrieve or create user swipes"
            };
        }

        // Remove job from disliked array
        const dislikedJobs = Object.values(swipe.dislike_job_ids || {}).filter(id => id !== jobId);

        // Update the document
        await swipeRef.update({
            dislike_job_ids: Object.fromEntries(dislikedJobs.map(id => [id, id])),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            success: true,
            swipeId: userId
        };
    } catch (error) {
        console.error("Error undisliking job:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Check if a user has liked a job
 */
export async function hasUserLikedJob(userId: string, jobId: string): Promise<{ hasLiked: boolean; error?: string }> {
    try {
        const { swipe, error } = await getUserSwipes(userId);

        if (error || !swipe) {
            return {
                hasLiked: false,
                error: error || "Could not retrieve user swipes"
            };
        }

        return {
            hasLiked: Object.values(swipe.like_job_ids || {}).includes(jobId)
        };
    } catch (error) {
        console.error("Error checking if user liked job:", error);
        return {
            hasLiked: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Check if a user has disliked a job
 */
export async function hasUserDislikedJob(userId: string, jobId: string): Promise<{ hasDisliked: boolean; error?: string }> {
    try {
        const { swipe, error } = await getUserSwipes(userId);

        if (error || !swipe) {
            return {
                hasDisliked: false,
                error: error || "Could not retrieve user swipes"
            };
        }

        return {
            hasDisliked: Object.values(swipe.dislike_job_ids || {}).includes(jobId)
        };
    } catch (error) {
        console.error("Error checking if user disliked job:", error);
        return {
            hasDisliked: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Get all liked jobs for a user
 */
export async function getLikedJobs(userId: string): Promise<{ jobIds: string[]; error?: string }> {
    try {
        const { swipe, error } = await getUserSwipes(userId);

        if (error || !swipe) {
            return { jobIds: [], error: error || "Could not retrieve user swipes" };
        }

        return { jobIds: Object.values(swipe.like_job_ids || {}) };
    } catch (error) {
        console.error("Error getting liked jobs:", error);
        return { jobIds: [], error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}

/**
 * Get all disliked jobs for a user
 */
export async function getDislikedJobs(userId: string): Promise<{ jobIds: string[]; error?: string }> {
    try {
        const { swipe, error } = await getUserSwipes(userId);

        if (error || !swipe) {
            return { jobIds: [], error: error || "Could not retrieve user swipes" };
        }

        return { jobIds: Object.values(swipe.dislike_job_ids || {}) };
    } catch (error) {
        console.error("Error getting disliked jobs:", error);
        return { jobIds: [], error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}

/**
 * Save AI analysis result to Firestore
 */
export async function saveAnalysisResult(userId: string, analysis: string): Promise<void> {
    try {
        const db = getDb();
        const analysisRef = db.collection("JobSwipeAnalysis").doc(userId);

        await analysisRef.set({
            user_id: userId,
            analysis,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error("Error saving analysis result:", error);
    }
}

/**
 * Get AI analysis result from Firestore
 */
export async function getAnalysisResult(userId: string): Promise<{ analysis: string | null; error?: string }> {
    try {
        const db = getDb();
        const analysisRef = db.collection("JobSwipeAnalysis").doc(userId);

        const snapshot = await analysisRef.get();
        if (!snapshot.exists) {
            return { analysis: null };
        }

        const data = snapshot.data();
        return { analysis: data?.analysis || null };
    } catch (error) {
        console.error("Error getting analysis result:", error);
        return { analysis: null, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}

/**
 * Analyze user job preferences using AI
 */
export async function analyzeUserPreferences(userId: string, userName: string): Promise<{ analysis: string; error?: string }> {
    try {
        const { jobIds: likedJobIds } = await getLikedJobs(userId);
        const { jobIds: dislikedJobIds } = await getDislikedJobs(userId);

        // Fetch job details for liked and disliked jobs
        const likedJobs = await Promise.all(
            likedJobIds.slice(0, 3).map((jobId) => getJobById(jobId).then((res) => res.job))
        );
        const dislikedJobs = await Promise.all(
            dislikedJobIds.slice(0, 3).map((jobId) => getJobById(jobId).then((res) => res.job))
        );

        // Prepare AI prompt
        const prompt = `
            Analyze the following job preferences for ${userName}:
            
            Liked Jobs:
            ${likedJobs
                .filter((job) => job)
                .map((job) => `- ${job?.title} at ${job?.company_name}, ${job?.company_location}`)
                .join("\n")}

            Disliked Jobs:
            ${dislikedJobs
                .filter((job) => job)
                .map((job) => `- ${job?.title} at ${job?.company_name}, ${job?.company_location}`)
                .join("\n")}

            Based on the above, provide summary into the user's preferences, including preferred job types, locations, and other patterns. You should say in second person as if you are talking to the user.
            The response should not exceed 100 words. 
        `;

        const response = await ai.generate(prompt);
        const analysis = response.text.trim();

        // Save the analysis result
        await saveAnalysisResult(userId, analysis);

        return { analysis };
    } catch (error) {
        console.error("Error analyzing user preferences:", error);
        return { analysis: "", error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}
