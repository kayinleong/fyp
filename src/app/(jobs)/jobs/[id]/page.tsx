/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building,
  MapPin,
  Clock,
  Briefcase,
  DollarSign,
  Globe,
  Sparkles,
} from "lucide-react";
import ApplicationForm from "@/components/applications/application-form";
import { getJobById } from "@/lib/actions/job.action";
import { notFound } from "next/navigation";

export default async function JobDetailsPage({ params }: { params: any }) {
  // Fetch job data from the server using the job ID
  const { job, error } = await getJobById((await params).id);

  // If job not found or error occurred, show 404 page
  if (!job || error) {
    notFound();
  }

  // Helper function to format salary range
  const formatSalary = (min: number, max: number) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  // Calculate "posted X days ago" or similar text
  const getPostedTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  // Get skills as an array for displaying badges
  const skills = Object.values(job.required_skills);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Pink-themed header section */}
      <div className="relative mb-10">
        <div className="absolute top-0 right-0 w-20 h-20 bg-pink-100 rounded-full opacity-60 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200 rounded-full opacity-40 -z-10"></div>

        <Link
          href="/jobs"
          className="flex items-center text-pink-600 hover:text-pink-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Jobs
        </Link>

        <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-4">
          JOB DETAILS
          <Briefcase className="h-4 w-4 ml-2 text-pink-500" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          {job.title}
        </h1>

        <div className="flex items-center text-pink-600 mb-4">
          <Building className="h-5 w-5 mr-2" />
          <span className="font-medium">{job.company_name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 border-b border-pink-50">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    About This Role
                  </h2>
                  <div className="flex items-center text-slate-600 mt-1">
                    <Clock className="h-4 w-4 mr-1 text-pink-500" />
                    <span>
                      Posted{" "}
                      {job.created_at
                        ? getPostedTime(job.created_at)
                        : "Recently"}
                    </span>
                  </div>
                </div>

                {/* Company identifier instead of image */}
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
                  <span className="font-bold text-pink-600">
                    {job.company_name.charAt(0)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-y-3 gap-x-6 mb-6 p-4 bg-pink-50/50 rounded-lg">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-pink-500" />
                  <span className="text-slate-700">{job.company_location}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-pink-500" />
                  <span className="text-slate-700">{job.type}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-pink-500" />
                  <span className="text-slate-700">
                    {formatSalary(job.minimum_salary, job.maximum_salary)}
                  </span>
                </div>
                {job.is_remote && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-pink-500" />
                    <span className="text-slate-700">Remote</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-600 mb-2">
                  Required Skills:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Tabs defaultValue="description" className="mt-6">
                <TabsList className="mb-4 bg-pink-50 text-slate-600">
                  <TabsTrigger
                    value="description"
                    className="data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm"
                  >
                    Description
                  </TabsTrigger>
                  <TabsTrigger
                    value="requirements"
                    className="data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm"
                  >
                    Requirements
                  </TabsTrigger>
                  <TabsTrigger
                    value="benefits"
                    className="data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm"
                  >
                    Benefits
                  </TabsTrigger>
                  <TabsTrigger
                    value="company"
                    className="data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm"
                  >
                    Company
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="description"
                  className="space-y-4 text-slate-700"
                >
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  ></div>
                </TabsContent>

                <TabsContent
                  value="requirements"
                  className="space-y-4 text-slate-700"
                >
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.requirements }}
                  ></div>
                </TabsContent>

                <TabsContent
                  value="benefits"
                  className="space-y-4 text-slate-700"
                >
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.benefits }}
                  ></div>
                </TabsContent>

                <TabsContent
                  value="company"
                  className="space-y-4 text-slate-700"
                >
                  <p>
                    {job.company_name} is located in {job.company_location}.
                    {job.is_remote
                      ? " This position allows for remote work."
                      : ""}
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border border-pink-100 shadow-sm sticky top-24">
            <CardHeader className="border-b border-pink-50 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-pink-600" />
                </div>
                <CardTitle className="text-lg text-slate-800">
                  Apply for this position
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ApplicationForm jobId={(await params).id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
