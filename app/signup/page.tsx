"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/queries";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pwStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const strengthColor = [
    "",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
  ][pwStrength];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const { error: authError } = await signUp(
      form.fullName,
      form.email,
      form.password
    );
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/schedule");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — form */}
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
              Create your account
            </h1>
            <p className="text-gray-400 text-sm mt-1.5">
              Start scheduling in under a minute
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-3.5 anim-fade-in-up delay-3"
          >
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className={`block text-xs font-semibold mb-1.5 transition-colors duration-200 ${
                  focusedField === "fullName"
                    ? "text-cncp-blue"
                    : "text-gray-500"
                }`}
              >
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                onFocus={() => setFocusedField("fullName")}
                onBlur={() => setFocusedField(null)}
                placeholder="Juan Dela Cruz"
                className="cncp-input"
              />
            </div>

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
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="you@pup.edu.ph"
                className="cncp-input"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className={`block text-xs font-semibold mb-1.5 transition-colors duration-200 ${
                  focusedField === "password"
                    ? "text-cncp-blue"
                    : "text-gray-500"
                }`}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Min. 8 characters"
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
              {/* Strength bar */}
              {form.password && (
                <div className="mt-2 flex items-center gap-2 anim-fade-in">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= pwStrength ? strengthColor : "bg-gray-100"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 w-12 text-right">
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className={`block text-xs font-semibold mb-1.5 transition-colors duration-200 ${
                  focusedField === "confirmPassword"
                    ? "text-cncp-blue"
                    : "text-gray-500"
                }`}
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPw ? "text" : "password"}
                required
                value={form.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                placeholder="Re-enter password"
                className={`cncp-input ${
                  form.confirmPassword &&
                  form.password !== form.confirmPassword
                    ? "!border-red-300 focus:!ring-red-200"
                    : ""
                }`}
              />
              {form.confirmPassword &&
                form.password !== form.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1.5 anim-fade-in">
                    Passwords don&apos;t match
                  </p>
                )}
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 anim-fade-in">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cncp-btn-primary mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400 anim-fade-in delay-5">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-cncp-blue hover:text-cncp-blue-light transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — hero image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="bg-cncp-hero absolute inset-0 anim-scale-in" />
        <div className="absolute inset-0 bg-gradient-to-t from-cncp-blue-dark/95 via-cncp-blue/70 to-cncp-blue-dark/60" />

        {/* Floating accent shapes */}
        <div className="absolute top-24 right-16 w-32 h-32 border border-cncp-yellow/15 rounded-2xl -rotate-6 anim-fade-in delay-3" />
        <div className="absolute bottom-28 left-14 w-20 h-20 border border-white/10 rounded-full anim-fade-in delay-4" />

        <div className="relative z-10 flex flex-col justify-center px-14 xl:px-20 w-full">
          <div className="max-w-sm anim-slide-right delay-2">
            <Image
              src="/cncp-fb-logo.jpg"
              alt="CNCP Logo"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-cover mb-7 shadow-lg shadow-cncp-yellow/20"
            />
            <h2 className="text-[1.75rem] font-bold text-white leading-snug mb-3">
              Schedule smarter,
              <br />
              not harder.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              One account gives you access to all available interview and meeting
              slots with Cisco NetConnect PUP — Manila.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
