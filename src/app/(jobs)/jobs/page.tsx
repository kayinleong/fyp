/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import JobList from "@/components/jobs/job-list";
import JobFilters from "@/components/jobs/job-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Search } from "lucide-react";

export default function JobsPage({ searchParams }: { searchParams: any }) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with decorative pink elements */}
      <div className="mb-8 relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-sm font-medium">
            JOBS
          </div>
          <Briefcase className="h-5 w-5 text-pink-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-slate-800 mb-4">
          Find Your Next <span className="text-pink-600">Opportunity</span>
        </h1>
        <p className="text-slate-600 max-w-2xl">
          Browse through our curated list of jobs tailored for career changers
          and fresh graduates. Use the filters to find the perfect match for
          your skills and preferences.
        </p>
        <div className="absolute right-0 top-0 h-20 w-20 bg-pink-100 rounded-full opacity-50 -z-10 translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute left-0 bottom-0 h-12 w-12 bg-pink-200 rounded-full opacity-40 -z-10 -translate-x-1/3 translate-y-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          {/* Add a styled heading for filters */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-pink-100 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-pink-500" />
              <h2 className="font-semibold text-slate-800">Filter Jobs</h2>
            </div>
            <Suspense fallback={<JobListSkeleton />}>
              <JobFilters />
            </Suspense>
          </div>
        </div>

        <div className="lg:col-span-3">
          <Suspense fallback={<JobListSkeleton />}>
            <JobList searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function JobListSkeleton() {
  return (
    <div className="space-y-4">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="border border-pink-100 rounded-lg p-6 space-y-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 bg-pink-100" />
                <Skeleton className="h-4 w-32 bg-pink-50" />
              </div>
              <Skeleton className="h-10 w-24 bg-pink-100" />
            </div>
            <Skeleton className="h-4 w-full bg-pink-50" />
            <Skeleton className="h-4 w-full bg-pink-50" />
            <div className="flex flex-wrap gap-2 mt-4">
              <Skeleton className="h-6 w-16 bg-pink-100 rounded-full" />
              <Skeleton className="h-6 w-20 bg-pink-100 rounded-full" />
              <Skeleton className="h-6 w-24 bg-pink-100 rounded-full" />
            </div>
          </div>
        ))}
    </div>
  );
}
