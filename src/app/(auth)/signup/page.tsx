import Link from "next/link";
import type { Metadata } from "next";
import SignupForm from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up | KL2PEN",
  description: "Create a new KL2PEN account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-4">
      {/* Main signup card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 border border-pink-100">
        <h1 className="text-2xl font-semibold mb-6 text-pink-800">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your information to create a new account
        </p>

        <SignupForm />

        <div className="mt-4 text-center">
          <p className="text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-pink-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mt-8 text-center text-sm text-gray-500">
        <p>
          By clicking continue, you agree to our{" "}
          <Link href="/terms" className="text-pink-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-pink-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
