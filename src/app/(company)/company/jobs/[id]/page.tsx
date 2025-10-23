/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getJobById } from "@/lib/actions/job.action";
import { validateSession } from "@/lib/actions/auth.action";
import { notFound, redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditJobForm from "@/components/jobs/edit-job-form";

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "Edit Job | KL2PEN",
    description: "Update your job listing",
  };
};

export default async function CompanyEditJobPage({ params }: { params: any }) {
  // Get the current user
  const sessionResponse = await validateSession();
  const userId = sessionResponse.user?.uid;

  if (!userId) {
    redirect("/auth/login?redirect=/company/jobs");
  }

  const { id } = await params;

  const { job, error } = await getJobById(id);

  if (error || !job) {
    notFound();
  }

  // Check if the user is authorized to edit this job
  if (job.user_id !== userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to edit this job.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/company/jobs"
        className="flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Job Listings
      </Link>

      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-3xl font-bold">Edit Job</h1>
        <p className="text-muted-foreground">
          Update your job listing details below.
        </p>
      </div>

      <EditJobForm job={job} />
    </div>
  );
}
