import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, Calendar, Building } from "lucide-react";

interface StatusHistoryItem {
  status: string;
  date: string;
  note: string;
}

interface Application {
  id: number;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: string;
  statusHistory: StatusHistoryItem[];
}

interface ApplicationStatusCardProps {
  application: Application;
}

export default function ApplicationStatusCard({
  application,
}: ApplicationStatusCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Applied
          </Badge>
        );
      case "screening":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
          >
            <Clock className="h-3 w-3" /> Screening
          </Badge>
        );
      case "interview":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800"
          >
            <Calendar className="h-3 w-3" /> Interview
          </Badge>
        );
      case "offer":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
          >
            <CheckCircle2 className="h-3 w-3" /> Offer
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800"
          >
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const latestUpdate =
    application.statusHistory[application.statusHistory.length - 1];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{application.jobTitle}</CardTitle>
            <div className="flex items-center text-muted-foreground mt-1">
              <Building className="h-4 w-4 mr-1" />
              <span>{application.company}</span>
            </div>
          </div>
          {getStatusBadge(application.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Applied on:</span>{" "}
            {formatDate(application.appliedDate)}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Latest update:</span>{" "}
            {formatDate(latestUpdate.date)}
          </div>
          <p className="text-sm mt-2">{latestUpdate.note}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/applications/${application.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
