"use client";

import { useState, useEffect, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import ResumeAnalysisDetailsDialog from "./resume-analysis-details-dialog";
import { getResumeAnalysisHistory } from "@/lib/actions/resume-analyzer-history.action";

interface ResumeAnalysisHistoryProps {
  children: ReactNode;
}

interface HistoryItem {
  id: string;
  fileName: string;
  fileUrl: string;
  score: number;
  createdAt: { seconds: number; nanoseconds: number };
}

export default function ResumeAnalysisHistory({
  children,
}: ResumeAnalysisHistoryProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (open) {
        setLoading(true);
        try {
          const historyData = await getResumeAnalysisHistory();
          setHistory(historyData);
        } catch (error) {
          console.error("Failed to fetch resume analysis history:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchHistory();
  }, [open]);

  function formatDate(seconds: number) {
    const date = new Date(seconds * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Resume Analysis History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="mb-4 flex flex-col space-y-2">
                  <Skeleton className="w-full h-8" />
                  <Skeleton className="w-3/4 h-4" />
                  <div className="flex justify-between">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-20 h-8" />
                  </div>
                </div>
              ))
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No resume analysis history found.
            </div>
          ) : (
            history.map((item) => (
              <Card key={item.id} className="mb-4">
                <CardContent className="pt-4">
                  <div className="font-medium truncate">{item.fileName}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Score: {item.score}/100
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.createdAt.seconds)}
                    </span>
                    <ResumeAnalysisDetailsDialog analysisId={item.id}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center"
                      >
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                    </ResumeAnalysisDetailsDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
