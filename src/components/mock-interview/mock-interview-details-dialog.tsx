"use client";

import { useState, useEffect, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { getMockInterviewById } from "@/lib/actions/mock-interview-history.action";
import { InterviewFeedback } from "@/lib/domains/mock-interview.domain";

interface MockInterviewDetailsDialogProps {
  children: ReactNode;
  interviewId: string;
}

export default function MockInterviewDetailsDialog({
  children,
  interviewId,
}: MockInterviewDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<{
    id: string;
    name: string;
    position: string;
    experience: string;
    questions: string[];
    responses: string[];
    feedback: InterviewFeedback | null;
    createdAt: { seconds: number; nanoseconds: number };
  } | null>(null);

  useEffect(() => {
    async function fetchInterview() {
      if (open && interviewId) {
        setLoading(true);
        try {
          const data = await getMockInterviewById(interviewId);
          setInterview(data);
        } catch (error) {
          console.error("Failed to fetch mock interview:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchInterview();
  }, [open, interviewId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>Mock Interview Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full pr-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="w-full h-8" />
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-full h-32" />
              <Skeleton className="w-full h-24" />
            </div>
          ) : interview ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{interview.position}</h3>
                <p className="text-sm text-muted-foreground">
                  Interviewed {formatDate(interview.createdAt.seconds * 1000)}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <div className="text-2xl font-bold">
                      {interview.feedback?.overallScore || 0}/10
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Overall Score
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {interview.experience} experience
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Experience Level
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="feedback">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  <TabsTrigger value="strengths">Strengths</TabsTrigger>
                  <TabsTrigger value="improvements">Improvements</TabsTrigger>
                </TabsList>

                <TabsContent value="feedback">
                  <div className="space-y-4">
                    {interview.questions.map((question, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="mb-2">
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">
                              Question {index + 1}
                            </h4>
                            <p className="font-medium">{question}</p>
                          </div>
                          <div className="mb-2">
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">
                              Your Response
                            </h4>
                            <p className="text-sm">
                              {interview.responses[index] ||
                                "No response recorded"}
                            </p>
                          </div>
                          {interview.feedback?.detailedFeedback[index] && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                Feedback
                              </h4>
                              <p className="text-sm">
                                {
                                  interview.feedback.detailedFeedback[index]
                                    .feedback
                                }
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="strengths">
                  <div className="p-4 border rounded-md">
                    <ul className="list-disc pl-5 space-y-2">
                      {interview.feedback?.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="improvements">
                  <div className="p-4 border rounded-md">
                    <ul className="list-disc pl-5 space-y-2">
                      {interview.feedback?.improvements.map((improvement, i) => (
                        <li key={i}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Interview not found or an error occurred.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

