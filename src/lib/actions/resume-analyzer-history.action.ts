"use server";

import admin from "@/lib/firebase/server";

// Firestore reference
const db = admin.firestore();

/**
 * Converts Firestore timestamp to a serializable object
 */
function convertTimestampToSerializable(timestamp: FirebaseFirestore.Timestamp | undefined) {
    if (!timestamp) {
        return { seconds: 0, nanoseconds: 0 };
    }

    return {
        seconds: timestamp.seconds,
        nanoseconds: timestamp.nanoseconds
    };
}

/**
 * Gets the list of resume analyses
 */
export async function getResumeAnalysisHistory() {
    try {
        const snapshot = await db
            .collection("ResumeAnalysis")
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map((doc) => {
            const data = doc.data();
            // Convert Firestore timestamp to serializable object
            const createdAt = convertTimestampToSerializable(data.createdAt);

            return {
                id: doc.id,
                fileName: data.fileName,
                fileUrl: data.fileUrl,
                score: data.analysis.score,
                createdAt: createdAt,
            };
        });
    } catch (error) {
        console.error("Error fetching resume analysis history:", error);
        throw new Error("Failed to fetch resume analysis history");
    }
}

/**
 * Gets a single resume analysis by ID
 */
export async function getResumeAnalysisById(id: string) {
    try {
        const doc = await db.collection("ResumeAnalysis").doc(id).get();

        if (!doc.exists) {
            throw new Error("Resume analysis not found");
        }

        const data = doc.data();
        // Convert Firestore timestamp to serializable object
        const createdAt = convertTimestampToSerializable(data?.createdAt);

        return {
            id: doc.id,
            fileName: data?.fileName,
            fileUrl: data?.fileUrl,
            createdAt: createdAt,
            analysis: data?.analysis,
        };
    } catch (error) {
        console.error("Error fetching resume analysis:", error);
        throw new Error("Failed to fetch resume analysis");
    }
}
