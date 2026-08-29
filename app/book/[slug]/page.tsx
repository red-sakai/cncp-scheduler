"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getInterviewLinkBySlug,
  getAvailableDates,
  createBooking,
  getCurrentUser,
  getProfile,
} from "@/lib/queries";
import type { TimeRange } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const ALL_SLOTS = [
  "7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM",
  "10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM",
  "12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM",
];

interface LinkData {
  id: string;
  department_id: string;
  slug: string;
  title: string;
  description: string | null;
  date_from: string;
  date_to: string;
  is_active: boolean;
  departments: { name: string; color: string } | null;
}

const parseTime = (t: string): number => {
  const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [link, setLink] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ id: string; fullName: string; email: string } | null>(null);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [availableDates, setAvailableDates] = useState<
    { id: string; date: string; time_ranges: TimeRange[] }[]
  >([]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const linkDateFrom = link ? new Date(link.date_from + "T00:00:00") : null;
  const linkDateTo = link ? new Date(link.date_to + "T00:00:00") : null;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [currentMonth, currentYear]);

  useEffect(() => {
    async function load() {
      const { user: authUser } = await getCurrentUser();
      if (!authUser) {
        router.push(`/signin?redirect=/book/${slug}`);
        return;
      }
      const { data: profile } = await getProfile(authUser.id);
      if (profile) {
        setUser({
          id: authUser.id,
          fullName: profile.full_name,
          email: profile.email,
        });
      }

      if (!slug) return;
      const { data, error } = await getInterviewLinkBySlug(slug);
      if (error || !data) {
        setError("This interview link is invalid or has expired.");
        setLoading(false);
        return;
      }
      setLink(data as LinkData);
      setLoading(false);
    }
    load();
  }, [slug, router]);

  useEffect(() => {
    if (!link) return;
    async function loadDates() {
      const { data } = await getAvailableDates(
        link!.department_id,
        currentYear,
        currentMonth
      );
      if (data) {
        const filtered = data.filter((d) => {
          const date = new Date(d.date + "T00:00:00");
          return date >= linkDateFrom! && date <= linkDateTo!;
        });
        setAvailableDates(filtered as { id: string; date: string; time_ranges: TimeRange[] }[]);
      }
    }
    loadDates();
  }, [link, currentYear, currentMonth]);

  useEffect(() => {
    if (!selectedDate) return;
    async function loadBooked() {
      const { data } = await supabase
        .from("bookings")
        .select("full_name")
        .eq("department_id", link!.department_id)
        .eq("available_date_id", selectedDate!)
        .eq("status", "confirmed");
      if (data) {
        setBookedSlots(data.map((b) => b.full_name));
      }
    }
    loadBooked();
  }, [selectedDate, link]);

  const dateStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isInLinkRange = (day: number) => {
    if (!linkDateFrom || !linkDateTo) return false;
    const d = new Date(currentYear, currentMonth, day);
    return d >= linkDateFrom && d <= linkDateTo;
  };

  const isAvailable = (day: number) =>
    isInLinkRange(day) && availableDates.some((d) => d.date === dateStr(day));

  const isPast = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };

  const handleDateClick = (day: number) => {
    if (!isAvailable(day) || isPast(day)) return;
    setSelectedDate(dateStr(day));
    setSelectedTime(null);
  };

  const selectedDateEntry = useMemo(
    () => availableDates.find((d) => d.date === selectedDate) ?? null,
    [availableDates, selectedDate]
  );

  const availableTimeSlots = useMemo(() => {
    if (!selectedDateEntry || !selectedDateEntry.time_ranges?.length) return [];
    const slots: string[] = [];
    for (const slot of ALL_SLOTS) {
      const slotMin = parseTime(slot);
      const inRange = selectedDateEntry.time_ranges.some((r) => {
        return slotMin >= parseTime(r.start) && slotMin < parseTime(r.end);
      });
      if (inRange) slots.push(slot);
    }
    return slots;
  }, [selectedDateEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !link || !user) return;

    setSubmitting(true);
    const { error } = await createBooking({
      user_id: user.id,
      department_id: link.department_id,
      available_date_id: selectedDate,
      time_slot_id: selectedTime,
      full_name: user.fullName,
      email: user.email,
      notes: notes.trim() || null,
    });

    if (error) {
      alert("Booking failed: " + error.message);
      setSubmitting(false);
      return;
    }

    try {
      await fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.fullName,
          email: user.email,
          department: link.departments?.name ?? "Department",
          date: selectedDate,
          time: selectedTime,
        }),
      });
    } catch {
      // Email failure shouldn't block the booking
    }

    setSubmitting(false);
    setSuccess(true);
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e8edf4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cncp-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-[#e8edf4] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
          <svg className="w-12 h-12 text-red-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-lg font-bold text-cncp-blue-dark mb-2">
            Link Not Found
          </h2>
          <p className="text-sm text-cncp-blue/40 mb-6">{error}</p>
          <Link
            href="/"
            className="cncp-btn-primary !w-auto !px-6 inline-block"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#e8edf4] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full anim-scale-in">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-cncp-blue-dark mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-sm text-cncp-blue/40 mb-1">
            {link.departments?.name}
          </p>
          <p className="text-sm text-cncp-blue/60 mb-6">
            {selectedDate} at {selectedTime}
          </p>
          <p className="text-xs text-cncp-blue/30 mb-6">
            A confirmation has been sent to {user?.email}.
          </p>
          <Link
            href="/"
            className="cncp-btn-primary !w-auto !px-6 inline-block"
          >
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8edf4]">
      {/* Header */}
      <div className="bg-cncp-blue-dark">
        <div className="max-w-4xl mx-auto px-5 py-5 flex items-center gap-3">
          <Image
            src="/cncp-fb-logo.jpg"
            alt="CNCP Logo"
            width={36}
            height={36}
            className="w-9 h-9 rounded-lg object-cover"
          />
          <div>
            <h1 className="text-white text-sm font-bold">{link.title}</h1>
            <p className="text-white/40 text-xs">{link.departments?.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8">
        {link.description && (
          <p className="text-sm text-cncp-blue/50 mb-6">{link.description}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={prevMonth}
                className="w-9 h-9 rounded-lg bg-cncp-blue/5 flex items-center justify-center text-cncp-blue hover:bg-cncp-blue hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-base font-bold text-cncp-blue-dark">
                {MONTHS[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={nextMonth}
                className="w-9 h-9 rounded-lg bg-cncp-blue/5 flex items-center justify-center text-cncp-blue hover:bg-cncp-blue hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-bold text-cncp-blue/40 uppercase tracking-wider py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />;
                const avail = isAvailable(day);
                const past = isPast(day);
                const selected = selectedDate === dateStr(day);

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    disabled={past || !avail}
                    className={`cal-day ${past || !avail ? "cal-disabled" : ""} ${
                      selected ? "cal-selected" : ""
                    } ${avail && !past ? "hover:bg-cncp-blue/10 cursor-pointer" : ""}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-cncp-blue/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cncp-blue" />
                <span className="text-[11px] font-medium text-cncp-blue/50">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-gray-200 rounded-full" />
                <span className="text-[11px] font-medium text-cncp-blue/50">Unavailable</span>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Time slots */}
            {selectedDate && (
              <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 anim-fade-in-up">
                <h3 className="text-xs font-bold text-cncp-blue-dark uppercase tracking-wider mb-3">
                  Available Times
                </h3>
                {availableTimeSlots.length === 0 ? (
                  <p className="text-xs text-cncp-blue/30">
                    No time ranges configured for this date.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableTimeSlots.map((slot) => {
                      const sel = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`slot-pill ${sel ? "slot-selected" : ""}`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Booking form */}
            {selectedDate && selectedTime && (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 anim-fade-in-up"
              >
                <h3 className="text-xs font-bold text-cncp-blue-dark uppercase tracking-wider mb-3">
                  Your Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f0f4fa]">
                    <div className="w-8 h-8 rounded-full bg-cncp-blue/10 flex items-center justify-center text-cncp-blue text-xs font-bold flex-shrink-0">
                      {user?.fullName?.charAt(0) ?? "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-cncp-blue-dark truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-[11px] text-cncp-blue/40 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    rows={2}
                    className="cncp-input !text-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cncp-btn-primary mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              </form>
            )}

            {!selectedDate && (
              <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 text-center">
                <svg className="w-8 h-8 text-cncp-blue/15 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-cncp-blue/30 text-xs font-medium">
                  Select a date on the calendar to see available times.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
