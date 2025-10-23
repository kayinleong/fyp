import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, MapPin, DollarSign, Briefcase, Globe } from "lucide-react";
import { format } from "date-fns";

interface JobPreviewProps {
  job: {
    title?: string;
    company?: string;
    location?: string;
    type?: string;
    minSalary?: number;
    maxSalary?: number;
    description?: string;
    requirements?: string;
    benefits?: string;
    deadline?: Date;
    remote?: boolean;
    skills?: string[];
  };
}

export default function JobPreview({ job }: JobPreviewProps) {
  const formatSalary = () => {
    if (job.minSalary && job.maxSalary) {
      return `$${job.minSalary.toLocaleString()} - $${job.maxSalary.toLocaleString()}`;
    } else if (job.minSalary) {
      return `From $${job.minSalary.toLocaleString()}`;
    } else if (job.maxSalary) {
      return `Up to $${job.maxSalary.toLocaleString()}`;
    }
    return "Not specified";
  };

  const formatJobType = (type?: string) => {
    if (!type) return "";

    // Convert kebab-case to Title Case
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTextWithLineBreaks = (text?: string) => {
    if (!text) return null;

    return text.split("\n").map((line, index) => (
      <p key={index} className={index > 0 ? "mt-2" : ""}>
        {line}
      </p>
    ));
  };

  const formatListItems = (text?: string) => {
    if (!text) return null;

    return (
      <ul className="list-disc pl-5 space-y-2">
        {text
          .split("\n")
          .filter((line) => line.trim())
          .map((line, index) => (
            <li key={index}>{line}</li>
          ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{job.title || "Job Title"}</h1>
            <div className="flex items-center text-muted-foreground mt-1">
              <Building className="h-4 w-4 mr-1" />
              <span>{job.company || "Company Name"}</span>
            </div>
          </div>

          {job.deadline && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Apply before:</span>{" "}
              {format(job.deadline, "MMMM d, yyyy")}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          {job.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{job.location}</span>
            </div>
          )}

          {job.type && (
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{formatJobType(job.type)}</span>
            </div>
          )}

          {(job.minSalary || job.maxSalary) && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{formatSalary()}</span>
            </div>
          )}

          {job.remote && (
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>Remote</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {job.skills?.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {job.description && (
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>{formatTextWithLineBreaks(job.description)}</CardContent>
        </Card>
      )}

      {job.requirements && (
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>{formatListItems(job.requirements)}</CardContent>
        </Card>
      )}

      {job.benefits && (
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent>{formatListItems(job.benefits)}</CardContent>
        </Card>
      )}

      {!job.title && !job.company && !job.description && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Fill in the job details to see a preview</p>
        </div>
      )}
    </div>
  );
}
