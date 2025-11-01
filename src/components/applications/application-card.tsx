import { useState } from "react";
import {
  Application,
  ApplicationStatus,
} from "@/lib/domains/applications.domain";
import { Job } from "@/lib/domains/jobs.domain";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Building, Calendar, FileText, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ApplicationCardProps {
  application: Application;
  job?: Job;
}

export default function ApplicationCard({
  application,
  job,
}: ApplicationCardProps) {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  // Function to get status color
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return "bg-blue-100 text-blue-800";
      case ApplicationStatus.INTERVIEW:
        return "bg-yellow-100 text-yellow-800";
      case ApplicationStatus.OFFER:
        return "bg-green-100 text-green-800";
      case ApplicationStatus.REJECTED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">
                {job?.title || "Loading job..."}
              </CardTitle>
              <div className="flex items-center text-muted-foreground mt-1">
                <Building className="h-3 w-3 mr-1" />
                <span className="text-sm">
                  {job?.company_name || "Unknown company"}
                </span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={getStatusColor(application.status)}
            >
              {application.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-2">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Applied on {formatDate(application.created_at)}</span>
          </div>

          {application.additional_information && (
            <div className="mt-3">
              <h4 className="text-xs font-medium mb-1">
                Additional Information
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {application.additional_information}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenDetailsDialog(true)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href={application.resume_path} target="_blank">
              <FileText className="h-3 w-3 mr-1" />
              Resume
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the details of your application for{" "}
              {job?.title || "this position"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Position</h4>
                <p className="text-sm font-medium">
                  {job?.title || "Loading job..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {job?.company_name || "Unknown company"}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Status</h4>
                <Badge
                  variant="outline"
                  className={getStatusColor(application.status)}
                >
                  {application.status}
                </Badge>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Applied On</h4>
                <p className="text-sm">
                  {application.created_at
                    ? formatDate(application.created_at)
                    : "Recently"}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Experience</h4>
                <p className="text-sm">
                  {application.year_of_experience} years
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Phone</h4>
                <p className="text-sm">{application.phone_number}</p>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Last Updated</h4>
                <p className="text-sm">
                  {application.updated_at
                    ? formatDate(application.updated_at)
                    : "N/A"}
                </p>
              </div>
            </div>

            {job && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Job Location</h4>
                <div className="text-sm flex flex-wrap items-center gap-1">
                  <p className="text-sm">
                    {job.company_location}
                    {job.is_remote && " (Remote available)"}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Additional Information</h4>
              <div className="rounded-md bg-muted p-3 text-sm">
                {application.additional_information
                  ? application.additional_information
                  : "No additional information provided."}
              </div>
            </div>

            {application.status === ApplicationStatus.INTERVIEW && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h4 className="text-sm font-semibold text-yellow-800">
                  Interview Status
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your application is in the interview stage. The employer may
                  contact you soon for an interview.
                </p>
              </div>
            )}

            {application.status === ApplicationStatus.OFFER && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <h4 className="text-sm font-semibold text-green-800">
                  Offer Received
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Congratulations! You&apos;ve received an offer for this
                  position. Please check your email for details.
                </p>
              </div>
            )}

            {application.status === ApplicationStatus.REJECTED && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <h4 className="text-sm font-semibold text-red-800">
                  Application Not Selected
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  Thank you for your interest. The employer has decided to
                  proceed with other candidates.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href={`/jobs/${application.job_id}`}>View Job Posting</Link>
            </Button>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href={application.resume_path} target="_blank">
                  <FileText className="h-4 w-4 mr-2" />
                  View Resume
                </Link>
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => setOpenDetailsDialog(false)}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
