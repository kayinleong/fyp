import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic, FileText, ArrowRight, History, Sparkles } from "lucide-react";
import ResumeAnalysisHistory from "@/components/resume-analysis/resume-analysis-history";

export default function AIToolkitPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header with decorative elements */}
      <div className="relative mb-16 text-center md:text-left">
        <div className="absolute top-0 right-0 w-20 h-20 bg-pink-100 rounded-full opacity-60 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200 rounded-full opacity-40 -z-10"></div>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-4">
          AI TOOLS
          <Sparkles className="h-4 w-4 ml-2 text-pink-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 mb-4">
          Career <span className="text-pink-600">AI Toolkit</span>
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto md:mx-0">
          Leverage artificial intelligence to dramatically improve your job
          search outcomes and career prospects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* AI Mock Interview Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100 relative h-full flex flex-col">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-full -mr-8 -mt-8 z-0"></div>

          <div className="p-8 relative z-10 flex-1 flex flex-col">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center mr-4">
                <Mic className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  AI Mock Interview
                </h2>
                <p className="text-slate-500 text-sm">
                  Practice your interview skills with our AI interviewer
                </p>
              </div>
            </div>

            <div className="bg-pink-50 rounded-xl p-6 mb-6">
              <p className="text-slate-700">
                Our AI interviewer will ask you relevant questions based on your
                desired job position and experience level. Speak your answers
                and get real-time feedback to improve your interview skills.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Features
              </h3>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                <li className="flex items-center text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                  Personalized questions
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                  Speech analysis
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                  Detailed feedback
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                  Unlimited practice
                </li>
              </ul>
            </div>

            <div className="mt-auto">
              <Button
                asChild
                className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-xl py-6"
              >
                <Link
                  href="/ai-toolkit/mock-interview"
                  className="flex items-center justify-center"
                >
                  Start Mock Interview <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Resume PDF Commentor Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100 relative h-full flex flex-col">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-full -mr-8 -mt-8 z-0"></div>

          <div className="p-8 relative z-10 flex-1 flex flex-col">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center mr-4">
                <FileText className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Resume PDF Commentor
                </h2>
                <p className="text-slate-500 text-sm">
                  Get AI feedback on your resume to stand out
                </p>
              </div>
            </div>

            <div className="bg-pink-50 rounded-xl p-6 mb-6">
              <p className="text-slate-700">
                Upload your resume in PDF format and our AI will analyze it,
                providing detailed feedback on areas for improvement to help you
                land more interviews.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Features
              </h3>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                <li className="flex items-center text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                  Structure analysis
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                  Content suggestions
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                  Industry insights
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-2"></div>
                  ATS optimization
                </li>
              </ul>
            </div>

            <div className="mt-auto">
              <div className="flex space-x-3">
                <Button
                  asChild
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-xl py-6"
                >
                  <Link
                    href="/ai-toolkit/resume-analyzer"
                    className="flex items-center justify-center"
                  >
                    Analyze My Resume <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <ResumeAnalysisHistory>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </ResumeAnalysisHistory>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
