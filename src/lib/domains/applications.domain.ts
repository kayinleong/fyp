import { FirestoreTimestamp } from "./base";

export interface Application {
    id: string;
    job_id: string;
    user_id: string;
    phone_number: string;
    year_of_experience: number;
    resume_path: string;
    additional_information: string;
    status: ApplicationStatus;
    created_at?: string;
    updated_at?: string;
}

export enum ApplicationStatus {
    PENDING = 'PENDING',
    INTERVIEW = 'INTERVIEW',
    OFFER = 'OFFER',
    REJECTED = 'REJECTED',
}

export interface FirestoreApplication extends Omit<Application, 'created_at' | 'updated_at'> {
    created_at?: FirestoreTimestamp;
    updated_at?: FirestoreTimestamp;
}
