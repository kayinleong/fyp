"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  analyzeResume,
  AnalysisResult,
} from "@/lib/actions/resume-analyzer.action";
import { toast } from "sonner";

export default function ResumeAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!file) return;

    try {
      setIsUploading(true);

      // Create FormData and append file
      const formData = new FormData();
      formData.append("resume", file);

      // Upload and start analysis
      setIsUploading(false);
      setIsAnalyzing(true);

      // Call server action to analyze resume
      const results = await analyzeResume(formData);

      setAnalysisResults(results);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast("There was an error analyzing your resume. Please try again.");
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setAnalysisComplete(false);
    setAnalysisResults(null);
  };

  const getSectionScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header with decorative elements */}
        <div className="relative mb-16 text-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-100 rounded-full opacity-60 -z-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200 rounded-full opacity-40 -z-10"></div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-4">
            RESUME TOOL
            <FileText className="h-4 w-4 ml-2 text-pink-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 mb-4">
            Resume <span className="text-pink-600">PDF Analyzer</span>
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Get AI-powered feedback on your resume to improve your chances of
            landing interviews
          </p>
        </div>

        {!analysisComplete ? (
          <Card className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100 mb-8">
            <CardHeader className="bg-white border-b border-gray-100">
              <CardTitle className="text-slate-800">
                Upload Your Resume
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center">
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />

                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="h-16 w-16 text-pink-600 mb-4" />
                    <p className="font-medium mb-1 text-slate-800">
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleUploadClick}
                      className="border-gray-200 text-pink-600 hover:bg-gray-50"
                    >
                      Choose a different file
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-16 w-16 text-pink-600 mb-4" />
                    <p className="font-medium mb-1 text-slate-800">
                      Drag and drop your resume PDF
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      or click to browse files
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleUploadClick}
                      className="border-gray-200 text-pink-600 hover:bg-gray-50"
                    >
                      Select PDF File
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-sm text-slate-600 bg-gray-50 p-4 rounded-xl">
                <p className="font-medium text-slate-800 mb-2">
                  Your resume will be analyzed by our AI to provide feedback on:
                </p>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <li className="flex items-center text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                    Content and formatting
                  </li>
                  <li className="flex items-center text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                    ATS compatibility
                  </li>
                  <li className="flex items-center text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                    Keyword optimization
                  </li>
                  <li className="flex items-center text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                    Improvement areas
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleAnalyze}
                disabled={!file || isUploading || isAnalyzing}
                className="w-full bg-pink-600 hover:bg-pink-700 py-6 rounded-xl"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Resume...
                  </>
                ) : (
                  "Analyze Resume"
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100 mb-8">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-slate-800">
                    Resume Analysis Results
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-pink-600">
                      {analysisResults?.score}/100
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6 p-4 bg-pink-50 rounded-xl">
                  <p className="text-slate-700">{analysisResults?.summary}</p>
                </div>

                <Tabs defaultValue="overview">
                  <TabsList className="mb-4 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm rounded-md"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="sections"
                      className="data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm rounded-md"
                    >
                      Section Analysis
                    </TabsTrigger>
                    <TabsTrigger
                      value="keywords"
                      className="data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm rounded-md"
                    >
                      Keyword Analysis
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center text-slate-800">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        Strengths
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {analysisResults?.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center text-slate-800">
                        <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                        Areas for Improvement
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {analysisResults?.improvements.map(
                          (improvement, index) => (
                            <li key={index}>{improvement}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="sections" className="space-y-4">
                    {analysisResults &&
                      Object.entries(analysisResults.sectionFeedback).map(
                        ([section, data]) => (
                          <div
                            key={section}
                            className="border border-gray-100 rounded-xl p-4 bg-gray-50"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold capitalize text-slate-800">
                                {section}
                              </h3>
                              <span
                                className={`font-bold ${getSectionScoreColor(
                                  data.score
                                )}`}
                              >
                                {data.score}/100
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">
                              {data.feedback}
                            </p>
                          </div>
                        )
                      )}
                  </TabsContent>

                  <TabsContent value="keywords" className="space-y-4">
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                      <h3 className="font-semibold mb-2 text-slate-800">
                        Keywords Analysis
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        This section provides insights about keywords in your
                        resume based on the AI analysis.
                      </p>
                      <div className="p-4 bg-pink-50 rounded-xl">
                        <p className="text-slate-700">
                          Based on your target role and industry, consider
                          adding more relevant keywords to improve ATS
                          compatibility. See your &quot;Areas for
                          Improvement&quot; section for specific guidance.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  onClick={resetAnalysis}
                  className="w-full bg-pink-600 hover:bg-pink-700 rounded-xl py-6"
                >
                  Analyze Another Resume
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
