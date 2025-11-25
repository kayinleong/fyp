"use server";

import admin from "@/lib/firebase/server";
import { validateSession } from "@/lib/actions/auth.action";
import { InterviewFeedback } from "@/lib/domains/mock-interview.domain";

// Firestore reference
const db = admin.firestore();

/**
 * Converts Firestore timestamp to a serializable object
 */
function convertTimestampToSerializable(
  timestamp: admin.firestore.Timestamp | undefined
) {
  if (!timestamp) {
    return { seconds: 0, nanoseconds: 0 };
  }

  return {
    seconds: timestamp.seconds,
    nanoseconds: timestamp.nanoseconds,
  };
}

export interface MockInterviewHistoryItem {
  id: string;
  position: string;
  experience: string;
  overallScore: number;
  createdAt: { seconds: number; nanoseconds: number };
}

/**
 * Saves a mock interview result to Firestore
 */
export async function saveMockInterviewResult(
  setup: {
    name: string;
    position: string;
    experience: string;
  },
  questions: string[],
  responses: string[],
  feedback: InterviewFeedback
) {
  try {
    const sessionResponse = await validateSession();
    const userId = sessionResponse.user?.uid;

    if (!userId) {
      throw new Error("Authentication required");
    }

    const interviewData = {
      userId,
      name: setup.name,
      position: setup.position,
      experience: setup.experience,
      questions,
      responses,
      feedback,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("MockInterviews").add(interviewData);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving mock interview:", error);
    throw new Error("Failed to save mock interview");
  }
}

/**
 * Gets the list of mock interviews for the current user
 */
export async function getMockInterviewHistory() {
  try {
    const sessionResponse = await validateSession();
    const userId = sessionResponse.user?.uid;

    if (!userId) {
      throw new Error("Authentication required");
    }

    let snapshot;
    try {
      // Try query with orderBy (requires composite index)
      snapshot = await db
        .collection("MockInterviews")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();
    } catch (indexError: any) {
      // If index error, fallback to query without orderBy and sort in memory
      if (
        indexError?.code === 9 ||
        indexError?.message?.includes("index") ||
        indexError?.message?.includes("requires an index")
      ) {
        console.warn(
          "Composite index not found, using fallback query. Please create an index for MockInterviews collection with fields: userId (Ascending), createdAt (Descending)"
        );
        
        // Fallback: get all user's interviews and sort in memory
        snapshot = await db
          .collection("MockInterviews")
          .where("userId", "==", userId)
          .get();
      } else {
        throw indexError;
      }
    }

    if (snapshot.empty) {
      return [];
    }

    // Map and sort results
    const results = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = convertTimestampToSerializable(
        data.createdAt as admin.firestore.Timestamp
      );

      return {
        id: doc.id,
        position: data.position || "Unknown Position",
        experience: data.experience || "Unknown",
        overallScore: data.feedback?.overallScore || 0,
        createdAt: createdAt,
      };
    });

    // Sort by createdAt descending if we used fallback query
    results.sort((a, b) => {
      const timeA = a.createdAt.seconds || 0;
      const timeB = b.createdAt.seconds || 0;
      return timeB - timeA;
    });

    // Limit to 20 most recent
    return results.slice(0, 20);
  } catch (error) {
    console.error("Error fetching mock interview history:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to fetch mock interview history: ${errorMessage}`);
  }
}

/**
 * Gets a single mock interview by ID
 */
export async function getMockInterviewById(id: string) {
  try {
    const sessionResponse = await validateSession();
    const userId = sessionResponse.user?.uid;

    if (!userId) {
      throw new Error("Authentication required");
    }

    const doc = await db.collection("MockInterviews").doc(id).get();

    if (!doc.exists) {
      throw new Error("Mock interview not found");
    }

    const data = doc.data();

    // Verify the interview belongs to the current user
    if (data?.userId !== userId) {
      throw new Error("Unauthorized access to mock interview");
    }

    const createdAt = convertTimestampToSerializable(
      data?.createdAt as admin.firestore.Timestamp
    );

    return {
      id: doc.id,
      name: data?.name || "",
      position: data?.position || "",
      experience: data?.experience || "",
      questions: data?.questions || [],
      responses: data?.responses || [],
      feedback: data?.feedback || null,
      createdAt: createdAt,
    };
  } catch (error) {
    console.error("Error fetching mock interview:", error);
    throw new Error("Failed to fetch mock interview");
  }
}

