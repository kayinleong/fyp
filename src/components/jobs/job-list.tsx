import { filterJobs, listJobs } from "@/lib/actions/job.action";
import { JobStatus } from "@/lib/domains/jobs.domain";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { formatCurrency, normalizeCurrency } from "@/lib/utils";

export default async function JobList({
  searchParams,
}: {
  searchParams?: Promise<{
    remote?: string;
    minSalary?: string;
    maxSalary?: string;
    location?: string;
    company?: string;
    skills?: string;
    jobType?: string;
    currency?: string;
  }>;
}) {
  // Await searchParams if it's a Promise (Next.js 15+)
  const params = searchParams ? await searchParams : undefined;
  
  // Handle either filtering or listing all jobs
  const { jobs, error } =
    params && Object.keys(params).length > 0
      ? await filterJobs({
          isRemote: params.remote === "true",
          minSalary: params.minSalary
            ? parseInt(params.minSalary)
            : undefined,
          maxSalary: params.maxSalary
            ? parseInt(params.maxSalary)
            : undefined,
          location: params.location || undefined,
          company: params.company || undefined,
          skills: params.skills
            ? params.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
          jobType: params.jobType || undefined,
              currency: params.currency || undefined,
          status: JobStatus.OPEN,
        })
      : await listJobs(20, JobStatus.OPEN);

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading jobs: {error}
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <h3 className="text-xl font-medium mb-2">No jobs available</h3>
        <p className="text-muted-foreground">
          Try adjusting your filter criteria or check back later for new
          opportunities
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-medium">{job.title}</h3>
              <p className="text-muted-foreground">
                {job.company_name} • {job.company_location}
                {job.is_remote && " • Remote"}
              </p>
              <p className="text-sm font-medium mt-1 text-slate-600">
                {formatCurrency(
                  job.minimum_salary,
                  normalizeCurrency(job.currency) || job.currency
                )} - {formatCurrency(
                  job.maximum_salary,
                  normalizeCurrency(job.currency) || job.currency
                )}
              </p>
            </div>
            <Link href={`/jobs/${job.id}`}>
              <Button>View Job</Button>
            </Link>
          </div>

          <div className="mt-4">
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {job.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {job.required_skills &&
              Object.values(job.required_skills)
                .slice(0, 3)
                .map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
            {job.required_skills &&
              Object.values(job.required_skills).length > 3 && (
                <Badge variant="outline">
                  +{Object.values(job.required_skills).length - 3} more
                </Badge>
              )}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            {job.created_at &&
              `Posted ${formatDistanceToNow(new Date(job.created_at))} ago`}
          </div>
        </div>
      ))}
    </div>
  );
}

export function JobListSkeleton() {
  return (
    <div className="space-y-4">
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="flex flex-wrap gap-2 mt-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        ))}
    </div>
  );
}
