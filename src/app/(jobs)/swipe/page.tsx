"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  MapPin,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Briefcase,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  motion,
  type PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from "next/navigation";
import { listJobs } from "@/lib/actions/job.action";
import {
  likeJob,
  dislikeJob,
  getLikedJobs,
  getDislikedJobs,
  getUserSwipes,
  analyzeUserPreferences,
  getAnalysisResult,
} from "@/lib/actions/job-swipe.action";
import { Job, JobStatus } from "@/lib/domains/jobs.domain";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function JobSwipePage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [displayJobs, setDisplayJobs] = useState<Job[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [swipeInProgress, setSwipeInProgress] = useState(false);
  const [likedJobIds, setLikedJobIds] = useState<string[]>([]);
  const [dislikedJobIds, setDislikedJobIds] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false); // Add loading state for analysis
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null); // Ref to store the debounce timeout

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const likeOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1]);
  const dislikeOpacity = useTransform(x, [-200, -100, 0], [1, 0.5, 0]);

  const dragConstraintsRef = useRef(null);

  // Format salary for display
  const formatSalary = (min: number, max: number) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  // Initialize user swipe data and fetch jobs
  const fetchJobsAndInitSwipes = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // First ensure the user has a swipe record
      await getUserSwipes(user.uid);

      // Then get user's liked and disliked jobs along with available jobs
      const [jobsResponse, likedResponse, dislikedResponse] = await Promise.all(
        [
          listJobs(100, JobStatus.OPEN),
          getLikedJobs(user.uid),
          getDislikedJobs(user.uid),
        ]
      );

      if (jobsResponse.error) {
        toast(jobsResponse.error);
        return;
      }

      // Store user preferences
      const likedIds = Object.values(likedResponse.jobIds);
      const dislikedIds = Object.values(dislikedResponse.jobIds);

      setLikedJobIds(likedIds);
      setDislikedJobIds(dislikedIds);

      // Filter out jobs the user has already interacted with
      const allJobIds = new Set([...likedIds, ...dislikedIds]);
      const filteredJobs = jobsResponse.jobs.filter(
        (job) => !allJobIds.has(job.id)
      );

      setDisplayJobs(filteredJobs);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error initializing job swipes:", error);
      toast("Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push("/login?redirect=" + encodeURIComponent("/swipe"));
      return;
    }

    if (user) {
      // Fetch jobs and initialize swipes
      fetchJobsAndInitSwipes();

      // Fetch the last analysis result
      getAnalysisResult(user.uid).then(({ analysis, error }) => {
        if (analysis) {
          setAnalysisResult(analysis); // Set the last analysis result
        } else if (error) {
          console.error("Error fetching analysis result:", error);
        } else {
          setAnalysisResult("No analysis result available yet."); // Default message if no result exists
        }
      });
    }
  }, [user, authLoading, router, fetchJobsAndInitSwipes]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current); // Clear timeout on component unmount
      }
    };
  }, []);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (swipeInProgress) return;

    if (info.offset.x > 100) {
      handleLike();
    } else if (info.offset.x < -100) {
      handleDislike();
    }
    x.set(0);
  };

  const handleLike = async () => {
    if (currentIndex >= displayJobs.length || swipeInProgress) return;

    const job = displayJobs[currentIndex];
    setSwipeInProgress(true);

    try {
      if (user && profile) {
        const response = await likeJob(user.uid, job.id);
        if (!response.success) {
          toast(response.error || "Failed to save your preference");
        }
      }

      // Update local state
      setLikedJobIds((prev) => {
        const updated = [...prev, job.id];
        const totalIds = updated.length + dislikedJobIds.length;

        if (totalIds >= 3 && profile) {
          if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current); // Clear the previous timeout
          }

          debounceTimeout.current = setTimeout(() => {
            setLoadingAnalysis(true); // Start loading state
            analyzeUserPreferences(user!.uid, profile.name).then(
              ({ analysis, error }) => {
                setLoadingAnalysis(false); // Stop loading state
                if (analysis) {
                  setAnalysisResult(analysis); // Display the actual analysis result
                  toast.success("Preference Analysis Updated");
                } else if (error) {
                  console.error("Preference Analysis Error:", error);
                }
              }
            );
          }, 3000); // Debounce time of 3 seconds
        }

        return updated;
      });
      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error("Error liking job:", error);
      toast("Failed to save your preference");
    } finally {
      setSwipeInProgress(false);
    }
  };

  const handleDislike = async () => {
    if (currentIndex >= displayJobs.length || swipeInProgress) return;

    const job = displayJobs[currentIndex];
    setSwipeInProgress(true);

    try {
      if (user && profile) {
        const response = await dislikeJob(user.uid, job.id);
        if (!response.success) {
          toast(response.error || "Failed to save your preference");
        }
      }

      // Update local state
      setDislikedJobIds((prev) => {
        const updated = [...prev, job.id];
        const totalIds = likedJobIds.length + updated.length;

        if (totalIds >= 3 && profile) {
          if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current); // Clear the previous timeout
          }

          debounceTimeout.current = setTimeout(() => {
            setLoadingAnalysis(true); // Start loading state
            analyzeUserPreferences(user!.uid, profile.name).then(
              ({ analysis, error }) => {
                setLoadingAnalysis(false); // Stop loading state
                if (analysis) {
                  setAnalysisResult(analysis); // Display the actual analysis result
                  toast.success("Preference Analysis Updated");
                } else if (error) {
                  console.error("Preference Analysis Error:", error);
                }
              }
            );
          }, 3000); // Debounce time of 3 seconds
        }

        return updated;
      });
      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error("Error disliking job:", error);
      toast("Failed to save your preference");
    } finally {
      setSwipeInProgress(false);
    }
  };

  const handleRefresh = () => {
    fetchJobsAndInitSwipes();
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        {/* Pink themed header */}
        <div className="relative mb-10 text-center md:text-left">
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-100 rounded-full opacity-60 -z-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200 rounded-full opacity-40 -z-10"></div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-4">
            JOB FINDER
            <Sparkles className="h-4 w-4 ml-2 text-pink-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 mb-4">
            Job <span className="text-pink-600">Swipe</span>
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Find your perfect job match with our intuitive swipe interface.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center h-[500px]">
          <div className="bg-pink-50 rounded-full p-4">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
          <p className="mt-4 text-slate-600">Loading jobs for you...</p>
        </div>
      </div>
    );
  }

  const currentJob = displayJobs[currentIndex];
  const isFinished = currentIndex >= displayJobs.length;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Pink themed header */}
      <div className="relative mb-10 text-center md:text-left">
        <div className="absolute top-0 right-0 w-20 h-20 bg-pink-100 rounded-full opacity-60 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200 rounded-full opacity-40 -z-10"></div>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-4">
          JOB FINDER
          <Sparkles className="h-4 w-4 ml-2 text-pink-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 mb-4">
          Job <span className="text-pink-600">Swipe</span>
        </h1>
        <p className="text-slate-600 max-w-2xl">
          Find your perfect job match with our intuitive swipe interface.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="flex flex-col items-center justify-center">
            <div
              className="relative w-full max-w-md h-[500px] mx-auto"
              ref={dragConstraintsRef}
            >
              {isFinished ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <h2 className="text-2xl font-bold mb-4 text-slate-800">
                    No more jobs to show!
                  </h2>
                  <p className="text-slate-600 mb-6">
                    You&apos;ve liked {likedJobIds.length} jobs and disliked{" "}
                    {dislikedJobIds.length} jobs.
                  </p>
                  <Button
                    className="bg-pink-600 hover:bg-pink-700"
                    onClick={handleRefresh}
                  >
                    Refresh Jobs
                  </Button>
                </div>
              ) : (
                <motion.div
                  className="absolute w-full h-full"
                  drag="x"
                  dragConstraints={dragConstraintsRef}
                  onDragEnd={handleDragEnd}
                  style={{ x, rotate, opacity: cardOpacity }}
                  whileTap={{ cursor: "grabbing" }}
                >
                  <Card className="w-full h-full overflow-hidden border border-pink-100 shadow-md">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <motion.div
                        className="bg-green-500 text-white text-2xl font-bold rounded-full p-6 rotate-12"
                        style={{ opacity: likeOpacity }}
                      >
                        LIKE
                      </motion.div>
                      <motion.div
                        className="bg-red-500 text-white text-2xl font-bold rounded-full p-6 -rotate-12"
                        style={{ opacity: dislikeOpacity }}
                      >
                        PASS
                      </motion.div>
                    </div>

                    <CardHeader className="pb-2 bg-gradient-to-r from-pink-50 to-transparent">
                      <CardTitle className="text-xl text-slate-800">
                        {currentJob.title}
                      </CardTitle>
                      <div className="flex items-center text-slate-600">
                        <Building className="h-4 w-4 mr-1" />
                        <span>{currentJob.company_name}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 overflow-auto max-h-[300px]">
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-pink-500" />
                          <span className="text-slate-600">
                            {currentJob.company_location}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-pink-500" />
                          <span className="text-slate-600">
                            {formatSalary(
                              currentJob.minimum_salary,
                              currentJob.maximum_salary
                            )}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1 text-pink-500" />
                          <span className="text-slate-600">
                            {currentJob.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {currentJob.is_remote && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            Remote
                          </Badge>
                        )}
                        {Object.values(currentJob.required_skills).map(
                          (tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-pink-100 text-pink-800 hover:bg-pink-200"
                            >
                              {tag}
                            </Badge>
                          )
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-1">
                          Description
                        </h3>
                        <div className="text-sm max-h-[120px] overflow-auto pr-2 text-slate-600">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: currentJob.description,
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent pt-16 pb-4">
                      <div className="flex justify-between w-full">
                        <Button
                          variant="outline"
                          size="lg"
                          className="rounded-full h-14 w-14 bg-white dark:bg-gray-800 border-pink-200 hover:bg-pink-50"
                          onClick={handleDislike}
                          disabled={swipeInProgress}
                        >
                          {swipeInProgress ? (
                            <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
                          ) : (
                            <ThumbsDown className="h-6 w-6 text-red-500" />
                          )}
                          <span className="sr-only">Dislike</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="rounded-full h-14 w-14 bg-white dark:bg-gray-800 border-pink-200 hover:bg-pink-50"
                          onClick={handleLike}
                          disabled={swipeInProgress}
                        >
                          {swipeInProgress ? (
                            <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
                          ) : (
                            <ThumbsUp className="h-6 w-6 text-green-500" />
                          )}
                          <span className="sr-only">Like</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}
            </div>

            <div className="mt-8 text-center">
              <p className="text-slate-600 mb-2">
                Swipe right for jobs you like, left for those you don&apos;t
              </p>
              <p className="text-sm text-slate-500">
                {isFinished
                  ? `You've viewed all available jobs`
                  : `Showing job ${currentIndex + 1} of ${displayJobs.length}`}
              </p>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/3">
          <Card className="border border-pink-100 shadow-md">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-transparent">
              <CardTitle className="text-xl text-slate-800">
                Your Job Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {loadingAnalysis ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-pink-600" />
                  <span>Analyzing your preferences...</span>
                </div>
              ) : (
                <ReactMarkdown>
                  {analysisResult || "No analysis result available yet."}
                </ReactMarkdown>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
