import { validateSession } from "@/lib/actions/auth.action";
import { getResumeById } from "@/lib/actions/resume.action";
import { EditResumeForm } from "@/components/resumes/edit-resume-form";
import { redirect, notFound } from "next/navigation";

interface EditResumePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditResumePage({ params }: EditResumePageProps) {
  const { user } = await validateSession();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const { resume, error } = await getResumeById(id);

  if (!resume) {
    notFound();
  }

  if (resume.userId !== user.uid) {
    redirect("/resumes");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <EditResumeForm resume={resume} userId={user.uid} />
    </div>
  );
}
