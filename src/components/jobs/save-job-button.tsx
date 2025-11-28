"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { saveJob, unsaveJob, isJobSaved } from "@/lib/actions/saved-jobs.action";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { Heart } from "lucide-react";

interface SaveJobButtonProps {
  jobId: string;
  className?: string;
}

export default function SaveJobButton({ jobId, className }: SaveJobButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user, profile } = useAuth();

  // Check if job is saved on mount
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || !profile) {
        setIsLoading(false);
        return;
      }

      // Only show for GUEST (job seeker) accounts
      if (profile.role !== "GUEST") {
        setIsLoading(false);
        return;
      }

      try {
        const { isSaved: saved } = await isJobSaved(jobId);
        setIsSaved(saved);
      } catch (error) {
        console.error("Error checking saved status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSavedStatus();
  }, [jobId, user, profile]);

  const handleSaveToggle = async () => {
    if (!user) {
      toast.error("Please log in to save jobs");
      return;
    }

    if (profile?.role !== "GUEST") {
      toast.error("Only job seekers can save jobs");
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        const result = await unsaveJob(jobId);
        if (result.success) {
          setIsSaved(false);
          toast.success("Job removed from saved jobs");
        } else {
          toast.error(result.error || "Failed to unsave job");
        }
      } else {
        const result = await saveJob(jobId);
        if (result.success) {
          setIsSaved(true);
          toast.success("Job saved successfully");
        } else {
          toast.error(result.error || "Failed to save job");
        }
      }
    } catch (error) {
      console.error("Error toggling save status:", error);
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // Don't show button if user is not logged in or is a company account
  if (isLoading || !user || profile?.role !== "GUEST") {
    return null;
  }

  return (
    <Button
      variant={isSaved ? "default" : "outline"}
      onClick={handleSaveToggle}
      disabled={isSaving}
      className={className}
    >
      {isSaving ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={`mr-2 h-4 w-4 ${isSaved ? "fill-current" : ""}`}
        />
      )}
      {isSaved ? "Saved" : "Save Job"}
    </Button>
  );
}

