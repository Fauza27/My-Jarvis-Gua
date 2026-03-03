import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Register - My Jarvis Gua",
  description: "Create your My Jarvis Gua account",
  robots: {
    index: false,
  },
};

export default function RegisterPage() {
  return (
    <div className="w-full sm:w-110">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Account</h1>

          <p className="mt-2 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus:outline-none focus:underline">
              Login -&gt;
            </Link>
          </p>
        </div>

        <div className="text-center py-12">
          <p className="text-gray-500">Registration form coming soon...</p>
        </div>
      </div>
    </div>
  );
}
