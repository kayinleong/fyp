"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/client";
import ProfileForm from "@/components/profile/profile-form";
import { Icons } from "@/components/icons";
import { User } from "firebase/auth";

export default function ProfilePageClient() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="mx-auto container max-w-4xl py-10 p-4">
        <div className="flex items-center justify-center py-8">
          <Icons.spinner className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
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
