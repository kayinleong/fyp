import { FirestoreTimestamp } from "./base";

export interface Job {
    id: string;
    user_id: string;
    title: string;
    type: string;
    company_name: string;
    company_location: string;
    minimum_salary: number;
    maximum_salary: number;
    application_dateline?: Date | string;
    is_remote: boolean;
    description: string;
    requirements: string;
    benefits: string;
    required_skills: string[];
    status: JobStatus;
    created_at?: string;
    updated_at?: string;
}

export enum JobStatus {
    DRAFT = "DRAFT",
    OPEN = "OPEN",
    CLOSED = "CLOSED",
    EXPIRED = "EXPIRED",
    FILLED = "FILLED"
}

// For internal use with Firestore
export interface FirestoreJob extends Omit<Job, 'created_at' | 'updated_at' | 'application_dateline'> {
    created_at?: FirestoreTimestamp;
    updated_at?: FirestoreTimestamp;
    application_dateline?: FirestoreTimestamp;
}

