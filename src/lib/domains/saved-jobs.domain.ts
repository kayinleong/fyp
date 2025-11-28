import { FirestoreTimestamp } from "./base";

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  created_at?: string;
}

// For internal use with Firestore
export interface FirestoreSavedJob extends Omit<SavedJob, 'created_at'> {
  created_at?: FirestoreTimestamp;
}

