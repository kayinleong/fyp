import Link from "next/link";
import type { Metadata } from "next";
import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | RabbitJob",
  description: "Login to your RabbitJob account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
      {/* Header with logo */}

      {/* Main login card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 border border-blue-100">
        <h1 className="text-2xl font-semibold mb-6 text-blue-800">Sign in</h1>

        <LoginForm />

        <div className="mt-4 text-center">
          <p className="text-sm">
            New to RabbitJob?{" "}
            <Link
              href="/signup"
              className="text-blue-600 font-medium hover:underline"
            >
              Join now
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mt-8 text-center text-sm text-gray-500">
        <p>
          By signing in, you agree to RabbitJob&apos;s{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            User Agreement
          </Link>
          ,{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/cookies" className="text-blue-600 hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
