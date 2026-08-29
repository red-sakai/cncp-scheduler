import { supabase } from "./supabase";

// ─── Types ───────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface AvailableDate {
  id: string;
  department_id: string;
  date: string;
  is_active: boolean;
  time_ranges: TimeRange[];
  created_by: string | null;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  available_date_id: string;
  time: string;
  is_taken: boolean;
  created_at: string;
}

export interface InterviewLink {
  id: string;
  department_id: string;
  slug: string;
  title: string;
  description: string | null;
  date_from: string;
  date_to: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string | null;
  department_id: string;
  available_date_id: string;
  time_slot_id: string;
  full_name: string;
  email: string;
  status: "confirmed" | "cancelled" | "completed";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Auth ────────────────────────────────────────

export async function signUp(
  fullName: string,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

// ─── Profile ─────────────────────────────────────

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data: data as Profile | null, error };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await getProfile(userId);
  return data?.role === "admin";
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "full_name" | "email">>
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  return { data: data as Profile | null, error };
}

// ─── Departments ─────────────────────────────────

export async function getDepartments() {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true });
  return { data: data as Department[] | null, error };
}

export async function createDepartment(
  dept: Omit<Department, "id" | "created_at">
) {
  const { data, error } = await supabase
    .from("departments")
    .insert(dept)
    .select()
    .single();
  return { data: data as Department | null, error };
}

export async function updateDepartment(
  id: string,
  updates: Partial<Pick<Department, "name" | "color">>
) {
  const { data, error } = await supabase
    .from("departments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data: data as Department | null, error };
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase.from("departments").delete().eq("id", id);
  return { error };
}

// ─── Available Dates ─────────────────────────────

export async function getAvailableDates(
  departmentId?: string,
  year?: number,
  month?: number
) {
  let query = supabase
    .from("available_dates")
    .select("*")
    .order("date", { ascending: true });

  if (departmentId) query = query.eq("department_id", departmentId);
  if (year !== undefined && month !== undefined) {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = new Date(year, month + 1, 0)
      .toISOString()
      .split("T")[0];
    query = query.gte("date", startDate).lte("date", endDate);
  }

  const { data, error } = await query;
  return { data: data as AvailableDate[] | null, error };
}

export async function createAvailableDate(
  deptId: string,
  date: string,
  createdBy?: string
) {
  const { data, error } = await supabase
    .from("available_dates")
    .insert({ department_id: deptId, date, created_by: createdBy })
    .select()
    .single();
  return { data: data as AvailableDate | null, error };
}

export async function deleteAvailableDate(id: string) {
  const { error } = await supabase
    .from("available_dates")
    .delete()
    .eq("id", id);
  return { error };
}

export async function updateAvailableDate(
  id: string,
  updates: Partial<Pick<AvailableDate, "time_ranges" | "is_active">>
) {
  const { data, error } = await supabase
    .from("available_dates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data: data as AvailableDate | null, error };
}

export async function bulkCreateAvailableDates(
  deptId: string,
  dates: string[],
  createdBy?: string
) {
  const rows = dates.map((date) => ({
    department_id: deptId,
    date,
    created_by: createdBy,
  }));
  const { data, error } = await supabase
    .from("available_dates")
    .insert(rows)
    .select();
  return { data: data as AvailableDate[] | null, error };
}

// ─── Time Slots ──────────────────────────────────

export async function getTimeSlots(availableDateId: string) {
  const { data, error } = await supabase
    .from("time_slots")
    .select("*")
    .eq("available_date_id", availableDateId)
    .order("time", { ascending: true });
  return { data: data as TimeSlot[] | null, error };
}

export async function getAvailableTimeSlots(availableDateId: string) {
  const { data, error } = await supabase
    .from("time_slots")
    .select("*")
    .eq("available_date_id", availableDateId)
    .eq("is_taken", false)
    .order("time", { ascending: true });
  return { data: data as TimeSlot[] | null, error };
}

export async function createTimeSlots(
  availableDateId: string,
  times: string[]
) {
  const rows = times.map((time) => ({
    available_date_id: availableDateId,
    time,
  }));
  const { data, error } = await supabase
    .from("time_slots")
    .insert(rows)
    .select();
  return { data: data as TimeSlot[] | null, error };
}

// ─── Interview Links ─────────────────────────────

export async function getInterviewLinks() {
  const { data, error } = await supabase
    .from("interview_links")
    .select("*, departments(name, color)")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getInterviewLinkBySlug(slug: string) {
  const { data, error } = await supabase
    .from("interview_links")
    .select("*, departments(name, color)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return { data, error };
}

export async function createInterviewLink(
  link: Omit<
    InterviewLink,
    "id" | "created_at" | "is_active"
  >
) {
  const { data, error } = await supabase
    .from("interview_links")
    .insert({ ...link, is_active: true })
    .select()
    .single();
  return { data: data as InterviewLink | null, error };
}

export async function updateInterviewLink(
  id: string,
  updates: Partial<
    Pick<
      InterviewLink,
      "title" | "description" | "date_from" | "date_to" | "is_active"
    >
  >
) {
  const { data, error } = await supabase
    .from("interview_links")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data: data as InterviewLink | null, error };
}

export async function deleteInterviewLink(id: string) {
  const { error } = await supabase
    .from("interview_links")
    .delete()
    .eq("id", id);
  return { error };
}

// ─── Bookings ────────────────────────────────────

export async function createBooking(
  booking: Omit<Booking, "id" | "created_at" | "updated_at" | "status">
) {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: booking.user_id,
      department_id: booking.department_id,
      available_date_id: booking.available_date_id,
      time_slot_id: booking.time_slot_id,
      full_name: booking.full_name,
      email: booking.email,
      notes: booking.notes,
    })
    .select()
    .single();
  return { data: data as Booking | null, error };
}

export async function getUserBookings(userId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, available_dates(date), departments(name, color)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getBookingsByEmail(email: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, available_dates(date), departments(name, color)"
    )
    .eq("email", email)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getAllBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, available_dates(date), departments(name)"
    )
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getBookingsByDepartment(departmentId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, available_dates(date)"
    )
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function cancelBooking(bookingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select()
    .single();
  return { data: data as Booking | null, error };
}

export async function getBookingById(bookingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, available_dates(date), departments(name)"
    )
    .eq("id", bookingId)
    .single();
  return { data, error };
}

// ─── Admin Stats ─────────────────────────────────

export async function getAdminStats() {
  const [depts, totalBookings, confirmedBookings, activeLinks] =
    await Promise.all([
      supabase
        .from("departments")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed"),
      supabase
        .from("interview_links")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

  return {
    departments: depts.count ?? 0,
    totalBookings: totalBookings.count ?? 0,
    confirmedBookings: confirmedBookings.count ?? 0,
    activeLinks: activeLinks.count ?? 0,
  };
}
