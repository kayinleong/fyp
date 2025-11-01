"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  createApplication,
  uploadResumeFile,
} from "@/lib/actions/application.action";
import {
  Application,
  ApplicationStatus,
} from "@/lib/domains/applications.domain";
import { getProfileById } from "@/lib/actions/profile.action";
import { Progress } from "@/components/ui/progress";

interface ApplicationFormProps {
  jobId: string;
}

export default function ApplicationForm({ jobId }: ApplicationFormProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [experience, setExperience] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Status states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch user profile when user is available
  useEffect(() => {
    async function fetchUserProfile() {
      if (user) {
        setIsLoadingProfile(true);
        try {
          const { profile } = await getProfileById(user.uid);
          setFullName(profile!.name);
        } catch (err) {
          console.error("Error fetching user profile:", err);
          // In case of error, still try to use displayName
          setFullName(user.displayName || "");
        } finally {
          setIsLoadingProfile(false);
        }
      }
    }

    fetchUserProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError("");

    // Check if user is logged in
    if (!user) {
      setError("You must be logged in to apply for jobs");
      return;
    }

    // Validate form inputs
    if (!phone) {
      setError("Phone number is required");
      return;
    }

    if (!experience) {
      setError("Years of experience is required");
      return;
    }

    // Check if resume is selected
    if (!resumeFile) {
      setError("Please upload your resume");
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload resume to server which will handle Firebase Storage upload
      let resumeUrl = "";
      if (resumeFile) {
        try {
          // Start upload progress indication
          setIsUploading(true);
          setUploadProgress(10);

          // Convert file to ArrayBuffer for server upload
          const fileBuffer = await resumeFile.arrayBuffer();

          // Update progress to show we've read the file and sending it
          setUploadProgress(30);

          // Use server action to upload file
          const uploadResult = await uploadResumeFile(
            user.uid,
            resumeFile.name,
            fileBuffer,
            resumeFile.type
          );

          // Update progress to show upload is complete
          setUploadProgress(100);

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || "Failed to upload resume");
          }

          resumeUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Resume upload error:", uploadError);
          setError("Failed to upload resume. Please try again.");
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        } finally {
          // Hide the progress bar after a moment
          setTimeout(() => {
            setIsUploading(false);
          }, 500);
        }
      }

      // Convert experience string to number
      let yearsOfExperience = 0;
      switch (experience) {
        case "0-1":
          yearsOfExperience = 1;
          break;
        case "1-3":
          yearsOfExperience = 2;
          break;
        case "3-5":
          yearsOfExperience = 4;
          break;
        case "5-10":
          yearsOfExperience = 7;
          break;
        case "10+":
          yearsOfExperience = 10;
          break;
        default:
          yearsOfExperience = 0;
      }

      // Create the application in Firestore with the resume URL
      const response = await createApplication({
        job_id: jobId,
        user_id: user.uid,
        phone_number: phone,
        year_of_experience: yearsOfExperience,
        resume_path: resumeUrl, // Use the Firebase Storage URL from server
        additional_information: additionalInfo,
        status: ApplicationStatus.PENDING,
      } as Application);

      if (response.success) {
        setSuccess(true);

        // Give user a moment to see success message before redirecting
        setTimeout(() => {
          router.push("/applications");
        }, 2000);
      } else {
        setError(response.error || "Failed to submit application");
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user isn't logged in and we've finished loading auth state, show login prompt
  if (!isLoading && !user) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to apply for this job.
          </AlertDescription>
        </Alert>
        <Button
          className="w-full"
          onClick={() => router.push(`/login?redirect=/jobs/${jobId}`)}
        >
          Sign In to Apply
        </Button>
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">
          Application Submitted
        </AlertTitle>
        <AlertDescription className="text-green-700">
          Your application has been successfully submitted. You will be
          redirected to your applications page.
        </AlertDescription>
      </Alert>
    );
  }

  // Show loading indicator while fetching profile
  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading your profile...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Display user's name from profile */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" value={fullName} disabled className="bg-muted/50" />
        {!fullName && (
          <p className="text-xs text-amber-600">
            Your name is not set in your profile
          </p>
        )}
      </div>

      {/* Display user's email from Firebase Auth */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user?.email || ""}
          disabled
          className="bg-muted/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(123) 456-7890"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Please verify your phone number is correct
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">Years of Experience</Label>
        <Select value={experience} onValueChange={setExperience} required>
          <SelectTrigger id="experience">
            <SelectValue placeholder="Select experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-1">0-1 years</SelectItem>
            <SelectItem value="1-3">1-3 years</SelectItem>
            <SelectItem value="3-5">3-5 years</SelectItem>
            <SelectItem value="5-10">5-10 years</SelectItem>
            <SelectItem value="10+">10+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resume">Resume</Label>
        <div className="flex items-center gap-2">
          <Input
            id="resume"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setResumeFile(e.target.files[0]);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("resume")?.click()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {resumeFile ? resumeFile.name : "Upload Resume"}
          </Button>
        </div>

        {/* Show upload progress bar when uploading */}
        {isUploading && (
          <div className="mt-2">
            <p className="text-xs text-primary mb-1">Uploading resume...</p>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Accepted formats: PDF, DOC, DOCX (Max 5MB)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional-info">
          Additional Information (Optional)
        </Label>
        <Textarea
          id="additional-info"
          placeholder="Tell us why you're a good fit for this position..."
          rows={4}
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Application"
        )}
      </Button>
    </form>
  );
}
