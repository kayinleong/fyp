/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { Resume, ResumeSecurityOptions } from "@/lib/domains/resume.domain";
import admin from "@/lib/firebase/server";
import { convertTimestamps } from "../timestamp";

// Helper function to get Firestore instance
function getDb() {
  return getFirestore();
}

interface ResumeResponse {
  success: boolean;
  error?: string;
  resumeId?: string;
}

interface ResumesResponse {
  resumes: Resume[];
  error?: string;
}

/**
 * Uploads a resume file to Firebase Storage
 */
async function uploadResumeFile(
  userId: string,
  file: File
): Promise<{
  url: string;
  filePath: string;
  success: boolean;
  error?: string;
}> {
  try {
    const storage = getStorage();
    const bucket = storage.bucket(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    );

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `shared_resumes/${userId}/${timestamp}-${safeFileName}`;
    const fileRef = bucket.file(filePath);

    const buffer = Buffer.from(await file.arrayBuffer());

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          userId: userId,
          uploadedAt: timestamp,
        },
      },
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return { url: publicUrl, filePath, success: true };
  } catch (error) {
    console.error("Error uploading resume file:", error);
    return {
      url: "",
      filePath: "",
      success: false,
      error: "Failed to upload file",
    };
  }
}

/**
 * Creates a new resume share
 */
export async function createResume(
  userId: string,
  formData: FormData,
  securityOptions: ResumeSecurityOptions
): Promise<ResumeResponse> {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Upload file
    const uploadResult = await uploadResumeFile(userId, file);
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    const db = getDb();
    const resumesCollection = "Resumes";
    const resumeRef = db.collection(resumesCollection).doc();

    const resumeData = {
      id: resumeRef.id,
      userId,
      fileName: file.name,
      filePath: uploadResult.filePath,
      publicUrl: uploadResult.url,
      securityOptions,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await resumeRef.set(resumeData);

    return { success: true, resumeId: resumeRef.id };
  } catch (error) {
    console.error("Error creating resume:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all resumes for a user
 */
export async function getUserResumes(userId: string): Promise<ResumesResponse> {
  try {
    const db = getDb();
    const snapshot = await db
      .collection("Resumes")
      .where("userId", "==", userId)
      .orderBy("created_at", "desc")
      .get();

    const resumes: Resume[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      resumes.push(convertTimestamps({ id: doc.id, ...data }) as Resume);
    });

    return { resumes };
  } catch (error) {
    console.error("Error getting user resumes:", error);
    return { resumes: [], error: "Failed to fetch resumes" };
  }
}

/**
 * Get a single resume by ID
 */
export async function getResumeById(
  resumeId: string
): Promise<{ resume: Resume | null; error?: string }> {
  try {
    const db = getDb();
    const doc = await db.collection("Resumes").doc(resumeId).get();

    if (!doc.exists) {
      return { resume: null, error: "Resume not found" };
    }

    const resume = convertTimestamps({ id: doc.id, ...doc.data() }) as Resume;
    return { resume };
  } catch (error) {
    console.error("Error getting resume:", error);
    return { resume: null, error: "Failed to fetch resume" };
  }
}

/**
 * Update resume security options or file
 */
export async function updateResume(
  resumeId: string,
  userId: string,
  data: { securityOptions?: ResumeSecurityOptions; file?: FormData }
): Promise<ResumeResponse> {
  try {
    const db = getDb();
    const resumeRef = db.collection("Resumes").doc(resumeId);
    const doc = await resumeRef.get();

    if (!doc.exists) {
      return { success: false, error: "Resume not found" };
    }

    if (doc.data()?.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const updates: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (data.securityOptions) {
      updates.securityOptions = data.securityOptions;
    }

    if (data.file) {
      const file = data.file.get("file") as File;
      if (file) {
        // Upload new file
        const uploadResult = await uploadResumeFile(userId, file);
        if (!uploadResult.success) {
          return { success: false, error: uploadResult.error };
        }

        // Delete old file (optional, but good practice)
        const oldFilePath = doc.data()?.filePath;
        if (oldFilePath) {
          try {
            await getStorage()
              .bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
              .file(oldFilePath)
              .delete();
          } catch (e) {
            console.warn("Failed to delete old file:", e);
          }
        }

        updates.fileName = file.name;
        updates.filePath = uploadResult.filePath;
        updates.publicUrl = uploadResult.url;
      }
    }

    await resumeRef.update(updates);

    return { success: true };
  } catch (error) {
    console.error("Error updating resume:", error);
    return { success: false, error: "Failed to update resume" };
  }
}

/**
 * Delete a resume
 */
export async function deleteResume(
  resumeId: string,
  userId: string
): Promise<ResumeResponse> {
  try {
    const db = getDb();
    const resumeRef = db.collection("Resumes").doc(resumeId);
    const doc = await resumeRef.get();

    if (!doc.exists) {
      return { success: false, error: "Resume not found" };
    }

    if (doc.data()?.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete file from storage
    const filePath = doc.data()?.filePath;
    if (filePath) {
      try {
        await getStorage()
          .bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
          .file(filePath)
          .delete();
      } catch (e) {
        console.warn("Failed to delete file from storage:", e);
      }
    }

    await resumeRef.delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting resume:", error);
    return { success: false, error: "Failed to delete resume" };
  }
}
