"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeDFaceProps {
  isSpeaking: boolean;
  rotation?: { x: number; y: number; z: number };
  eyePosition?: { x: number; y: number };
}

export default function ThreeDFace({
  isSpeaking,
  rotation,
  eyePosition,
}: ThreeDFaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const faceGroupRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  const isSpeakingRef = useRef(isSpeaking);
  const rotationRef = useRef(rotation);
  const eyePositionRef = useRef(eyePosition);
  const frameIdRef = useRef<number>(0);

  // Update ref when prop changes
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    eyePositionRef.current = eyePosition;
  }, [eyePosition]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f9ff); // Light blue background

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    // camera.position.y = -0.5; // Removed this, we will move the group instead

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Face Group
    const faceGroup = new THREE.Group();
    scene.add(faceGroup);
    faceGroupRef.current = faceGroup;

    // Head (Composite shape for more human look)
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Blue-500
      roughness: 0.5,
      metalness: 0.1,
    });

    // Cranium (Top)
    const craniumGeometry = new THREE.SphereGeometry(1.4, 32, 32);
    const cranium = new THREE.Mesh(craniumGeometry, skinMaterial);
    cranium.position.y = 0.4;
    faceGroup.add(cranium);

    // Jaw/Cheeks (Bottom)
    const jawGeometry = new THREE.CylinderGeometry(1.35, 0.8, 1.8, 32);
    const jaw = new THREE.Mesh(jawGeometry, skinMaterial);
    jaw.position.y = -0.6;
    jaw.scale.z = 0.85; // Slightly flattened front-to-back
    faceGroup.add(jaw);

    // Neck
    const neckGeometry = new THREE.CylinderGeometry(0.55, 0.7, 1.2, 32);
    const neck = new THREE.Mesh(neckGeometry, skinMaterial);
    neck.position.y = -1.8;
    faceGroup.add(neck);

    // Hair (Stylized)
    const hairGeometry = new THREE.SphereGeometry(1.45, 32, 32);
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Dark blue
      roughness: 0.9,
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 0.5;
    hair.position.z = -0.2;
    hair.scale.set(1.05, 1.05, 1.05);
    faceGroup.add(hair);

    // Shared Eye Resources
    const scleraGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const scleraMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilGeometry = new THREE.SphereGeometry(0.12, 32, 32);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    // Eyes Group (White sclera + Pupil)
    const createEye = (x: number) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(x, 0.3, 1.35); // Moved forward to z=1.35

      // Sclera (White part)
      const sclera = new THREE.Mesh(scleraGeometry, scleraMaterial);
      eyeGroup.add(sclera);

      // Pupil (Black part)
      const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      pupil.position.z = 0.25; // Push forward
      eyeGroup.add(pupil);

      return eyeGroup;
    };

    const leftEyeGroup = createEye(-0.6);
    faceGroup.add(leftEyeGroup);
    leftEyeRef.current = leftEyeGroup as unknown as THREE.Mesh; // Casting for ref compatibility

    const rightEyeGroup = createEye(0.6);
    faceGroup.add(rightEyeGroup);
    rightEyeRef.current = rightEyeGroup as unknown as THREE.Mesh;

    // Eyebrows
    const eyebrowGeometry = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8);
    const eyebrowMaterial = new THREE.MeshStandardMaterial({ color: 0x1e3a8a }); // Dark blue

    const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    leftEyebrow.rotation.z = Math.PI / 2;
    leftEyebrow.position.set(-0.6, 0.7, 1.45); // Moved forward
    faceGroup.add(leftEyebrow);

    const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    rightEyebrow.rotation.z = Math.PI / 2;
    rightEyebrow.position.set(0.6, 0.7, 1.45); // Moved forward
    faceGroup.add(rightEyebrow);

    // Nose
    const noseGeometry = new THREE.ConeGeometry(0.15, 0.5, 32);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x2563eb }); // Slightly darker blue
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0, 1.6); // Moved forward
    nose.rotation.x = Math.PI / 2; // Point forward
    faceGroup.add(nose);

    // Ears
    const earGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });

    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.scale.set(0.5, 1, 0.5);
    leftEar.position.set(-1.5, 0, 0);
    faceGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.scale.set(0.5, 1, 0.5);
    rightEar.position.set(1.5, 0, 0);
    faceGroup.add(rightEar);

    // Mouth (Capsule for better shape)
    const mouthGeometry = new THREE.CapsuleGeometry(0.1, 0.6, 4, 8);
    const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x1e40af });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.rotation.z = Math.PI / 2;
    mouth.position.set(0, -0.6, 1.45); // Moved forward
    faceGroup.add(mouth);
    mouthRef.current = mouth;

    // Blinking State
    const blinkState = {
      isBlinking: false,
      blinkStartTime: 0,
      nextBlinkTime: Date.now() + Math.random() * 3000 + 2000,
    };

    // Animation Loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const now = Date.now();

      if (faceGroupRef.current) {
        // Gentle floating animation
        const floatY = Math.sin(now * 0.002) * 0.1 + 0.5; // Add 0.5 offset to move head up

        // Recruiter Behavior:
        // Instead of mirroring, the head reacts subtly to the user's movement
        // and maintains a "listening" posture.

        let targetX = 0;
        let targetY = 0;
        let targetZ = 0;

        if (rotationRef.current) {
          // Dampen the user's movement significantly (e.g., 15% influence)
          // This makes the recruiter look attentive but not like a mimic
          const influence = 0.15;

          // Add some autonomous "alive" movement (breathing/shifting)
          const aliveX = Math.sin(now * 0.001) * 0.05;
          const aliveY = Math.cos(now * 0.0008) * 0.05;

          targetX = rotationRef.current.x * influence + aliveX;
          targetY = rotationRef.current.y * influence + aliveY;
          targetZ = rotationRef.current.z * influence * 0.5; // Very little roll
        } else {
          // Idle animation if no tracking data
          targetY = Math.sin(now * 0.001) * 0.1;
        }

        // Smoothly interpolate to target rotation
        faceGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          faceGroupRef.current.rotation.x,
          targetX,
          0.05
        );
        faceGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          faceGroupRef.current.rotation.y,
          targetY,
          0.05
        );
        faceGroupRef.current.rotation.z = THREE.MathUtils.lerp(
          faceGroupRef.current.rotation.z,
          targetZ,
          0.05
        );

        faceGroupRef.current.position.y = floatY;
      }

      // Blinking Logic
      if (!blinkState.isBlinking && now > blinkState.nextBlinkTime) {
        blinkState.isBlinking = true;
        blinkState.blinkStartTime = now;
      }

      if (blinkState.isBlinking) {
        const blinkDuration = 200; // ms
        const progress = (now - blinkState.blinkStartTime) / blinkDuration;

        if (progress >= 1) {
          blinkState.isBlinking = false;
          blinkState.nextBlinkTime = now + Math.random() * 3000 + 2000;
          if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
          if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
        } else {
          // Calculate blink scale (1 -> 0 -> 1)
          const blinkPhase = Math.sin(progress * Math.PI);
          const scale = 1 - blinkPhase; // Close then open

          if (leftEyeRef.current) leftEyeRef.current.scale.y = scale;
          if (rightEyeRef.current) rightEyeRef.current.scale.y = scale;
        }
      }

      // Eye Movement
      if (leftEyeRef.current && rightEyeRef.current) {
        if (eyePositionRef.current) {
          // Recruiter maintains eye contact but reacts slightly to user gaze
          const dampening = 0.05; // Reduced for much subtler movement
          const targetX = eyePositionRef.current.x * dampening;
          const targetY = eyePositionRef.current.y * dampening;

          leftEyeRef.current.position.x = THREE.MathUtils.lerp(
            leftEyeRef.current.position.x,
            -0.6 + targetX,
            0.1
          );
          leftEyeRef.current.position.y = THREE.MathUtils.lerp(
            leftEyeRef.current.position.y,
            0.3 + targetY,
            0.1
          );

          rightEyeRef.current.position.x = THREE.MathUtils.lerp(
            rightEyeRef.current.position.x,
            0.6 + targetX,
            0.1
          );
          rightEyeRef.current.position.y = THREE.MathUtils.lerp(
            rightEyeRef.current.position.y,
            0.3 + targetY,
            0.1
          );
        } else {
          // Reset to center
          leftEyeRef.current.position.x = THREE.MathUtils.lerp(
            leftEyeRef.current.position.x,
            -0.6,
            0.1
          );
          leftEyeRef.current.position.y = THREE.MathUtils.lerp(
            leftEyeRef.current.position.y,
            0.3,
            0.1
          );

          rightEyeRef.current.position.x = THREE.MathUtils.lerp(
            rightEyeRef.current.position.x,
            0.6,
            0.1
          );
          rightEyeRef.current.position.y = THREE.MathUtils.lerp(
            rightEyeRef.current.position.y,
            0.3,
            0.1
          );
        }
      }

      if (mouthRef.current) {
        if (isSpeakingRef.current) {
          // Simple mouth animation when speaking
          // Open and close mouth rapidly
          const openAmount = 0.1 + Math.abs(Math.sin(Date.now() * 0.02)) * 0.4;
          mouthRef.current.scale.x = openAmount * 5; // Scale vertical opening (Local X is World Y due to rotation)
        } else {
          // Closed mouth
          mouthRef.current.scale.x = 1;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameIdRef.current);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      // Cleanup Three.js resources
      craniumGeometry.dispose();
      jawGeometry.dispose();
      neckGeometry.dispose();
      hairGeometry.dispose();
      skinMaterial.dispose();
      hairMaterial.dispose();
      scleraGeometry.dispose();
      scleraMaterial.dispose();
      pupilGeometry.dispose();
      pupilMaterial.dispose();
      eyebrowGeometry.dispose();
      eyebrowMaterial.dispose();
      noseGeometry.dispose();
      noseMaterial.dispose();
      earGeometry.dispose();
      earMaterial.dispose();
      mouthGeometry.dispose();
      mouthMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px] rounded-xl overflow-hidden"
    />
  );
}
