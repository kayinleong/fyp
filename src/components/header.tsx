"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Briefcase, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/contexts/auth-context";
import { getProfileById } from "@/lib/actions/profile.action";
import { toast } from "sonner";
import { Profile } from "@/lib/domains/profile.domain";

// Define navigation items based on user role
const publicNavigation = [
  { name: "Home", href: "/" },
  { name: "Explore Jobs", href: "/jobs" },
  { name: "Job Swipe", href: "/swipe" },
  { name: "AI Toolkit", href: "/ai-toolkit" },
];

const guestNavigation = [
  ...publicNavigation,
  { name: "My Applications", href: "/applications" },
];

const companyNavigation = [
  { name: "Home", href: "/" },
  { name: "My Jobs", href: "/company/jobs" },
  { name: "Post Job", href: "/company/jobs/new" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user, isLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Function to fetch profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { profile: userProfile, error } = await getProfileById(userId);
      if (userProfile) {
        setProfile(userProfile);
      } else if (error) {
        console.error("Error fetching profile:", error);
      }
    } catch (error) {
      console.error("Exception fetching profile:", error);
    }
  };

  // Fetch user profile when user changes
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.uid);
    } else {
      setProfile(null);
    }
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      toast("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast("Error logging out");
    }
  };

  // Determine which navigation items to show based on auth state and role
  const getNavigation = () => {
    if (!user) return publicNavigation;

    // Check user role from profile
    if (profile?.role === "COMPANY") {
      return companyNavigation;
    }

    // Default to guest navigation
    return guestNavigation;
  };

  const navigation = getNavigation();

  // Create user initials for avatar
  const getUserInitials = () => {
    if (profile?.name) {
      return profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  // Get display name
  const getDisplayName = () => {
    return profile?.name || "User";
  };

  const NavItems = () => (
    <>
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}
          onClick={() => setOpen(false)}
        >
          {item.name}
        </Link>
      ))}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto px-2 container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-3xl font-extrabold tracking-tighter text-red-600"
          >
            <div className="dfont-bold text-red-600">KL2PEN</div>
          </Link>

          {!isMobile && (
            <div className="hidden md:flex md:gap-6">
              <NavItems />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.photoURL || ""}
                          alt={getDisplayName()}
                        />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {getDisplayName()}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        {profile?.role === "COMPANY" && (
                          <p className="text-xs text-blue-500 font-medium mt-1">
                            Company Account
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {profile?.role !== "COMPANY" && (
                      <DropdownMenuItem asChild>
                        <Link href="/applications">
                          <Briefcase className="mr-2 h-4 w-4" />
                          <span>My Applications</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="hidden md:flex"
                  >
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm" className="hidden md:flex">
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </>
              )}
            </>
          )}

          {isMobile && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-8">
                  <NavItems />
                  <div className="flex flex-col gap-2 mt-4">
                    {!isLoading && (
                      <>
                        {user ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={user.photoURL || ""}
                                  alt={getDisplayName()}
                                />
                                <AvatarFallback>
                                  {getUserInitials()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {getDisplayName()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {user.email}
                                </p>
                                {profile?.role === "COMPANY" && (
                                  <p className="text-xs text-blue-500 font-medium">
                                    Company Account
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <Link
                                href="/profile"
                                onClick={() => setOpen(false)}
                              >
                                <User className="h-4 w-4 mr-2" />
                                Profile
                              </Link>
                            </Button>
                            {profile?.role !== "COMPANY" && (
                              <Button asChild variant="outline" size="sm">
                                <Link
                                  href="/applications"
                                  onClick={() => setOpen(false)}
                                >
                                  <Briefcase className="h-4 w-4 mr-2" />
                                  My Applications
                                </Link>
                              </Button>
                            )}
                            <Button size="sm" onClick={handleLogout}>
                              <LogOut className="h-4 w-4 mr-2" />
                              Log out
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button asChild variant="outline" size="sm">
                              <Link
                                href="/login"
                                onClick={() => setOpen(false)}
                              >
                                Log in
                              </Link>
                            </Button>
                            <Button asChild size="sm">
                              <Link
                                href="/signup"
                                onClick={() => setOpen(false)}
                              >
                                Sign up
                              </Link>
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </nav>
    </header>
  );
}
