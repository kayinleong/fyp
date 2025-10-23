import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import CompanyJobsList from "@/components/jobs/company-jobs-list";

export default function CompanyJobsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Job Listings</h1>
          <p className="text-muted-foreground">
            Manage your company&apos;s job postings
          </p>
        </div>

        <Button asChild>
          <Link href="/company/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            Post New Job
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="all">All Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Suspense fallback={<JobsListSkeleton />}>
            <CompanyJobsList status="active" />
          </Suspense>
        </TabsContent>

        <TabsContent value="drafts">
          <Suspense fallback={<JobsListSkeleton />}>
            <CompanyJobsList status="draft" />
          </Suspense>
        </TabsContent>

        <TabsContent value="expired">
          <Suspense fallback={<JobsListSkeleton />}>
            <CompanyJobsList status="expired" />
          </Suspense>
        </TabsContent>

        <TabsContent value="all">
          <Suspense fallback={<JobsListSkeleton />}>
            <CompanyJobsList status="all" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JobsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-6 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
