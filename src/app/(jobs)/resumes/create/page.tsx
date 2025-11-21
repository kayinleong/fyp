import { validateSession } from "@/lib/actions/auth.action";
import { CreateResumeForm } from "@/components/resumes/create-resume-form";
import { redirect } from "next/navigation";

export default async function CreateResumePage() {
  const { user } = await validateSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <CreateResumeForm userId={user.uid} />
    </div>
  );
}
