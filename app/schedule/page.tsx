"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getProfile, getBookingsByEmail, cancelBooking } from "@/lib/queries";

interface BookingEntry {
  id: string;
  full_name: string;
  email: string;
  status: string;
  notes: string | null;
  created_at: string;
  available_dates: { date: string } | null;
  booking_time: string;
  departments: { name: string; color: string } | null;
}

export default function SchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      const { data: prof } = await getProfile(user.id);
      if (prof) {
        setProfile(prof);
        const { data } = await getBookingsByEmail(prof.email);
        if (data) setBookings(data as BookingEntry[]);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(id);
    await cancelBooking(id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
    );
    setCancelling(null);
  };

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.available_dates?.date
  );
  const past = bookings.filter(
    (b) => b.status !== "confirmed" || !b.available_dates?.date
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ede5f7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cncp-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ede5f7]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-cncp-blue-dark/95 backdrop-blur-md border-b border-cncp-blue/20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/cncp-partnership-logo.png"
              alt="CNCP Logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-cover transition-transform duration-200 group-hover:rotate-[-4deg]"
            />
            <span className="text-white font-semibold text-sm tracking-tight hidden sm:block">
              CNCP Scheduler
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-white/40 text-xs font-medium hidden sm:block">
              {profile?.email}
            </span>
            <Link
              href="/"
              className="text-white/60 hover:text-white text-sm font-medium transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="mb-7 anim-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-cncp-blue-dark tracking-tight">
            My Interviews
          </h1>
          <p className="text-cncp-blue/50 text-sm mt-1">
            View and manage your scheduled interviews.
          </p>
        </div>

        {/* Upcoming */}
        <div className="mb-8 anim-fade-in-up delay-1">
          <h2 className="text-xs font-bold text-cncp-blue/40 uppercase tracking-wider mb-3">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-cncp-blue/5 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-cncp-blue/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-cncp-blue-dark font-bold text-sm mb-1">
                No interviews scheduled yet
              </p>
              <p className="text-cncp-blue/30 text-xs mb-5">
                You&apos;ll see your upcoming interviews here once you book one.
              </p>
              <Link
                href="/"
                className="cncp-btn-primary !w-auto !px-6 inline-block !text-sm"
              >
                Go to Home
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: (b.departments?.color ?? "#1a3a6b") + "15" }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={b.departments?.color ?? "#1a3a6b"} strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: b.departments?.color ?? "#1a3a6b" }}
                        />
                        <p className="text-sm font-bold text-cncp-blue-dark truncate">
                          {b.departments?.name ?? "Department"}
                        </p>
                      </div>
                      <p className="text-xs text-cncp-blue/40">
                        {b.available_dates?.date} &middot; {b.booking_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 sm:ml-4">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-50 text-green-600 uppercase tracking-wider">
                      Confirmed
                    </span>
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancelling === b.id}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-400 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {cancelling === b.id ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past / Cancelled */}
        {past.length > 0 && (
          <div className="anim-fade-in-up delay-2">
            <h2 className="text-xs font-bold text-cncp-blue/40 uppercase tracking-wider mb-3">
              Past & Cancelled
            </h2>
            <div className="space-y-2">
              {past.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-xl shadow-[0_1px_6px_rgba(0,0,0,0.03)] p-4 flex items-center gap-4 opacity-60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cncp-blue-dark truncate">
                      {b.departments?.name ?? "Department"}
                    </p>
                    <p className="text-xs text-cncp-blue/40">
                      {b.available_dates?.date} &middot; {b.booking_time}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      b.status === "cancelled"
                        ? "bg-red-50 text-red-400"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
