"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { getUserApplications } from "@/lib/actions/application.action";
import { getJobById } from "@/lib/actions/job.action";
import {
  Application,
  ApplicationStatus,
} from "@/lib/domains/applications.domain";
import { Job } from "@/lib/domains/jobs.domain";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ApplicationCard from "./application-card";

export default function UserApplicationsContainer() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobDetails, setJobDetails] = useState<Record<string, Job>>({});
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch applications for the current user
  const fetchApplications = useCallback(async () => {
    if (!user) return;

    setIsLoadingApplications(true);
    try {
      const { applications: fetchedApplications, error: applicationsError } =
        await getUserApplications(user.uid);

      if (applicationsError) {
        setError(applicationsError);
      } else {
        setApplications(fetchedApplications);

        // Fetch job details for each application
        const jobIds = new Set(fetchedApplications.map((app) => app.job_id));
        const jobDetailsMap: Record<string, Job> = {};

        for (const jobId of jobIds) {
          const { job } = await getJobById(jobId);
          if (job) {
            jobDetailsMap[jobId] = job;
          }
        }

        setJobDetails(jobDetailsMap);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Failed to load your applications");
    } finally {
      setIsLoadingApplications(false);
    }
  }, [user]);

  useEffect(() => {
    // Redirect if not authenticated after auth finishes loading
    if (!isLoading && !user) {
      router.push("/login?redirect=" + encodeURIComponent("/applications"));
      return;
    }

    // Fetch applications when user is available
    if (user) {
      fetchApplications();
    }
  }, [user, isLoading, router, fetchApplications]);

  // Get applications counts by status
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(
    (app) => app.status === ApplicationStatus.PENDING
  ).length;
  const interviewApplications = applications.filter(
    (app) => app.status === ApplicationStatus.INTERVIEW
  ).length;
  const offerApplications = applications.filter(
    (app) => app.status === ApplicationStatus.OFFER
  ).length;
  const rejectedApplications = applications.filter(
    (app) => app.status === ApplicationStatus.REJECTED
  ).length;

  // Show loading state
  if (isLoading || isLoadingApplications) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading your applications...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  // Show empty state
  if (applications.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-semibold mb-2">No applications found</h3>
        <p className="text-muted-foreground mb-6">
          You haven&apos;t applied to any jobs yet.
        </p>
        <button
          onClick={() => router.push("/jobs")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Browse Jobs
        </button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="all">
      <TabsList className="mb-6">
        <TabsTrigger value="all">All ({totalApplications})</TabsTrigger>
        <TabsTrigger value="pending">
          Pending ({pendingApplications})
        </TabsTrigger>
        <TabsTrigger value="interview">
          Interview ({interviewApplications})
        </TabsTrigger>
        <TabsTrigger value="offer">Offer ({offerApplications})</TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected ({rejectedApplications})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              job={jobDetails[application.job_id]}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="pending">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications
            .filter((app) => app.status === ApplicationStatus.PENDING)
            .map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                job={jobDetails[application.job_id]}
              />
            ))}
        </div>
      </TabsContent>

      <TabsContent value="interview">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications
            .filter((app) => app.status === ApplicationStatus.INTERVIEW)
            .map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                job={jobDetails[application.job_id]}
              />
            ))}
        </div>
      </TabsContent>

      <TabsContent value="offer">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications
            .filter((app) => app.status === ApplicationStatus.OFFER)
            .map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                job={jobDetails[application.job_id]}
              />
            ))}
        </div>
      </TabsContent>

      <TabsContent value="rejected">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications
            .filter((app) => app.status === ApplicationStatus.REJECTED)
            .map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                job={jobDetails[application.job_id]}
              />
            ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
