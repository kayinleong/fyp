"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Job, JobStatus } from "@/lib/domains/jobs.domain";
import {
  updateJob,
  updateJobStatus,
  deleteJob,
} from "@/lib/actions/job.action";
import { useAuth } from "@/lib/contexts/auth-context";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters"),
  type: z.string().min(1, "Job type is required"),
  company_name: z.string().min(1, "Company name is required"),
  company_location: z.string().min(1, "Location is required"),
  minimum_salary: z.coerce.number().positive("Salary must be positive"),
  maximum_salary: z.coerce.number().positive("Salary must be positive"),
  application_dateline: z.date().optional(),
  is_remote: z.boolean(),
  description: z.string().min(20, "Description must be at least 20 characters"),
  requirements: z
    .string()
    .min(20, "Requirements must be at least 20 characters"),
  benefits: z.string().min(10, "Benefits must be at least 10 characters"),
  required_skills: z.string(), // Store as string in the form
  status: z.nativeEnum(JobStatus),
});

type FormValues = z.infer<typeof formSchema>;

const jobTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
];

interface EditJobFormProps {
  job: Job;
}

export default function EditJobForm({ job }: EditJobFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Enhanced handling for required_skills that could be an array, object, or string
  const getRequiredSkillsString = () => {
    const skills = Object.values(job.required_skills);
    return skills.join(", ");
  };

  // Initialize the form with the job data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: job.title,
      type: job.type,
      company_name: job.company_name,
      company_location: job.company_location,
      minimum_salary: job.minimum_salary,
      maximum_salary: job.maximum_salary,
      application_dateline: job.application_dateline
        ? new Date(job.application_dateline)
        : undefined,
      is_remote: job.is_remote,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      required_skills: getRequiredSkillsString(),
      status: job.status,
    },
  });

  async function onSubmit(values: FormValues) {
    if (!user) {
      setFormError("You need to be logged in to update a job");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      // Parse the required_skills from string to array
      const skills = values.required_skills
        ? values.required_skills.split(",").map((skill) => skill.trim())
        : [];

      // Format the job data for update
      const jobData: Partial<Job> = {
        ...values,
        required_skills: skills,
      };

      // Update the job
      const result = await updateJob(job.id, jobData, user.uid);

      if (result.success) {
        setFormSuccess("Job updated successfully!");
        router.refresh();
      } else {
        setFormError(result.error || "Failed to update job");
      }
    } catch (error) {
      console.error("Error updating job:", error);
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(status: JobStatus) {
    if (!user) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await updateJobStatus(job.id, status, user.uid);

      if (result.success) {
        // Update the form value
        form.setValue("status", status);
        setFormSuccess(`Job status updated to ${status.toLowerCase()}`);
        router.refresh();
      } else {
        setFormError(result.error || "Failed to update job status");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      setFormError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteJob() {
    if (!user) return;

    setIsDeleting(true);

    try {
      const result = await deleteJob(job.id, user.uid);

      if (result.success) {
        setShowDeleteDialog(false);
        router.push("/company/jobs");
        router.refresh();
      } else {
        setFormError(result.error || "Failed to delete job");
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      setFormError("An unexpected error occurred while deleting the job.");
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          {formError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {formSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{formSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <Badge
                className={
                  job.status === JobStatus.OPEN
                    ? "bg-green-100 text-green-800"
                    : job.status === JobStatus.DRAFT
                    ? "bg-gray-100 text-gray-800"
                    : job.status === JobStatus.EXPIRED
                    ? "bg-yellow-100 text-yellow-800"
                    : job.status === JobStatus.FILLED
                    ? "bg-blue-100 text-blue-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
              </Badge>
              {job.created_at && (
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(job.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {job.status === JobStatus.DRAFT && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(JobStatus.OPEN)}
                  disabled={isSubmitting}
                >
                  Publish
                </Button>
              )}
              {job.status === JobStatus.OPEN && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(JobStatus.CLOSED)}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
              )}
              {job.status === JobStatus.CLOSED && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(JobStatus.OPEN)}
                  disabled={isSubmitting}
                >
                  Reopen
                </Button>
              )}
              <Dialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Job</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this job? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteJob}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Job"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Job Basic Information */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Senior Software Engineer"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jobTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Your company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., San Francisco, CA"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimum_salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Salary ($)*</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maximum_salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Salary ($)*</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="application_dateline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Application Deadline</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When applications close for this position
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_remote"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Remote Position</FormLabel>
                        <FormDescription>
                          Check if this job can be performed remotely
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Job Details */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the responsibilities and day-to-day activities of this role"
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List the qualifications, education, and experience required"
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="benefits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Benefits*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the benefits offered for this position"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="required_skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skills</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="JavaScript, React, Node.js, etc. (comma-separated)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter skills separated by commas
                      </FormDescription>
                      <FormMessage />
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.value.split(",").map((skill, i) => (
                            <Badge key={i} variant="secondary">
                              {skill.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={JobStatus.DRAFT}>Draft</SelectItem>
                          <SelectItem value={JobStatus.OPEN}>Open</SelectItem>
                          <SelectItem value={JobStatus.CLOSED}>
                            Closed
                          </SelectItem>
                          <SelectItem value={JobStatus.FILLED}>
                            Filled
                          </SelectItem>
                          <SelectItem value={JobStatus.EXPIRED}>
                            Expired
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Update the current status of this job
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/company/jobs")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update Job"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
