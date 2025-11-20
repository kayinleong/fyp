"use client";

import { Resume } from "@/lib/domains/resume.domain";
import { deleteResume } from "@/lib/actions/resume.action";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileText, Eye, Clock, Lock, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ResumeListProps {
  initialResumes: Resume[];
  userId: string;
}

export function ResumeList({ initialResumes, userId }: ResumeListProps) {
  const [resumes, setResumes] = useState<Resume[]>(initialResumes);
  const router = useRouter();

  const handleDelete = async (resumeId: string) => {
    try {
      const result = await deleteResume(resumeId, userId);
      if (result.success) {
        setResumes((prev) => prev.filter((r) => r.id !== resumeId));
        toast.success("Resume deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete resume");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  if (resumes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
        <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-blue-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No resumes shared yet</h3>
        <p className="mt-1 text-sm text-gray-500">Upload a resume to start sharing.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-semibold text-gray-900">Shared resumes</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {resumes.map((resume) => (
          <div key={resume.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{resume.fileName}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {resume.securityOptions.oneTimeView && (
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      <Eye className="h-3 w-3" /> One-time
                    </span>
                  )}
                  {resume.securityOptions.timeLimited && (
                    <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" /> Expires
                    </span>
                  )}
                  {resume.securityOptions.passwordProtected && (
                    <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      <Lock className="h-3 w-3" /> Protected
                    </span>
                  )}
                  {!resume.securityOptions.oneTimeView && !resume.securityOptions.timeLimited && !resume.securityOptions.passwordProtected && (
                     <span className="text-gray-400">No restrictions</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  navigator.clipboard.writeText(resume.publicUrl);
                  toast.success("Link copied to clipboard");
                }}
                title="Copy Link"
              >
                <LinkIcon className="h-4 w-4" />
                <span className="sr-only">Copy Link</span>
              </Button>

              <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                <Link href={`/resumes/${resume.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Link>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Resume Share?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this shared resume and the associated file. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(resume.id)} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
