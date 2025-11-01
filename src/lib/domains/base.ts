// Firestore timestamp interface
export interface FirestoreTimestamp {
    seconds: number;
    nanoseconds: number;
    toDate: () => Date;
}