"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Application,
  ApplicationStatus,
} from "@/lib/domains/applications.domain";
import { FileText, MoreVertical, Info } from "lucide-react";
import Link from "next/link";
import { updateApplicationStatus } from "@/lib/actions/application.action";
import { getProfileById } from "@/lib/actions/profile.action";
import { toast } from "sonner";

interface JobApplicationsListProps {
  status: string | ApplicationStatus;
  jobId: string;
  applications: Application[];
  onStatusChange?: () => void; // Add callback for parent refresh
}

interface UserProfile {
  userId: string;
  name: string;
  isLoading: boolean;
  error?: string;
}

export default function JobApplicationsList({
  applications,
  onStatusChange,
}: JobApplicationsListProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>(
    {}
  );
  const [updatedApplications, setUpdatedApplications] =
    useState<Application[]>(applications);

  // Fetch user profiles for each application
  useEffect(() => {
    const fetchUserProfiles = async () => {
      // Create a Set of unique user IDs to avoid duplicate requests
      const userIds = new Set(applications.map((app) => app.user_id));

      // Create initial loading state for each user
      const initialProfiles: Record<string, UserProfile> = {};
      userIds.forEach((userId) => {
        initialProfiles[userId] = {
          userId,
          name: userId.substring(0, 10), // Default display value while loading
          isLoading: true,
        };
      });
      setUserProfiles(initialProfiles);

      // Fetch each user's profile
      for (const userId of userIds) {
        try {
          const { profile, error } = await getProfileById(userId);

          setUserProfiles((prev) => ({
            ...prev,
            [userId]: {
              userId,
              name: profile?.name || `User ${userId.substring(0, 6)}`,
              isLoading: false,
              error,
            },
          }));
        } catch (error) {
          console.error(`Error fetching profile for user ${userId}:`, error);
          setUserProfiles((prev) => ({
            ...prev,
            [userId]: {
              userId,
              name: `User ${userId.substring(0, 6)}`,
              isLoading: false,
              error: "Failed to load profile",
            },
          }));
        }
      }
    };

    if (applications.length > 0) {
      fetchUserProfiles();
    }
  }, [applications]);

  // Function to get color based on application status
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
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "U"
    );
  };

  // Function to handle status change
  const handleChangeStatus = async (
    application: Application,
    status: ApplicationStatus
  ) => {
    setIsUpdating(application.id);

    try {
      // Validate status before sending to server
      if (!status || !Object.values(ApplicationStatus).includes(status)) {
        toast("Invalid status selected");
        setIsUpdating(null);
        setOpenDialog(false);
        return;
      }

      const response = await updateApplicationStatus(application.id, status);

      if (response.success) {
        // Update the local applications list
        setUpdatedApplications((prev) =>
          prev.map((app) =>
            app.id === application.id ? { ...app, status } : app
          )
        );

        // Show success toast
        toast(`Application status changed to ${status}`);

        // Call the callback to refresh data in parent component
        if (onStatusChange) {
          onStatusChange();
        }
      } else {
        // Show error toast
        toast(response.error || "Failed to update application status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast("Something went wrong while updating status");
    } finally {
      setIsUpdating(null);
      setOpenDialog(false);
    }
  };

  // Function to confirm status change
  const confirmStatusChange = (
    application: Application,
    status: ApplicationStatus
  ) => {
    setSelectedApplication(application);
    setNewStatus(status);
    setOpenDialog(true);
  };

  // Function to handle viewing application details
  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setOpenDetailsDialog(true);
  };

  // When applications prop changes, update our internal state
  useEffect(() => {
    setUpdatedApplications(applications);
  }, [applications]);

  if (updatedApplications.length === 0) {
    return (
      <div className="bg-muted rounded-md p-8 text-center">
        <p className="text-muted-foreground">No applications found.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Applicant</TableHead>
            <TableHead>Experience</TableHead>
            <TableHead>Applied On</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {updatedApplications.map((application) => {
            const userProfile = userProfiles[application.user_id];
            const displayName =
              userProfile?.name ||
              `User ${application.user_id.substring(0, 6)}`;
            const isLoading = userProfile?.isLoading || false;

            return (
              <TableRow key={application.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {isLoading ? (
                          <span className="inline-block w-24 h-4 bg-muted animate-pulse rounded"></span>
                        ) : (
                          displayName
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {application.phone_number}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{application.year_of_experience} years</TableCell>
                <TableCell>
                  {application.created_at
                    ? formatDate(application.created_at)
                    : "Recently"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getStatusColor(application.status)}
                  >
                    {application.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleViewDetails(application)}
                      title="View details"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link href={application.resume_path} target="_blank">
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={isUpdating === application.id}
                        >
                          {isUpdating === application.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={
                            application.status === ApplicationStatus.PENDING
                          }
                          onClick={() =>
                            confirmStatusChange(
                              application,
                              ApplicationStatus.PENDING
                            )
                          }
                        >
                          Mark as New
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={
                            application.status === ApplicationStatus.INTERVIEW
                          }
                          onClick={() =>
                            confirmStatusChange(
                              application,
                              ApplicationStatus.INTERVIEW
                            )
                          }
                        >
                          Move to Interview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={
                            application.status === ApplicationStatus.OFFER
                          }
                          onClick={() =>
                            confirmStatusChange(
                              application,
                              ApplicationStatus.OFFER
                            )
                          }
                        >
                          Send Offer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={
                            application.status === ApplicationStatus.REJECTED
                          }
                          onClick={() =>
                            confirmStatusChange(
                              application,
                              ApplicationStatus.REJECTED
                            )
                          }
                          className="text-red-600"
                        >
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of this application to{" "}
              <strong>{newStatus}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedApplication && newStatus) {
                  handleChangeStatus(selectedApplication, newStatus);
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the details of this application.
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Applicant</h4>
                  <p className="text-sm">
                    {userProfiles[selectedApplication.user_id]?.name ||
                      `User ${selectedApplication.user_id.substring(0, 8)}`}
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Phone</h4>
                  <p className="text-sm">{selectedApplication.phone_number}</p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Experience</h4>
                  <p className="text-sm">
                    {selectedApplication.year_of_experience} years
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Status</h4>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedApplication.status)}
                  >
                    {selectedApplication.status}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Applied On</h4>
                  <p className="text-sm">
                    {selectedApplication.created_at
                      ? formatDate(selectedApplication.created_at)
                      : "Recently"}
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Last Updated</h4>
                  <p className="text-sm">
                    {selectedApplication.updated_at
                      ? formatDate(selectedApplication.updated_at)
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold">
                  Additional Information
                </h4>
                <div className="rounded-md bg-muted p-3 text-sm">
                  {selectedApplication.additional_information
                    ? selectedApplication.additional_information
                    : "No additional information provided."}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link
                href={selectedApplication?.resume_path || "#"}
                target="_blank"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Resume
              </Link>
            </Button>
            <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
