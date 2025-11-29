"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

interface HeadTrackerProps {
  onHeadMove: (rotation: { x: number; y: number; z: number }) => void;
  onEyeMove?: (position: { x: number; y: number }) => void;
  className?: string;
}

export default function HeadTracker({
  onHeadMove,
  onEyeMove,
  className,
}: HeadTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [debugStatus, setDebugStatus] = useState("Initializing...");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setDebugStatus("Loading models (High Accuracy)...");
        // Use jsDelivr CDN pointing to the weights directory of the main repo
        const MODEL_URL =
          "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

        await Promise.all([
          // Switch to SSD Mobilenet V1 for better accuracy (handles glasses better)
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          // Switch to full landmark model for better precision
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
        setDebugStatus("Models loaded. Starting camera...");
        console.log("Face API models loaded");
      } catch (error) {
        console.error("Error loading face-api models:", error);
        setDebugStatus(`Error loading models: ${error}`);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (!isModelLoaded) return;

    const startVideo = async () => {
      try {
        const constraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId } }
            : {},
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setDebugStatus("Camera active. Detecting face...");
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setDebugStatus("Error accessing webcam");
      }
    };

    startVideo();

    const videoElement = videoRef.current;
    let animationFrameId: number;

    const detectFace = async () => {
      if (!videoElement || videoElement.paused || videoElement.ended) {
        animationFrameId = requestAnimationFrame(detectFace);
        return;
      }

      try {
        // Use SSD Mobilenet V1 options
        const options = new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.5,
        });
        const detections = await faceapi
          .detectSingleFace(videoElement, options)
          .withFaceLandmarks(); // Uses full 68 point model by default

        if (detections) {
          setDebugStatus("Face detected!");
          const landmarks = detections.landmarks;
          const nose = landmarks.getNose()[3]; // Tip of nose
          const leftEye = landmarks.getLeftEye()[0]; // Outer corner
          const rightEye = landmarks.getRightEye()[3]; // Outer corner
          const jaw = landmarks.getJawOutline();
          const leftJaw = jaw[0];
          const rightJaw = jaw[16];
          const mouth = landmarks.getMouth()[0];

          // Calculate Roll (Z-axis rotation)
          // Angle between eyes
          const dX = rightEye.x - leftEye.x;
          const dY = rightEye.y - leftEye.y;
          const roll = Math.atan2(dY, dX);

          // Calculate Yaw (Y-axis rotation)
          // Ratio of nose position between jaw edges
          const distToLeft = nose.x - leftJaw.x;
          const distToRight = rightJaw.x - nose.x;
          const totalWidth = rightJaw.x - leftJaw.x;
          // 0.5 is center. < 0.5 looking left, > 0.5 looking right
          const yawRatio = (distToLeft - distToRight) / totalWidth;
          const yaw = (yawRatio - 0.0) * 1.5; // Scale factor

          // Calculate Pitch (X-axis rotation)
          // Ratio of nose to eye center vs nose to mouth
          // This is a rough approximation
          const eyeCenterY = (leftEye.y + rightEye.y) / 2;
          const noseY = nose.y;
          const mouthY = mouth.y;

          const eyeToNose = noseY - eyeCenterY;
          const noseToMouth = mouthY - noseY;

          const pitchRatio = eyeToNose / (noseToMouth + 0.1); // Avoid div by zero
          // Calibrate: assume 0.8 is neutral
          const pitch = (pitchRatio - 0.8) * 1.0;

          // Invert yaw to mirror movement
          onHeadMove({ x: pitch, y: -yaw, z: roll });

          // Calculate Eye Gaze (Approximate)
          if (onEyeMove) {
            // Use nose position relative to face center as a proxy for gaze
            // This is a simplification since we don't have iris tracking in this model
            const faceCenterX = (leftJaw.x + rightJaw.x) / 2;
            const faceCenterY = (nose.y + eyeCenterY) / 2;

            // Normalize to -1 to 1 range relative to video frame
            // Assuming video width ~320
            const gazeX = ((nose.x - faceCenterX) / (totalWidth / 2)) * 5;
            const gazeY = ((nose.y - faceCenterY) / (totalWidth / 2)) * 5;

            onEyeMove({ x: -gazeX, y: -gazeY });
          }
        } else {
          setDebugStatus("No face detected");
        }
      } catch (error) {
        console.error("Detection error:", error);
      }

      animationFrameId = requestAnimationFrame(detectFace);
    };

    detectFace();

    return () => {
      // Cleanup stream
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [isModelLoaded, onHeadMove, onEyeMove, selectedDeviceId]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-black ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror the video
      />

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
        <div className="text-[10px] text-white/80 px-2 py-1 rounded bg-black/40 backdrop-blur-sm">
          {debugStatus}
        </div>

        {devices.length > 0 && (
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="bg-black/40 backdrop-blur-sm border border-white/10 rounded px-2 py-1 text-[10px] text-white max-w-[120px] outline-none focus:border-blue-500"
          >
            {devices.map((device) => (
              <option
                key={device.deviceId}
                value={device.deviceId}
                className="bg-slate-900"
              >
                {device.label || `Camera ${devices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
