import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Briefcase, Search, Zap, Heart, X } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Note: The Header component should be added in your layout.tsx, not here */}
      {/* The pt-16 class above creates space for the fixed header */}

      <main className="flex-grow -pt-16">
        {/* Hero Section with Pink Gradient Background */}
        <section className="relative bg-gradient-to-br from-pink-100 via-pink-300 to-pink-500 overflow-hidden">
          {/* Background wave effect */}
          <div className="absolute inset-0 opacity-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              className="absolute bottom-0"
            >
              <path
                fill="#ffffff"
                fillOpacity="1"
                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>
          <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-slate-800 leading-none text-center md:text-left">
                  Your Career&apos;s
                  <br />
                  <span className="inline-block bg-gray-200 px-2 py-1">
                    Second
                  </span>
                  <span className="inline-block bg-pink-500 text-white px-2 py-1 ml-2">
                    Chance.
                  </span>
                </h1>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-800 mt-4 text-center md:text-left">
                  Job Matching.
                </h2>
                <p className="mt-6 text-lg text-slate-700 max-w-xl text-center md:text-left mx-auto md:mx-0">
                  Perfect for graduates and career changers. Find your path
                  forward
                  <span className="italic font-medium">
                    {" "}
                    objectively with artificial intelligence.
                  </span>
                </p>
                <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8"
                  >
                    <Link href="/signup">Sign up for free</Link>
                  </Button>
                </div>
              </div>

              {/* Phone Mockup with Job Swipe */}
              <div className="relative flex justify-center">
                <div className="relative w-[280px] h-[560px] bg-white rounded-[36px] shadow-2xl border-4 border-gray-800 overflow-hidden">
                  {/* Phone Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>

                  {/* Phone Screen Content */}
                  <div className="relative h-full w-full bg-gray-50 pt-8 overflow-hidden">
                    {/* App Header */}
                    <div className="px-4 py-2 flex items-center justify-between bg-white shadow-sm">
                      <div className="text-lg font-bold text-red-600">
                        KL2PEN
                      </div>
                      <div className="text-sm text-gray-500">Job Swipe</div>
                    </div>

                    {/* Job Card */}
                    <div className="relative mx-4 mt-4 bg-white rounded-xl shadow-lg border border-gray-200 h-[320px] overflow-hidden">
                      <div className="h-32 bg-pink-500"></div>
                      <div className="absolute top-24 left-4 w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-white overflow-hidden">
                        <Briefcase className="h-8 w-8 text-pink-500" />
                      </div>
                      <div className="pt-10 px-4">
                        <h3 className="font-bold text-lg">
                          Entry-Level Marketing
                        </h3>
                        <p className="text-gray-600 text-sm">
                          GrowthBrand Inc.
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs mr-2">
                            Graduate-Friendly
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            $40K-55K
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">
                          Perfect for recent graduates looking to start their
                          marketing career...
                        </p>
                      </div>
                    </div>

                    {/* Swipe Buttons */}
                    <div className="absolute bottom-20 left-0 right-0 flex justify-center space-x-8">
                      <button className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200">
                        <X className="h-8 w-8 text-red-500" />
                      </button>
                      <button className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200">
                        <Heart className="h-8 w-8 text-green-500" />
                      </button>
                    </div>

                    {/* Swipe Indicators */}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                      <div className="w-8 h-32 bg-red-500/10 rounded-r-full flex items-center justify-end pr-1">
                        <X className="h-6 w-6 text-red-500" />
                      </div>
                    </div>
                    <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                      <div className="w-8 h-32 bg-green-500/10 rounded-l-full flex items-center justify-start pl-1">
                        <Heart className="h-6 w-6 text-green-500" />
                      </div>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4">
                      <div className="flex flex-col items-center">
                        <Briefcase className="h-6 w-6 text-red-600" />
                        <span className="text-xs mt-1">Jobs</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Zap className="h-6 w-6 text-gray-400" />
                        <span className="text-xs mt-1">Swipe</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Search className="h-6 w-6 text-gray-400" />
                        <span className="text-xs mt-1">Search</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animated Swipe Effect */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]">
                  <div className="absolute top-0 left-0 w-full h-full animate-pulse opacity-0">
                    <svg
                      viewBox="0 0 200 200"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-full"
                    >
                      <path
                        fill="rgba(255,255,255,0.1)"
                        d="M45.7,-76.2C58.9,-69.2,69.2,-55.7,76.4,-41.1C83.7,-26.4,87.9,-10.7,85.9,4.1C83.9,18.9,75.7,32.8,65.8,44.9C55.9,57,44.3,67.4,30.9,73.4C17.5,79.5,2.2,81.2,-12.4,78.5C-27,75.8,-40.9,68.7,-52.5,58.5C-64.1,48.3,-73.3,35,-78.1,20.1C-82.9,5.2,-83.2,-11.2,-77.8,-25.2C-72.3,-39.2,-61.1,-50.7,-48,-59.2C-34.9,-67.7,-19.9,-73.2,-2.9,-69.2C14.1,-65.2,32.5,-83.2,45.7,-76.2Z"
                        transform="translate(100 100)"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Pink Theme */}
        <section className="py-20 bg-pink-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-16 gap-4">
              <div></div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-pink-900 text-center md:text-left">
                What We Do
              </h2>
              <div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* First Card - User Profile and Career Swipe */}
              <div className="bg-white rounded-lg p-8 shadow-lg border border-pink-100 flex flex-col h-full">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-pink-900">
                  User Profile and Career Swipe Module
                </h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Create a comprehensive profile showcasing your skills,
                  education, and career goals. Our innovative swipe interface
                  lets you quickly explore job opportunities while our AI
                  algorithms learn your preferences to deliver increasingly
                  personalized matches.
                </p>
                <Link
                  href="/swipe"
                  className="text-pink-600 hover:text-pink-700 flex items-center font-medium mt-auto"
                >
                  START SWIPING <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* Second Card - Internship and Job Management */}
              <div className="bg-white rounded-lg p-8 shadow-lg border border-pink-100 flex flex-col h-full">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-6">
                  <Briefcase className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-pink-900">
                  Internship and Job Management
                </h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Browse thousands of curated opportunities from entry-level
                  positions to specialized roles. Apply with a single click,
                  track application statuses in real-time, and receive timely
                  notifications about interviews, feedback, and important
                  updates.
                </p>
                <Link
                  href="/jobs"
                  className="text-pink-600 hover:text-pink-700 flex items-center font-medium mt-auto"
                >
                  EXPLORE JOBS <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* Third Card - Career AI Toolkit */}
              <div className="bg-white rounded-lg p-8 shadow-lg border border-pink-100 flex flex-col h-full">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-6">
                  <Search className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-pink-900">
                  Career AI Toolkit
                </h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Leverage cutting-edge AI to enhance your job search. Get
                  personalized resume feedback with industry-specific
                  optimization tips, practice interviews with our AI that
                  simulates real hiring scenarios, and access 24/7 career
                  guidance through our specialized chatbot assistant.
                </p>
                <Link
                  href="/ai-toolkit"
                  className="text-pink-600 hover:text-pink-700 flex items-center font-medium mt-auto"
                >
                  TRY AI TOOLS <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section with World Map Background */}
        <section className="py-20 bg-gray-100 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-6">
                Ready to start your career journey?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                From finding your perfect job match to landing interviews,
                KL2PEN&apos;s AI-powered platform helps you navigate your career
                path with confidence and ease.
              </p>
              <div className="flex justify-center">
                <Button
                  asChild
                  className="bg-pink-600 hover:bg-pink-700 text-white rounded-full px-8 py-4 text-lg"
                >
                  <Link
                    href="/signup"
                    className="flex items-center justify-center"
                  >
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
