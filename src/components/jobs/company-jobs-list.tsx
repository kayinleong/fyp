import { listCompanyJobs } from "@/lib/actions/job.action";
import { Job, JobStatus } from "@/lib/domains/jobs.domain";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { validateSession } from "@/lib/actions/auth.action";

// Maps UI status strings to domain JobStatus values
const statusMap: Record<string, JobStatus | undefined> = {
  active: JobStatus.OPEN,
  draft: JobStatus.DRAFT,
  expired: JobStatus.EXPIRED,
  filled: JobStatus.FILLED,
  closed: JobStatus.CLOSED,
  // "all" is handled separately in the component
};

type CompanyJobsListProps = {
  status: string;
  limit?: number;
};

export default async function CompanyJobsList({
  status,
  limit = 20,
}: CompanyJobsListProps) {
  // Get current user from session
  const sessionResponse = await validateSession();
  const userId = sessionResponse.user?.uid;

  if (!userId) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
        <p className="text-muted-foreground mb-4">
          You need to be logged in to view your job listings.
        </p>
        <Button asChild>
          <Link href="/auth/login?redirect=/company/jobs">Log In</Link>
        </Button>
      </div>
    );
  }

  // Convert UI status to domain status
  const jobStatus = statusMap[status];

  // Fetch jobs using the user ID
  const { jobs, error } = await listCompanyJobs(
    userId,
    limit,
    jobStatus // If undefined (for "all"), the action will not filter by status
  );

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading jobs: {error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <h3 className="text-lg font-medium mb-2">No jobs found</h3>
        <p className="text-muted-foreground mb-4">
          {status === "active"
            ? "You don't have any active job listings."
            : status === "draft"
            ? "You don't have any job drafts."
            : status === "expired"
            ? "You don't have any expired job listings."
            : "You don't have any job listings yet."}
        </p>
        <Button asChild>
          <Link href="/company/jobs/new">Create your first job posting</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const statusColor: Record<JobStatus, string> = {
    [JobStatus.OPEN]: "bg-green-100 text-green-800",
    [JobStatus.DRAFT]: "bg-gray-100 text-gray-800",
    [JobStatus.CLOSED]: "bg-red-100 text-red-800",
    [JobStatus.EXPIRED]: "bg-yellow-100 text-yellow-800",
    [JobStatus.FILLED]: "bg-blue-100 text-blue-800",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{job.title}</h3>
            <p className="text-sm text-muted-foreground">
              {job.company_location} {job.is_remote && "• Remote"}
            </p>
          </div>
          <Badge className={statusColor[job.status]}>
            {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Badge variant="outline">{job.type}</Badge>
            <Badge variant="outline">
              {formatCurrency(job.minimum_salary)} -{" "}
              {formatCurrency(job.maximum_salary)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/company/jobs/${job.id}/applications`}>
                <FileSpreadsheet className="h-4 w-4" />
                <span className="sr-only">View applications</span>
              </Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/company/jobs/${job.id}`}>
                <span className="sr-only">View details</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
