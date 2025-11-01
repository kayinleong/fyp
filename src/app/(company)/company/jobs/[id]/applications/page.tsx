/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getJobById } from "@/lib/actions/job.action";
import { notFound } from "next/navigation";
import JobApplicationsContainer from "@/components/jobs/job-applications-container";

export default async function JobApplicationsPage({ params }: { params: any }) {
  // Fetch job data
  const { job, error: jobError } = await getJobById((await params).id);

  // If job not found, show 404
  if (!job || jobError) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/company/jobs"
        className="flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Job Listings
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">{job.title}</p>
        </div>
      </div>

      {/* Use the client component container to handle authentication and data fetching */}
      <JobApplicationsContainer jobId={(await params).id} />
    </div>
  );
}
