import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewJobForm from "@/components/jobs/new-job-form";

export const metadata: Metadata = {
  title: "Post a New Job | KL2PEN",
  description: "Create a new job listing for your company",
};

export default function NewJobPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/company/jobs"
        className="flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Job Listings
      </Link>

      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-3xl font-bold">Post a New Job</h1>
        <p className="text-muted-foreground">
          Create a new job listing to attract qualified candidates to your
          company.
        </p>
      </div>

      <NewJobForm />
    </div>
  );
}
