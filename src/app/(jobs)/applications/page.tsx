import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import UserApplicationsContainer from "@/components/applications/user-applications-container";
import { ClipboardList } from "lucide-react";

export default function ApplicationsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header with decorative elements */}
      <div className="relative mb-16 text-center md:text-left">
        <div className="absolute top-0 right-0 w-20 h-20 bg-pink-100 rounded-full opacity-60 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200 rounded-full opacity-40 -z-10"></div>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-4">
          APPLICATIONS
          <ClipboardList className="h-4 w-4 ml-2 text-pink-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 mb-4">
          My <span className="text-pink-600">Applications</span>
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto md:mx-0">
          Track and manage all your job applications in one place. Monitor your
          progress and stay organized throughout your job search.
        </p>
      </div>

      <Suspense fallback={<ApplicationsSkeleton />}>
        <UserApplicationsContainer />
      </Suspense>
    </div>
  );
}

function ApplicationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Skeleton className="h-10 w-20 bg-pink-50" />
        <Skeleton className="h-10 w-20 bg-pink-50" />
        <Skeleton className="h-10 w-20 bg-pink-50" />
        <Skeleton className="h-10 w-20 bg-pink-50" />
        <Skeleton className="h-10 w-20 bg-pink-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="border border-pink-100 rounded-lg p-4 space-y-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4 bg-pink-50" />
                <Skeleton className="h-4 w-1/2 bg-pink-50" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-20 bg-pink-50" />
                <Skeleton className="h-8 w-8 rounded-full bg-pink-50" />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
