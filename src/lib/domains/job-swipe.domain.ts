import { FirestoreTimestamp } from "./base";

export interface JobSwipe {
    id: string;
    user_id: string;
    like_job_ids: string[];
    dislike_job_ids: string[];
}

// For internal use with Firestore
export interface FirestoreJob extends Omit<JobSwipe, 'created_at' | 'updated_at' | 'application_dateline'> {
    created_at?: FirestoreTimestamp;
    updated_at?: FirestoreTimestamp;
}