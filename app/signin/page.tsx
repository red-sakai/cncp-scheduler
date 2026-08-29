"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getProfile } from "@/lib/queries";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await signIn(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (!authData?.user) {
      setError("Sign in failed. Please try again.");
      return;
    }

    try {
      const { data: profile } = await getProfile(authData.user.id);
      if (redirectTo) {
        router.push(redirectTo);
      } else if (profile?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/schedule");
      }
    } catch {
      router.push(redirectTo ?? "/schedule");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — hero image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="bg-cncp-hero absolute inset-0 anim-scale-in" />
        <div className="absolute inset-0 bg-gradient-to-t from-cncp-blue-dark/95 via-cncp-blue/70 to-cncp-blue-dark/60" />

        {/* Floating accent shapes */}
        <div className="absolute top-20 left-10 w-40 h-40 border border-cncp-yellow/15 rounded-2xl rotate-12 anim-fade-in delay-3" />
        <div className="absolute bottom-32 right-12 w-24 h-24 border border-white/10 rounded-full anim-fade-in delay-4" />

        <div className="relative z-10 flex flex-col justify-center px-14 xl:px-20 w-full">
          <div className="max-w-sm anim-slide-left delay-2">
            <Image
              src="/cncp-fb-logo.jpg"
              alt="CNCP Logo"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-cover mb-7 shadow-lg shadow-cncp-yellow/20"
            />
            <h2 className="text-[1.75rem] font-bold text-white leading-snug mb-3">
              Pick up where you
              <br />
              left off.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Access your scheduled interviews, manage bookings, and stay on top
              of your Cisco NetConnect activities.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white">
        <div className="w-full max-w-[22rem] mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-cncp-blue text-sm font-medium transition-colors duration-200 mb-10 anim-fade-in delay-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Home
          </Link>

          <div className="anim-fade-in-up delay-2">
            <h1 className="text-2xl font-bold text-cncp-blue-dark tracking-tight">
              Sign in
            </h1>
            <p className="text-gray-400 text-sm mt-1.5">
              Enter your credentials to continue
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 anim-fade-in-up delay-3"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={`block text-xs font-semibold mb-1.5 transition-colors duration-200 ${
                  focusedField === "email"
                    ? "text-cncp-blue"
                    : "text-gray-500"
                }`}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="you@pup.edu.ph"
                className="cncp-input"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className={`block text-xs font-semibold transition-colors duration-200 ${
                    focusedField === "password"
                      ? "text-cncp-blue"
                      : "text-gray-500"
                  }`}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-cncp-blue hover:text-cncp-blue-light transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter password"
                  className="cncp-input !pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPw ? (
                    <svg
                      className="w-4.5 h-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4.5 h-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 anim-fade-in">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cncp-btn-primary mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-400 anim-fade-in delay-5">
            Don&apos;t have an account?{" "}
            <Link
              href={redirectTo ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : "/signup"}
              className="font-semibold text-cncp-blue hover:text-cncp-blue-light transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
