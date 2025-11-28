"use server";

import { getFirestore } from "firebase-admin/firestore";
import {
  Application,
  ApplicationStatus,
} from "@/lib/domains/applications.domain";
import admin from "@/lib/firebase/server";
import { convertTimestamps } from "../timestamp";
import { getStorage } from "firebase-admin/storage";
import { sendEmail } from "./smtp.action";
import { getEmailTemplate } from "@/lib/utils/email-templates";
import { getJobById } from "./job.action";

// Helper function to get Firestore instance
function getDb() {
  return getFirestore();
}

interface ApplicationResponse {
  success: boolean;
  error?: string;
  applicationId?: string;
}

interface ApplicationsResponse {
  applications: Application[];
  error?: string;
}

/**
 * Interface for application filtering parameters
 */
export interface ApplicationFilterParams {
  jobId?: string;
  userId?: string;
  status?: ApplicationStatus;
  limit?: number;
}

/**
 * Creates a new job application in Firestore
 */
export async function createApplication(
  application: Application
): Promise<ApplicationResponse> {
  try {
    // Check if user already has a pending application for this job
    const { hasPending, error: checkError } = await hasPendingApplication(
      application.user_id,
      application.job_id
    );

    if (checkError) {
      return {
        success: false,
        error: checkError,
      };
    }

    if (hasPending) {
      return {
        success: false,
        error:
          "You have already submitted an application for this job. Please wait for the employer's response.",
      };
    }

    const db = getDb();
    const applicationsCollection = "Applications";

    // Create a new document with auto-generated ID
    const applicationRef = db.collection(applicationsCollection).doc();

    // Add timestamps
    const applicationWithMetadata = {
      ...application,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      status: application.status || ApplicationStatus.PENDING,
    };

    // Create the application document
    await applicationRef.set(applicationWithMetadata);

    // Send email notification
    try {
      const { job } = await getJobById(application.job_id);
      const userRecord = await admin.auth().getUser(application.user_id);

      if (job && userRecord && userRecord.email) {
        const { subject, html } = getEmailTemplate(
          ApplicationStatus.PENDING,
          job.title,
          userRecord.displayName || "Candidate",
          job.company_name || "Hiring Team"
        );

        await sendEmail({
          to: userRecord.email,
          subject,
          html,
        });
      }
    } catch (emailError) {
      console.error("Failed to send application received email:", emailError);
    }

    return {
      success: true,
      applicationId: applicationRef.id,
    };
  } catch (error) {
    console.error("Error creating application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Updates an existing application in Firestore
 */
export async function updateApplication(
  applicationId: string,
  applicationData: Partial<Application>,
  userId?: string
): Promise<ApplicationResponse> {
  try {
    const db = getDb();
    const applicationsCollection = "Applications";

    // Reference to the application document
    const applicationRef = db
      .collection(applicationsCollection)
      .doc(applicationId);

    // Get the current application data
    const applicationSnapshot = await applicationRef.get();

    if (!applicationSnapshot.exists) {
      return {
        success: false,
        error: "Application not found",
      };
    }

    // If user ID is provided, check if the application belongs to that user
    if (userId) {
      const currentData = applicationSnapshot.data();
      if (currentData?.user_id !== userId) {
        return {
          success: false,
          error: "You don't have permission to update this application",
        };
      }
    }

    // Add update timestamp
    const dataToUpdate = {
      ...applicationData,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update the application
    await applicationRef.update(dataToUpdate);

    return { success: true };
  } catch (error) {
    console.error("Error updating application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Gets an application by ID from Firestore
 */
export async function getApplicationById(
  applicationId: string
): Promise<{ application: Application | null; error?: string }> {
  try {
    const db = getDb();
    const applicationsCollection = "Applications";

    // Reference to the application document
    const applicationRef = db
      .collection(applicationsCollection)
      .doc(applicationId);

    // Get the application document
    const applicationSnapshot = await applicationRef.get();

    if (!applicationSnapshot.exists) {
      return { application: null, error: "Application not found" };
    }

    // Get the raw data
    const rawData = applicationSnapshot.data();

    // Add the ID to the application data
    const applicationWithId = {
      id: applicationId,
      ...rawData,
    };

    // Convert timestamps to serializable format
    const applicationData = convertTimestamps(applicationWithId) as Application;

    return { application: applicationData };
  } catch (error) {
    console.error("Error getting application:", error);
    return {
      application: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Deletes an application from Firestore
 */
export async function deleteApplication(
  applicationId: string,
  userId?: string
): Promise<ApplicationResponse> {
  try {
    const db = getDb();
    const applicationsCollection = "Applications";

    // Reference to the application document
    const applicationRef = db
      .collection(applicationsCollection)
      .doc(applicationId);

    // Get the current application data to check ownership
    const applicationSnapshot = await applicationRef.get();

    if (!applicationSnapshot.exists) {
      return {
        success: false,
        error: "Application not found",
      };
    }

    // If user ID is provided, check if the application belongs to that user
    if (userId) {
      const currentData = applicationSnapshot.data();
      if (currentData?.user_id !== userId) {
        return {
          success: false,
          error: "You don't have permission to delete this application",
        };
      }
    }

    // Delete the application
    await applicationRef.delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Lists applications based on filters
 */
export async function listApplications(
  filterParams: ApplicationFilterParams
): Promise<ApplicationsResponse> {
  try {
    const db = getDb();
    const applicationsCollection = "Applications";
    const { jobId, userId, status, limit = 20 } = filterParams;
    // Create base query
    let query = db.collection(applicationsCollection).limit(limit);

    if (userId) {
      query = query.where("user_id", "==", userId);
    }

    if (jobId) {
      query = query.where("job_id", "==", jobId);
    }

    if (status) {
      query = query.where("status", "==", status);
    }

    // Execute the query
    const querySnapshot = await query.get();

    // Process the results
    const applications: Application[] = [];
    querySnapshot.forEach((doc) => {
      const rawData = doc.data();
      const applicationWithId = {
        id: doc.id,
        ...rawData,
      };
      const applicationData = convertTimestamps(
        applicationWithId
      ) as Application;
      applications.push(applicationData);
    });

    return { applications };
  } catch (error) {
    console.error("Error listing applications:", error);
    return {
      applications: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get applications submitted for a specific job
 */
export async function getJobApplications(
  jobId: string,
  userId?: string,
  limit: number = 20,
  status?: ApplicationStatus
): Promise<ApplicationsResponse> {
  return listApplications({ jobId, userId, limit, status });
}

/**
 * Get applications submitted by a specific user
 */
export async function getUserApplications(
  userId: string,
  limit: number = 20,
  status?: ApplicationStatus
): Promise<ApplicationsResponse> {
  return listApplications({ userId, limit, status });
}

/**
 * Updates the status of an application
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  userId?: string
): Promise<ApplicationResponse> {
  try {
    // Make sure we have a valid status
    if (!status || !Object.values(ApplicationStatus).includes(status)) {
      return {
        success: false,
        error: "Invalid application status",
      };
    }

    // Create a valid update payload with just the status
    const updateData: Partial<Application> = { status };

    // Call updateApplication with the validated payload
    const updateResult = await updateApplication(
      applicationId,
      updateData,
      userId
    );

    // If update was successful, send email notification
    if (updateResult.success) {
      try {
        // Get application details to find user and job
        const { application } = await getApplicationById(applicationId);

        if (application) {
          // Get job details
          const { job } = await getJobById(application.job_id);

          // Get user details (email)
          const userRecord = await admin.auth().getUser(application.user_id);

          if (job && userRecord && userRecord.email) {
            const { subject, html } = getEmailTemplate(
              status,
              job.title,
              userRecord.displayName || "Candidate",
              job.company_name || "Hiring Team"
            );

            await sendEmail({
              to: userRecord.email,
              subject,
              html,
            });
          }
        }
      } catch (emailError) {
        // Log error but don't fail the status update
        console.error("Failed to send status update email:", emailError);
      }
    }

    return updateResult;
  } catch (error) {
    console.error("Error updating application status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Check if a user has already applied to a job
 */
export async function hasUserAppliedToJob(
  userId: string,
  jobId: string
): Promise<{ hasApplied: boolean; error?: string }> {
  try {
    const { applications, error } = await listApplications({
      userId,
      jobId,
      limit: 1,
    });

    if (error) {
      return { hasApplied: false, error };
    }

    return { hasApplied: applications.length > 0 };
  } catch (error) {
    console.error("Error checking if user applied to job:", error);
    return {
      hasApplied: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Check if a user has a pending application for a job
 */
export async function hasPendingApplication(
  userId: string,
  jobId: string
): Promise<{ hasPending: boolean; application?: Application; error?: string }> {
  try {
    const { applications, error } = await listApplications({
      userId,
      jobId,
      status: ApplicationStatus.PENDING,
      limit: 1,
    });

    if (error) {
      return { hasPending: false, error };
    }

    if (applications.length > 0) {
      return { hasPending: true, application: applications[0] };
    }

    return { hasPending: false };
  } catch (error) {
    console.error("Error checking for pending application:", error);
    return {
      hasPending: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Uploads a resume file to Firebase Storage from the server side
 */
export async function uploadResumeFile(
  userId: string,
  fileName: string,
  fileBuffer: ArrayBuffer,
  fileType: string
): Promise<{ url: string; success: boolean; error?: string }> {
  try {
    // Get storage instance
    const storage = getStorage();
    const bucket = storage.bucket(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    );

    // Create a unique file path
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `resumes/${userId}/${timestamp}-${safeFileName}`;

    // Create a file reference
    const file = bucket.file(filePath);

    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(fileBuffer);

    // Set the appropriate content type
    const options = {
      metadata: {
        contentType: fileType,
        metadata: {
          userId: userId,
          uploadedAt: timestamp,
        },
      },
    };

    // Upload the file - create a writable stream and pipe the buffer to it
    return new Promise((resolve, reject) => {
      const blobStream = file.createWriteStream(options);

      blobStream.on("error", (error) => {
        console.error("Error uploading file to Firebase Storage:", error);
        reject(error);
      });

      blobStream.on("finish", async () => {
        try {
          // Make the file publicly accessible
          await file.makePublic();

          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

          resolve({ url: publicUrl, success: true });
        } catch (error) {
          console.error("Error making file public:", error);
          reject(error);
        }
      });

      // Write the buffer to the stream and end it
      blobStream.end(buffer);
    });
  } catch (error) {
    console.error("Error uploading resume file:", error);
    return {
      url: "",
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload resume",
    };
  }
}
