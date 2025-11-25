/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getResumeById } from "@/lib/actions/resume.action";
import { Resume } from "@/lib/domains/resume.domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2,
  Lock,
  Clock,
  EyeOff,
  FileText,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function ResumeViewerPage() {
  const params = useParams();
  const id = params.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Security states
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    async function fetchResume() {
      setIsLoading(true);
      try {
        const { resume: fetchedResume, error: fetchError } =
          await getResumeById(id);

        if (fetchError || !fetchedResume) {
          setError(fetchError || "Resume not found");
          setIsLoading(false);
          return;
        }

        // 1. Check Expiration
        if (
          fetchedResume.securityOptions.timeLimited &&
          fetchedResume.securityOptions.expirationDate
        ) {
          const expirationDate = new Date(
            fetchedResume.securityOptions.expirationDate
          );
          if (new Date() > expirationDate) {
            setIsExpired(true);
            setIsLoading(false);
            return;
          }
        }

        setResume(fetchedResume);

        // 2. Check Password Protection
        if (fetchedResume.securityOptions.passwordProtected) {
          setIsPasswordProtected(true);
        } else {
          // If not password protected, we still wait for user to click "View"
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error loading resume:", err);
        setError("Failed to load resume");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchResume();
    }
  }, [id]);

  const handleOneTimeView = async () => {
    // Logic for one-time view tracking would go here
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resume && resume.securityOptions.password === passwordInput) {
      setIsAuthenticated(true);
      setIsRevealed(true);
      if (resume.securityOptions.oneTimeView) {
        handleOneTimeView();
      }
    } else {
      setError("Incorrect password");
    }
  };

  const handleViewResume = () => {
    setIsRevealed(true);
    if (resume?.securityOptions.oneTimeView) {
      handleOneTimeView();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500">Loading secure resume...</p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Link Expired</CardTitle>
            <CardDescription>
              This resume link has expired and is no longer accessible.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error && !isPasswordProtected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Access Denied</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Interstitial State: Show controls before revealing
  if (!isRevealed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Secure Resume Access</CardTitle>
            <CardDescription>
              This resume is protected by the following security controls:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {resume?.securityOptions.passwordProtected && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <div className="text-sm">
                    <p className="font-medium">Password Protected</p>
                    <p className="text-muted-foreground">
                      Requires a password to view
                    </p>
                  </div>
                </div>
              )}
              {resume?.securityOptions.timeLimited && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div className="text-sm">
                    <p className="font-medium">Time Limited</p>
                    <p className="text-muted-foreground">
                      Expires on{" "}
                      {new Date(
                        resume.securityOptions.expirationDate!
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {resume?.securityOptions.oneTimeView && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border">
                  <EyeOff className="h-5 w-5 text-purple-600" />
                  <div className="text-sm">
                    <p className="font-medium">One-Time View</p>
                    <p className="text-muted-foreground">
                      Can only be viewed once
                    </p>
                  </div>
                </div>
              )}
              {!resume?.securityOptions.passwordProtected &&
                !resume?.securityOptions.timeLimited &&
                !resume?.securityOptions.oneTimeView && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div className="text-sm">
                      <p className="font-medium">Standard Access</p>
                      <p className="text-muted-foreground">
                        No specific restrictions applied
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {isPasswordProtected ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Enter Password to Unlock</Label>
                  <Input
                    id="password"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setError(null);
                    }}
                    placeholder="Password"
                    className={error ? "border-red-500" : ""}
                  />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Unlock & View Resume
                </Button>
              </form>
            ) : (
              <Button
                onClick={handleViewResume}
                className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
              >
                View Resume
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Revealed State: Show the Resume
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">{resume?.fileName}</h1>
            <p className="text-xs text-gray-500">Secure Resume View</p>
          </div>
        </div>
        {resume?.securityOptions.oneTimeView && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
            <EyeOff className="h-4 w-4" />
            <span>One-time view</span>
          </div>
        )}
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden h-[80vh]">
          {resume?.publicUrl ? (
            <iframe
              src={`${resume.publicUrl}#toolbar=0`}
              className="w-full h-full border-0"
              title="Resume PDF"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No PDF file available
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
