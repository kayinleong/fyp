import { FirestoreTimestamp } from "./base";

export interface Profile {
    id: string;
    user_id: string;
    name: string;
    gender: number;
    university: string;
    role?: "GUEST" | "COMPANY"; // Hidden field for user role
    created_at?: string; // ISO string format for client use
    updated_at?: string; // ISO string format for client use
}

// For internal use with Firestore
export interface FirestoreProfile extends Omit<Profile, 'created_at' | 'updated_at'> {
    created_at?: FirestoreTimestamp;
    updated_at?: FirestoreTimestamp;
}