import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forgot Password - My Jarvis Gua",
  description: "Reset your password",
  robots: {
    index: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full sm:w-110">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Forgot Password</h1>

          <p className="mt-2 text-sm text-gray-500">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus:outline-none focus:underline">
              Login -&gt;
            </Link>
          </p>
        </div>

        <div className="text-center py-12">
          <p className="text-gray-500">Password reset form coming soon...</p>
        </div>
      </div>
    </div>
  );
}
