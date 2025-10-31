export interface FacialData {
  userId: string;
  faceDescriptor: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FacialRecognitionResult {
  success: boolean;
  confidence?: number;
  error?: string;
}

export interface FacialScanResult {
  faceDescriptor: Float32Array | null;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type FacialRecognitionMode = "register" | "verify";

export interface FacialRecognitionConfig {
  threshold: number; // Similarity threshold (0-1, lower = stricter)
  maxAttempts: number;
  timeoutMs: number;
}
