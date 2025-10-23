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
import { AnalysisResult } from "@/lib/actions/resume-analyzer.action";
import { getResumeAnalysisById } from "@/lib/actions/resume-analyzer-history.action";

interface ResumeAnalysisDetailsDialogProps {
  children: ReactNode;
  analysisId: string;
}

export default function ResumeAnalysisDetailsDialog({
  children,
  analysisId,
}: ResumeAnalysisDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<{
    id: string;
    fileName: string;
    fileUrl: string;
    createdAt: { seconds: number; nanoseconds: number };
    analysis: AnalysisResult;
  } | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      if (open && analysisId) {
        setLoading(true);
        try {
          const data = await getResumeAnalysisById(analysisId);
          setAnalysis(data);
        } catch (error) {
          console.error("Failed to fetch resume analysis:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchAnalysis();
  }, [open, analysisId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>Resume Analysis Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full pr-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="w-full h-8" />
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-full h-32" />
              <Skeleton className="w-full h-24" />
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{analysis.fileName}</h3>
                <p className="text-sm text-muted-foreground">
                  Analyzed {formatDate(analysis.createdAt.seconds * 1000)}
                </p>
                <div className="flex items-center mt-2">
                  <div className="text-2xl font-bold">
                    {analysis.analysis.score}/100
                  </div>
                  <div className="text-sm text-muted-foreground ml-2">
                    Overall Score
                  </div>
                </div>
              </div>

              <Tabs defaultValue="summary">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="strengths">Strengths</TabsTrigger>
                  <TabsTrigger value="improvements">Improvements</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  <TabsTrigger value="original">Original</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                  <div className="p-4 border rounded-md">
                    <p>{analysis.analysis.summary}</p>
                  </div>
                </TabsContent>

                <TabsContent value="strengths">
                  <div className="p-4 border rounded-md">
                    <ul className="list-disc pl-5 space-y-2">
                      {analysis.analysis.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="improvements">
                  <div className="p-4 border rounded-md">
                    <ul className="list-disc pl-5 space-y-2">
                      {analysis.analysis.improvements.map((improvement, i) => (
                        <li key={i}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="feedback">
                  <div className="space-y-4">
                    {Object.entries(analysis.analysis.sectionFeedback).map(
                      ([section, data]) => (
                        <div key={section} className="p-4 border rounded-md">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-medium capitalize">
                              {section}
                            </h4>
                            <span className="text-sm">{data.score}/100</span>
                          </div>
                          <p className="text-sm">{data.feedback}</p>
                        </div>
                      )
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="original">
                  <div className="p-4 border rounded-md">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {analysis.analysis.extractedText || "No text available"}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>

              {analysis.fileUrl && (
                <div className="mt-4">
                  <a
                    href={analysis.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View Original PDF
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Analysis not found or an error occurred.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
