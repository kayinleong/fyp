"use server"

import { getFirestore } from "firebase-admin/firestore";
import { Job, JobStatus } from "@/lib/domains/jobs.domain";
import admin from "@/lib/firebase/server";
import { convertTimestamps } from "../timestamp";

// Helper function to get Firestore instance
function getDb() {
    return getFirestore();
}

interface JobResponse {
    success: boolean;
    error?: string;
    jobId?: string;
}

interface JobsResponse {
    jobs: Job[];
    error?: string;
}

/**
 * Interface for job filtering parameters
 */
export interface JobFilterParams {
    location?: string;
    isRemote?: boolean;
    minSalary?: number;
    maxSalary?: number;
    skills?: string[];
    jobType?: string;
    limit?: number;
    status?: JobStatus;
}

/**
 * Creates a new job listing in Firestore
 */
export async function createJob(job: Job): Promise<JobResponse> {
    try {
        const db = getDb();
        const jobsCollection = 'Jobs';

        // Create a new document with auto-generated ID
        const jobRef = db.collection(jobsCollection).doc();

        // Add timestamps and company ID
        const jobWithMetadata = {
            ...job,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            status: job.status || JobStatus.OPEN
        };

        // Create the job document
        await jobRef.set(jobWithMetadata);

        return {
            success: true,
            jobId: jobRef.id
        };
    } catch (error) {
        console.error("Error creating job:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Updates an existing job in Firestore
 */
export async function updateJob(
    jobId: string,
    jobData: Partial<Job>,
    id?: string
): Promise<JobResponse> {
    try {
        const db = getDb();
        const jobsCollection = 'Jobs';

        // Reference to the job document
        const jobRef = db.collection(jobsCollection).doc(jobId);

        // Get the current job data
        const jobSnapshot = await jobRef.get();

        if (!jobSnapshot.exists) {
            return {
                success: false,
                error: "Job not found"
            };
        }

        // If company ID is provided, check if the job belongs to that company
        if (id) {
            const currentData = jobSnapshot.data();
            if (currentData?.user_id !== id) {
                return {
                    success: false,
                    error: "You don't have permission to update this job"
                };
            }
        }

        // Add update timestamp
        const dataToUpdate = {
            ...jobData,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        // Update the job
        await jobRef.update(dataToUpdate);

        return { success: true };
    } catch (error) {
        console.error("Error updating job:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Gets a job by ID from Firestore
 */
export async function getJobById(jobId: string): Promise<{ job: Job | null; error?: string }> {
    try {
        const db = getDb();
        const jobsCollection = 'Jobs';

        // Reference to the job document
        const jobRef = db.collection(jobsCollection).doc(jobId);

        // Get the job document
        const jobSnapshot = await jobRef.get();

        if (!jobSnapshot.exists) {
            return { job: null, error: "Job not found" };
        }

        // Get the raw data
        const rawData = jobSnapshot.data();

        // Add the ID to the job data
        const jobWithId = {
            id: jobId,
            ...rawData
        };

        // Convert timestamps to serializable format
        const jobData = convertTimestamps(jobWithId) as Job;

        return { job: jobData };
    } catch (error) {
        console.error("Error getting job:", error);
        return {
            job: null,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Deletes a job from Firestore
 */
export async function deleteJob(jobId: string, id?: string): Promise<JobResponse> {
    try {
        const db = getDb();
        const jobsCollection = 'Jobs';

        // Reference to the job document
        const jobRef = db.collection(jobsCollection).doc(jobId);

        // Get the current job data to check ownership
        const jobSnapshot = await jobRef.get();

        if (!jobSnapshot.exists) {
            return {
                success: false,
                error: "Job not found"
            };
        }

        // If company ID is provided, check if the job belongs to that company
        if (id) {
            const currentData = jobSnapshot.data();
            if (currentData?.user_id !== id) {
                return {
                    success: false,
                    error: "You don't have permission to delete this job"
                };
            }
        }

        // Delete the job
        await jobRef.delete();

        return { success: true };
    } catch (error) {
        console.error("Error deleting job:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Lists all jobs in Firestore
 */
export async function listJobs(
    limit: number = 20,
    status?: JobStatus
): Promise<JobsResponse> {
    try {
        const db = getDb();
        const jobsCollection = 'Jobs';

        // Create base query
        let query = db.collection(jobsCollection).limit(limit);

        // Add status filter if provided
        if (status) {
            query = query.where('status', '==', status);
        }

        // Add sorting by creation date
        query = query.orderBy('created_at', 'desc');

        // Execute the query
        const querySnapshot = await query.get();

        // Process the results
        const jobs: Job[] = [];
        querySnapshot.forEach(doc => {
            const rawData = doc.data();
            const jobWithId = {
                id: doc.id,
                ...rawData
            };
            const jobData = convertTimestamps(jobWithId) as Job;
            jobs.push(jobData);
        });

        return { jobs };
    } catch (error) {
        console.error("Error listing jobs:", error);
        return {
            jobs: [],
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Lists jobs for a specific user
 */
export async function listCompanyJobs(
    userId: string,
    limit: number = 20,
    status?: JobStatus
): Promise<JobsResponse> {
    try {
        // Validate userId is not null or undefined
        if (!userId) {
            console.error("Invalid userId: null or undefined");
            return {
                jobs: [],
                error: "User ID is required"
            };
        }

        const db = getDb();
        const jobsCollection = 'Jobs';

        // Create base query with user filter
        let query = db.collection(jobsCollection)
            .where('user_id', '==', userId)
            .limit(limit);

        // Add status filter if provided
        if (status) {
            query = query.where('status', '==', status);
        }

        // Add sorting by creation date
        query = query.orderBy('created_at', 'desc');

        // Execute the query
        const querySnapshot = await query.get();

        // Process the results
        const jobs: Job[] = [];
        querySnapshot.forEach(doc => {
            const rawData = doc.data();
            const jobWithId = {
                id: doc.id,
                ...rawData
            };
            const jobData = convertTimestamps(jobWithId) as Job;
            jobs.push(jobData);
        });

        return { jobs };
    } catch (error) {
        console.error("Error listing company jobs:", error);
        return {
            jobs: [],
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Updates the status of a job
 */
export async function updateJobStatus(
    jobId: string,
    status: JobStatus,
    userId?: string
): Promise<JobResponse> {
    try {
        return await updateJob(jobId, { status }, userId);
    } catch (error) {
        console.error("Error updating job status:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Filter jobs based on provided criteria
 */
export async function filterJobs(filterParams: JobFilterParams): Promise<JobsResponse> {
    try {
        const db = getDb();
        const jobsCollection = 'Jobs';
        const {
            isRemote,
            minSalary,
            maxSalary,
            skills,
            jobType,
            limit = 20,
            status = JobStatus.OPEN
        } = filterParams;

        // Create base query
        let query = db.collection(jobsCollection)
            .where('status', '==', status);

        // Apply remote filter if provided
        if (isRemote) {
            query = query.where('is_remote', '==', true);
        }

        // Apply job type filter if provided
        if (jobType) {
            query = query.where('type', '==', jobType);
        }

        // Get all the results that match our filters so far
        const querySnapshot = await query.get();

        // Apply salary filter client-side (Firestore doesn't support range queries on multiple fields)
        let filteredJobs = (querySnapshot.docs.map(doc => {
            const rawData = doc.data();
            return {
                id: doc.id,
                ...rawData
            };
        })) as Job[];

        // Filter by salary range if provided
        if (minSalary !== undefined) {
            filteredJobs = filteredJobs.filter(job => job.maximum_salary >= minSalary);
        }

        if (maxSalary !== undefined) {
            filteredJobs = filteredJobs.filter(job => job.minimum_salary <= maxSalary);
        }

        // Filter by skills if provided
        if (skills && skills.length > 0) {
            filteredJobs = filteredJobs.filter(job => {
                const jobSkills = job.required_skills ? Object.values(job.required_skills) : [];
                return skills.some(skill =>
                    jobSkills.some(jobSkill =>
                        jobSkill.toLowerCase().includes(skill.toLowerCase())
                    )
                );
            });
        }

        // Sort by creation date (descending)
        filteredJobs.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });

        // Apply limit
        filteredJobs = filteredJobs.slice(0, limit);

        // Convert timestamps
        const jobs = filteredJobs.map(job => convertTimestamps(job)) as Job[];

        return { jobs };
    } catch (error) {
        console.error("Error filtering jobs:", error);
        return {
            jobs: [],
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}