"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { getJobApplications } from "@/lib/actions/application.action";
import {
  Application,
  ApplicationStatus,
} from "@/lib/domains/applications.domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobApplicationsList from "@/components/jobs/job-applications-list";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface JobApplicationsContainerProps {
  jobId: string;
}

export default function JobApplicationsContainer({
  jobId,
}: JobApplicationsContainerProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to prevent unnecessary re-renders
  const fetchApplications = useCallback(async () => {
    setIsLoadingApplications(true);
    try {
      // Pass user ID to ensure access control
      const { applications: fetchedApplications, error: applicationsError } =
        await getJobApplications(jobId);

      if (applicationsError) {
        setError(applicationsError);
      } else {
        setApplications(fetchedApplications);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Failed to load applications");
    } finally {
      setIsLoadingApplications(false);
    }
  }, [jobId]);

  useEffect(() => {
    // Redirect if not authenticated after auth finishes loading
    if (!isLoading && !user) {
      router.push(
        "/login?redirect=" +
          encodeURIComponent(`/company/jobs/${jobId}/applications`)
      );
      return;
    }

    // Fetch applications when user is available
    if (user) {
      fetchApplications();
    }
  }, [user, isLoading, jobId, router, fetchApplications]);

  // Count applications by status
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
        <p>Loading applications...</p>
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

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Application Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{totalApplications}</p>
              <p className="text-sm text-muted-foreground">
                Total Applications
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{pendingApplications}</p>
              <p className="text-sm text-muted-foreground">New</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{interviewApplications}</p>
              <p className="text-sm text-muted-foreground">Interview</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{offerApplications}</p>
              <p className="text-sm text-muted-foreground">Offer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All ({totalApplications})</TabsTrigger>
          <TabsTrigger value="pending">New ({pendingApplications})</TabsTrigger>
          <TabsTrigger value="interview">
            Interview ({interviewApplications})
          </TabsTrigger>
          <TabsTrigger value="offer">Offer ({offerApplications})</TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedApplications})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <JobApplicationsList
            status="all"
            jobId={jobId}
            applications={applications}
            onStatusChange={fetchApplications}
          />
        </TabsContent>

        <TabsContent value="pending">
          <JobApplicationsList
            status={ApplicationStatus.PENDING}
            jobId={jobId}
            applications={applications.filter(
              (app) => app.status === ApplicationStatus.PENDING
            )}
            onStatusChange={fetchApplications}
          />
        </TabsContent>

        <TabsContent value="interview">
          <JobApplicationsList
            status={ApplicationStatus.INTERVIEW}
            jobId={jobId}
            applications={applications.filter(
              (app) => app.status === ApplicationStatus.INTERVIEW
            )}
            onStatusChange={fetchApplications}
          />
        </TabsContent>

        <TabsContent value="offer">
          <JobApplicationsList
            status={ApplicationStatus.OFFER}
            jobId={jobId}
            applications={applications.filter(
              (app) => app.status === ApplicationStatus.OFFER
            )}
            onStatusChange={fetchApplications}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <JobApplicationsList
            status={ApplicationStatus.REJECTED}
            jobId={jobId}
            applications={applications.filter(
              (app) => app.status === ApplicationStatus.REJECTED
            )}
            onStatusChange={fetchApplications}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
