"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Pencil, Star, Calendar } from "lucide-react";
import { getProfileById } from "@/lib/actions/profile.action";
import { getUserActiveSubscription } from "@/lib/actions/subscription.action";
import { SubscriptionPlan } from "@/lib/domains/subscription.domain";
import { Profile } from "@/lib/domains/profile.domain";
import Link from "next/link";

interface ProfileOverviewProps {
  userId: string;
}

export default function ProfileOverview({ userId }: ProfileOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    plan: SubscriptionPlan;
    isActive: boolean;
    expiresAt?: Date | string;
  }>({
    plan: SubscriptionPlan.FREE,
    isActive: true,
  });

  // Fetch user profile and subscription details
  useEffect(() => {
    const fetchProfileAndSubscription = async () => {
      setIsLoading(true);
      try {
        // Fetch profile
        const { profile: userProfile } = await getProfileById(userId);
        if (userProfile) {
          setProfile(userProfile);
        }

        // Fetch subscription
        const { subscription } = await getUserActiveSubscription(userId);
        if (subscription) {
          const expiresAt =
            subscription.expires_at instanceof Date
              ? subscription.expires_at
              : subscription.expires_at
              ? new Date(subscription.expires_at)
              : undefined;

          setSubscriptionDetails({
            plan: subscription.plan_type,
            isActive: true,
            expiresAt,
          });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndSubscription();
  }, [userId]);



  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Icons.spinner className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const getGenderText = (gender: number) => {
    switch (gender) {
      case 1:
        return "Male";
      case 2:
        return "Female";
      default:
        return "Not specified";
    }
  };

  if (!profile) {
    return (
      <div className="text-center p-4">
        <p>Error loading profile data.</p>
      </div>
    );
  }

  const isCompanyAccount = profile.role === "COMPANY";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Account Overview</CardTitle>
        <Badge
          variant={
            isCompanyAccount || subscriptionDetails.plan === SubscriptionPlan.PREMIUM
              ? "default"
              : "secondary"
          }
        >
          {isCompanyAccount ? "Company Plan" : `${subscriptionDetails.plan} Plan`}
        </Badge>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <div className="flex flex-col space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Name</dt>
            <dd className="text-lg">{profile.name}</dd>
          </div>

          <div className="flex flex-col space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Account Type</dt>
            <dd className="flex items-center gap-2">
              <span className="capitalize">{profile.role?.toLowerCase() || "Guest"}</span>
              <Badge variant="outline">{profile.role === "COMPANY" ? "Employer" : "Job Seeker"}</Badge>
            </dd>
          </div>

          <div className="flex flex-col space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
            <dd>{getGenderText(profile.gender)}</dd>
          </div>

          {profile.university && (
            <div className="flex flex-col space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">University</dt>
              <dd>{profile.university}</dd>
            </div>
          )}

          {!isCompanyAccount &&
            subscriptionDetails.plan === SubscriptionPlan.PREMIUM &&
            subscriptionDetails.expiresAt && (
              <div className="flex flex-col space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Premium Expires
                </dt>
                <dd className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(subscriptionDetails.expiresAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </dd>
              </div>
            )}

          <div className="pt-4 flex flex-col gap-3">
            <Button variant="outline" asChild>
              <Link href="/profile/edit">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
            {!isCompanyAccount && subscriptionDetails.plan === SubscriptionPlan.FREE && (
              <Button asChild>
                <Link href="/subscription">
                  <Star className="mr-2 h-4 w-4" />
                  Upgrade to Premium
                </Link>
              </Button>
            )}
            {isCompanyAccount && (
              <p className="text-sm text-muted-foreground">
                Employer accounts include unlimited job postings and do not support Premium upgrades.
              </p>
            )}
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}