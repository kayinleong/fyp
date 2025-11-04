import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/actions/auth.action";
import ProfileForm from "@/components/profile/profile-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit Profile | RabbitJob",
  description: "Edit your RabbitJob profile information",
};

export default async function EditProfilePage() {
  // Check if user is authenticated
  const { user } = await validateSession();

  // If not authenticated, redirect to login page
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto container max-w-4xl py-10 p-4">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
            <p className="text-muted-foreground">
              Update your personal information and preferences.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Link>
          </Button>
        </div>

        <ProfileForm userId={user.uid} />
      </div>
    </div>
  );
}