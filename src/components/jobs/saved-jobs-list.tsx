/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import {
  getSavedJobsWithDetails,
  unsaveJob,
  getSavedJobs,
} from "@/lib/actions/saved-jobs.action";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Building,
  MapPin,
  Briefcase,
  DollarSign,
  Globe,
  Heart,
  Trash2,
} from "lucide-react";

interface SavedJobsListProps {
  userId: string;
}

export default function SavedJobsList({ userId }: SavedJobsListProps) {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removingJobId, setRemovingJobId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedJobsCount, setSavedJobsCount] = useState<number | null>(null);

  // Fetch count on mount
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { savedJobs: savedJobsList } = await getSavedJobs(userId);
        setSavedJobsCount(savedJobsList.length);
      } catch (error) {
        console.error("Error fetching saved jobs count:", error);
      }
    };
    fetchCount();
  }, [userId]);

  const fetchSavedJobs = async () => {
    setIsLoading(true);
    try {
      const { jobs, error } = await getSavedJobsWithDetails(userId);
      if (error) {
        toast.error(error);
      } else {
        setSavedJobs(jobs);
        setSavedJobsCount(jobs.length);
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      toast.error("Failed to load saved jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isExpanded) {
      // Only fetch when expanding for the first time
      if (savedJobs.length === 0) {
        fetchSavedJobs();
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleUnsave = async (jobId: string) => {
    setRemovingJobId(jobId);
    try {
      const result = await unsaveJob(jobId);
      if (result.success) {
        const updatedJobs = savedJobs.filter((job) => job.id !== jobId);
        setSavedJobs(updatedJobs);
        setSavedJobsCount(updatedJobs.length);
        toast.success("Job removed from saved jobs");
      } else {
        toast.error(result.error || "Failed to remove job");
      }
    } catch (error) {
      console.error("Error unsaving job:", error);
      toast.error("An error occurred");
    } finally {
      setRemovingJobId(null);
    }
  };

  const formatSalary = (min: number, max: number) => {
    return `RM ${min.toLocaleString()} - RM ${max.toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Saved Jobs
            {savedJobsCount !== null && savedJobsCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {savedJobsCount}
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" onClick={handleToggle} disabled={isLoading}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : isExpanded ? (
              "Hide Saved Jobs"
            ) : (
              "View Saved Jobs"
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Icons.spinner className="h-6 w-6 animate-spin" />
            </div>
          ) : savedJobs.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No saved jobs yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Save jobs you&apos;re interested in to view them here
              </p>
              <Button asChild className="mt-4">
                <Link href="/jobs">Browse Jobs</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link
                            href={`/jobs/${job.id}`}
                            className="text-lg font-semibold hover:text-blue-600 transition-colors"
                          >
                            {job.title}
                          </Link>
                          <div className="flex items-center text-muted-foreground mt-1">
                            <Building className="h-4 w-4 mr-1" />
                            <span>{job.company_name}</span>
                            <span className="mx-2">•</span>
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{job.company_location}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnsave(job.id)}
                          disabled={removingJobId === job.id}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          {removingJobId === job.id ? (
                            <Icons.spinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span>
                            {formatSalary(
                              job.minimum_salary,
                              job.maximum_salary
                            )}
                          </span>
                        </div>
                        {job.is_remote && (
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-1" />
                            <span>Remote</span>
                          </div>
                        )}
                      </div>

                      {job.required_skills && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(Object.values(job.required_skills) as string[])
                            .slice(0, 5)
                            .map((skill) => (
                              <Badge key={skill} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          {Object.values(job.required_skills).length > 5 && (
                            <Badge variant="outline">
                              +{Object.values(job.required_skills).length - 5}{" "}
                              more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-muted-foreground">
                          Saved{" "}
                          {job.saved_at
                            ? formatDistanceToNow(new Date(job.saved_at), {
                                addSuffix: true,
                              })
                            : "recently"}
                        </p>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/jobs/${job.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
