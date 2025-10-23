"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Job, JobStatus } from "@/lib/domains/jobs.domain";
import { createJob } from "@/lib/actions/job.action";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { cn } from "@/lib/utils";

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

export default function NewJobForm() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      setFormError("You need to be logged in to post a job");
      setTimeout(() => {
        router.push("/auth/login?redirect=/company/jobs/new");
      }, 2000);
    }
  }, [user, isLoading, router]);

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "",
      company_name: "",
      company_location: "",
      minimum_salary: 0,
      maximum_salary: 0,
      is_remote: false,
      description: "",
      requirements: "",
      benefits: "",
      required_skills: "",
      status: JobStatus.DRAFT,
    },
  });

  async function onSubmit(values: FormValues) {
    // Check if user is authenticated
    if (!user) {
      setFormError("You need to be logged in to post a job");
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

      // Structure the data according to Job interface with the actual user ID
      const jobData: Omit<Job, "id"> = {
        ...values,
        required_skills: skills,
        user_id: user.uid, // Use the authenticated user's ID
      };

      const result = await createJob(jobData as Job);

      if (result.success) {
        setFormSuccess("Job created successfully!");
        setTimeout(() => {
          router.push(`/company/jobs`);
        }, 1500);
      } else {
        setFormError(result.error || "Failed to create job");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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
                      <Input placeholder="e.g., San Francisco, CA" {...field} />
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
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Save as draft or publish immediately
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
                  "Create Job"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
