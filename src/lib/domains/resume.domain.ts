import { FirestoreTimestamp } from "./base";

export interface Resume {
    id: string;
    userId: string;
    fileName: string;
    filePath: string; // Storage path
    publicUrl: string;
    securityOptions: ResumeSecurityOptions;
    createdAt?: string;
    updatedAt?: string;
}

export interface ResumeSecurityOptions {
    oneTimeView: boolean;
    timeLimited: boolean;
    expirationDate?: string | null; // ISO string
    passwordProtected: boolean;
    password?: string | null;
}

export interface FirestoreResume extends Omit<Resume, 'createdAt' | 'updatedAt'> {
    created_at?: FirestoreTimestamp;
    updated_at?: FirestoreTimestamp;
}
