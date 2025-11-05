"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  detectFaceDeepFace,
  verifyFacesDeepFace,
  checkDeepFaceHealth,
} from "@/lib/actions/deepface.action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { toast } from "sonner";

interface FacialRecognitionProps {
  mode: "register" | "verify";
  onComplete: (faceDescriptor: number[] | null, success?: boolean) => void;
  onCancel?: () => void;
  existingFaceDescriptor?: number[];
  userName?: string;
  fullPage?: boolean; // Whether to render as full page with background
}

export default function FacialRecognition({
  mode,
  onComplete,
  onCancel,
  existingFaceDescriptor,
  userName = "User",
  fullPage = false,
}: FacialRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initializingRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [step, setStep] = useState<
    "initializing" | "ready" | "scanning" | "processing"
  >("initializing");

  // Cleanup function
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Initialize camera
  const initCamera = useCallback(async () => {
    if (!serverReady || cameraReady || initializingRef.current) return;

    initializingRef.current = true;

    try {
      // Clean up any existing stream
      cleanup();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          setStep("ready");
          initializingRef.current = false;
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera. Please check permissions.");
      initializingRef.current = false;
    }
  }, [serverReady, cameraReady, cleanup]);

  // Check DeepFace server availability
  useEffect(() => {
    const checkServer = async () => {
      try {
        setStep("initializing");
        const healthResult = await checkDeepFaceHealth();

        if (healthResult.success && healthResult.data) {
          setServerReady(true);
          setIsLoading(false);
        } else {
          throw new Error(healthResult.error || "Server not ready");
        }
      } catch (error) {
        console.error("Error connecting to DeepFace server:", error);
        toast.error(
          "Failed to connect to facial recognition server. Please ensure you're logged in and the server is running."
        );
        setIsLoading(false);
      }
    };

    checkServer();
  }, []);

  // Initialize camera when server is ready
  useEffect(() => {
    if (serverReady && !cameraReady) {
      initCamera();
    }
  }, [serverReady, cameraReady, initCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const captureAndProcessFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setStep("scanning");

    try {
      // Capture image from video
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        toast.error("Could not get canvas context");
        setIsCapturing(false);
        setStep("ready");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      setStep("processing");

      if (mode === "register") {
        // For registration, detect face and get embedding
        const result = await detectFaceDeepFace(video);

        if (!result.success || !result.data) {
          toast.error(
            "No face detected. Please ensure your face is clearly visible."
          );
          setIsCapturing(false);
          setStep("ready");
          return;
        }

        // Return the face embedding
        onComplete(result.data);
        toast.success("Face registered successfully!");
      } else if (mode === "verify" && existingFaceDescriptor) {
        // For verification, first detect face and get embedding
        const detectResult = await detectFaceDeepFace(video);

        if (!detectResult.success || !detectResult.data) {
          toast.error(
            "No face detected. Please ensure your face is clearly visible."
          );
          setIsCapturing(false);
          setStep("ready");
          return;
        }

        // Compare the embeddings
        const verifyResult = await verifyFacesDeepFace(
          detectResult.data,
          existingFaceDescriptor
        );

        if (!verifyResult.success) {
          toast.error("Error during face verification. Please try again.");
          setIsCapturing(false);
          setStep("ready");
          return;
        }

        const isMatch = verifyResult.data?.isMatch;
        const confidence = verifyResult.data?.confidence || 0;

        if (isMatch) {
          toast.success("Face verification successful!");
          setIsCapturing(false);
          onComplete(null, true);
        } else {
          const confidencePercent = Math.round(confidence * 100);
          toast.error(
            `Face verification failed. Confidence: ${confidencePercent}%. Please try again.`
          );
          setIsCapturing(false);
          setStep("ready");
          onComplete(null, false);
        }
      }
    } catch (error) {
      console.error("Error processing face:", error);
      toast.error("Error processing face. Please try again.");
      setIsCapturing(false);
      setStep("ready");
    }
  };

  const cardContent = (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-blue-800">
          {mode === "register" ? "Complete Sign Up" : "Verify Your Identity"}
        </CardTitle>
        <CardDescription>
          {mode === "register"
            ? "Scan your face to finalize your new account."
            : `Scan your face to verify you are ${userName}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          {/* Camera Feed */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} // Mirror effect
            />

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {step === "initializing" && (
                <div className="bg-black/50 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <Icons.spinner className="w-4 h-4 animate-spin" />
                  <span>Initializing...</span>
                </div>
              )}

              {step === "scanning" && (
                <div className="bg-blue-500/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <Icons.spinner className="w-4 h-4 animate-spin" />
                  <span>Scanning face...</span>
                </div>
              )}

              {step === "processing" && (
                <div className="bg-green-500/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <Icons.spinner className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>

            {/* Face outline guide */}
            {step === "ready" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-blue-500 rounded-full w-48 h-48 opacity-50"></div>
              </div>
            )}
          </div>

          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ display: "none" }}
          />
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600">
          <p className="font-medium">Hold your device steady</p>
          <p>
            Position your face within the circle and look directly at the camera
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {mode === "verify" && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                cleanup();
                if (onCancel) onCancel();
              }}
              disabled={isCapturing || step === "processing"}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={captureAndProcessFace}
            disabled={isLoading || isCapturing || step !== "ready"}
          >
            {isCapturing || step === "processing" ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                {step === "scanning" ? "Scanning..." : "Processing..."}
              </>
            ) : (
              "Scan Face"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return fullPage ? (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      {cardContent}
    </div>
  ) : (
    cardContent
  );
}
