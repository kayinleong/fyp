import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/actions/auth.action";
import ProfileForm from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "Profile | KL2PEN",
  description: "Manage your KL2PEN profile",
};

export default async function ProfilePage() {
  // Check if user is authenticated
  const { user } = await validateSession();

  // If not authenticated, redirect to login page
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto container max-w-4xl py-10 p-4">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences.
          </p>
        </div>

        <ProfileForm userId={user.uid} />
      </div>
    </div>
  );
}
