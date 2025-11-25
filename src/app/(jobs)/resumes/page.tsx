import { validateSession } from "@/lib/actions/auth.action";
import { getUserResumes } from "@/lib/actions/resume.action";
import { ResumeList } from "@/components/resumes/resume-list";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ResumeSharingPage() {
  const { user } = await validateSession();

  if (!user) {
    redirect("/login");
  }

  const { resumes } = await getUserResumes(user.uid);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80 mb-4">
          RESUME SHARING
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-blue-600 mb-2">
          Resume Sharing
        </h1>
        <p className="text-lg text-gray-600">
          Manage the resumes you share with employers.
        </p>
      </div>

      <div className="mb-8">
        <Button
          asChild
          size="lg"
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
        >
          <Link href="/resumes/create">
            <FileText className="mr-2 h-5 w-5" />
            Add Resume to Share
          </Link>
        </Button>
      </div>

      <ResumeList initialResumes={resumes || []} userId={user.uid} />
    </div>
  );
}
