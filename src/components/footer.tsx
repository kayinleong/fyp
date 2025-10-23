"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useState, useEffect } from "react";
import { getProfileById } from "@/lib/actions/profile.action";
import type { Profile } from "@/lib/domains/profile.domain";

export default function Footer() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Function to fetch profile data
  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      try {
        const { profile: userProfile } = await getProfileById(userId);
        if (userProfile) {
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Exception fetching profile:", error);
      }
    };

    if (user) {
      fetchUserProfile(user.uid);
    } else {
      setProfile(null);
    }
  }, [user]);

  // Determine which navigation items to show based on auth state and role
  const getNavigation = () => {
    if (!user)
      return [
        { name: "Home", href: "/" },
        { name: "Explore Jobs", href: "/jobs" },
        { name: "Job Swipe", href: "/swipe" },
        { name: "AI Toolkit", href: "/ai-toolkit" },
      ];

    // Check user role from profile
    if (profile?.role === "COMPANY") {
      return [
        { name: "Home", href: "/" },
        { name: "My Jobs", href: "/company/jobs" },
        { name: "Post Job", href: "/company/jobs/new" },
      ];
    }

    // Default to guest navigation
    return [
      { name: "Home", href: "/" },
      { name: "Explore Jobs", href: "/jobs" },
      { name: "Job Swipe", href: "/swipe" },
      { name: "AI Toolkit", href: "/ai-toolkit" },
      { name: "My Applications", href: "/applications" },
    ];
  };

  const navigation = getNavigation();

  return (
    <footer className="relative bg-gradient-to-b from-white to-pink-50 text-gray-800 py-12 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-200 via-pink-400 to-pink-200"></div>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-pink-100 opacity-30 -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-pink-100 opacity-30 translate-y-1/3 -translate-x-1/4"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Logo and Description */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-extrabold tracking-tighter inline-flex items-center"
          >
            <div className="font-bold text-red-600">KL2PEN</div>
          </Link>
          <p className="mt-3 text-gray-600 mx-auto max-w-md text-sm">
            Your career&apos;s second chance. We connect graduates and career
            changers with opportunities using AI-powered matching.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-pink-600 hover:text-pink-700 transition-all hover:-translate-y-0.5 text-sm font-medium relative group"
            >
              {item.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-400 transition-all group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Copyright with heart icon */}
        <div className="flex justify-center items-center pt-4 border-t border-pink-100">
          <div className="flex items-center text-gray-500 text-xs mt-4">
            <span>Made with</span>
            <Heart className="h-3 w-3 mx-1 text-pink-500 fill-pink-500 animate-pulse" />
            <span>
              by KL2PEN • Copyright © {new Date().getFullYear()} • All rights
              reserved
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
