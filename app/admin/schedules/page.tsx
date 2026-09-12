"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
  getAvailableDates,
  bulkCreateAvailableDates,
  deleteAvailableDate,
  updateAvailableDate,
} from "@/lib/queries";
import type { TimeRange } from "@/lib/queries";

const COLORS = [
  "#1a3a6b",
  "#2c5282",
  "#d4a017",
  "#059669",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#c2410c",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const TIME_OPTIONS = [
  "7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM",
  "10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM",
  "12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM",
];

function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg bg-white border border-cncp-blue/10 text-xs font-semibold text-cncp-blue-dark hover:border-cncp-blue/25 transition-colors"
      >
        <span className="truncate">{value}</span>
        <svg className={`w-3 h-3 text-cncp-blue/30 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 mt-1 w-full bg-white border border-cncp-blue/10 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto"
            onWheel={(e) => e.stopPropagation()}
          >
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                  value === t
                    ? "bg-cncp-blue text-white"
                    : "text-cncp-blue-dark hover:bg-cncp-blue/5"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface DateEntry {
  id: string;
  date: string;
  time_ranges: TimeRange[];
}

export default function SchedulesPage() {
  const [departments, setDepartments] = useState<
    { id: string; name: string; color: string }[]
  >([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptColor, setDeptColor] = useState(COLORS[0]);
  const [showNewDept, setShowNewDept] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [availableDates, setAvailableDates] = useState<DateEntry[]>([]);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [modalEntry, setModalEntry] = useState<DateEntry | null>(null);
  const [modalRanges, setModalRanges] = useState<TimeRange[]>([]);
  const [saving, setSaving] = useState(false);

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
      const { data } = await getDepartments();
      if (data) {
        setDepartments(data);
        if (data.length > 0 && !selectedDept) {
          setSelectedDept(data[0].id);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedDept) return;
    async function loadDates() {
      const { data } = await getAvailableDates(selectedDept!, currentYear, currentMonth);
      if (data) {
        setAvailableDates(data as DateEntry[]);
        setSelectedDates(new Set(data.map((d) => d.date)));
      }
    }
    loadDates();
  }, [selectedDept, currentYear, currentMonth]);

  const dateStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isAvailable = (day: number) => selectedDates.has(dateStr(day));

  const openModal = (day: number, entry?: DateEntry) => {
    if (!selectedDept) return;
    const ds = dateStr(day);
    const existing = entry ?? availableDates.find((d) => d.date === ds);
    setModalDate(ds);
    setModalEntry(existing ?? null);
    setModalRanges(existing?.time_ranges?.length ? [...existing.time_ranges] : []);
    setModalOpen(true);
  };

  const handleDateClick = async (day: number) => {
    if (!selectedDept) return;
    const ds = dateStr(day);
    const d = new Date(currentYear, currentMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d < t) return;

    if (!selectedDates.has(ds)) {
      const { data } = await bulkCreateAvailableDates(selectedDept, [ds]);
      if (data && data[0]) {
        const entry = data[0] as DateEntry;
        setSelectedDates((prev) => new Set(prev).add(ds));
        setAvailableDates((prev) => [...prev, entry]);
        openModal(day, entry);
        return;
      }
    }
    openModal(day);
  };

  const addRange = () => {
    setModalRanges((prev) => [...prev, { start: "9:00 AM", end: "5:00 PM" }]);
  };

  const updateRange = (index: number, field: "start" | "end", value: string) => {
    setModalRanges((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const removeRange = (index: number) => {
    setModalRanges((prev) => prev.filter((_, i) => i !== index));
  };

  const saveRanges = async () => {
    setSaving(true);
    try {
      if (modalEntry) {
        if (modalRanges.length === 0) {
          await deleteAvailableDate(modalEntry.id);
          setSelectedDates((prev) => {
            const next = new Set(prev);
            next.delete(modalDate);
            return next;
          });
          setAvailableDates((prev) => prev.filter((d) => d.date !== modalDate));
        } else {
          const { data, error } = await updateAvailableDate(modalEntry.id, {
            time_ranges: modalRanges,
          });
          if (error) {
            alert("Failed to save: " + error.message);
            setSaving(false);
            return;
          }
          if (data) {
            setAvailableDates((prev) =>
              prev.map((d) => (d.id === data.id ? (data as DateEntry) : d))
            );
          }
        }
      } else if (modalRanges.length > 0) {
        const { data: created, error: createErr } = await bulkCreateAvailableDates(selectedDept!, [modalDate]);
        if (createErr || !created || !created[0]) {
          alert("Failed to create date: " + (createErr?.message ?? "unknown"));
          setSaving(false);
          return;
        }
        const { data: updated, error: updateErr } = await updateAvailableDate(created[0].id, {
          time_ranges: modalRanges,
        });
        if (updateErr) {
          alert("Failed to save time ranges: " + updateErr.message);
          setSaving(false);
          return;
        }
        setSelectedDates((prev) => new Set(prev).add(modalDate));
        setAvailableDates((prev) => [
          ...prev.filter((d) => d.date !== modalDate),
          (updated as DateEntry) ?? (created[0] as DateEntry),
        ]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      alert("Error saving: " + msg);
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    const { data } = await createDepartment({
      name: deptName.trim(),
      color: deptColor,
    });
    if (data) {
      setDepartments((prev) => [...prev, data]);
      setSelectedDept(data.id);
      setDeptName("");
      setDeptColor(COLORS[0]);
      setShowNewDept(false);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Delete this department and all its dates?")) return;
    await deleteDepartment(id);
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (selectedDept === id) {
      setSelectedDept(departments.find((d) => d.id !== id)?.id ?? null);
    }
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-cncp-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedDeptData = departments.find((d) => d.id === selectedDept);

  return (
    <div className="space-y-6 anim-fade-in-up">
      {/* Department selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-cncp-blue-dark mb-3">
            Departments
          </h3>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                  selectedDept === dept.id
                    ? "bg-cncp-blue text-white border-cncp-blue shadow-lg shadow-cncp-blue/20"
                    : "bg-white text-cncp-blue-dark border-cncp-blue/10 hover:border-cncp-blue/30"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: dept.color }}
                />
                {dept.name}
                {selectedDept === dept.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDept(dept.id);
                    }}
                    className="ml-1 text-white/50 hover:text-red-300"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </button>
            ))}
            <button
              onClick={() => setShowNewDept(!showNewDept)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-dashed border-cncp-blue/20 text-cncp-blue/40 hover:border-cncp-blue/40 hover:text-cncp-blue transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Dept
            </button>
          </div>
        </div>
      </div>

      {/* New department form */}
      {showNewDept && (
        <form
          onSubmit={handleCreateDept}
          className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 anim-scale-in"
        >
          <h4 className="text-xs font-bold text-cncp-blue-dark mb-3 uppercase tracking-wider">
            New Department
          </h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              placeholder="e.g., Operations"
              className="cncp-input !py-2.5 !text-sm flex-1"
              autoFocus
            />
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDeptColor(c)}
                  className={`w-7 h-7 rounded-lg transition-all duration-150 ${
                    deptColor === c
                      ? "ring-2 ring-offset-2 ring-cncp-blue scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <button type="submit" className="cncp-btn-primary !w-auto !px-5 !py-2.5 !text-sm">
              Create
            </button>
          </div>
        </form>
      )}

      {selectedDept && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
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
                const d = new Date(currentYear, currentMonth, day);
                const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const past = d < t;

                return (
                  <button
                    key={day}
                    onClick={() => !past && handleDateClick(day)}
                    disabled={past}
                    className={`cal-day ${past ? "cal-disabled" : ""} ${
                      avail ? "cal-selected" : ""
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-5 mt-5 pt-4 border-t border-cncp-blue/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: selectedDeptData?.color ?? "#1a3a6b" }} />
                <span className="text-[11px] font-medium text-cncp-blue/50">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#f3eefa] rounded-full border border-cncp-blue/10" />
                <span className="text-[11px] font-medium text-cncp-blue/50">Click to set time ranges</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 h-fit">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: selectedDeptData?.color ?? "#1a3a6b" }}
              />
              <h3 className="text-sm font-bold text-cncp-blue-dark">
                {selectedDeptData?.name}
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f3eefa]">
                <span className="text-xs font-medium text-cncp-blue/50">
                  Available Dates
                </span>
                <span className="text-sm font-bold text-cncp-blue-dark">
                  {selectedDates.size}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f3eefa]">
                <span className="text-xs font-medium text-cncp-blue/50">
                  Month
                </span>
                <span className="text-sm font-semibold text-cncp-blue-dark">
                  {MONTHS[currentMonth]} {currentYear}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-cncp-blue/30 mt-4 leading-relaxed">
              Click a date to open it and set available time ranges (e.g.,
              9:00 AM - 1:00 PM, then 4:00 PM - 5:00 PM). Multiple ranges per
              date are supported.
            </p>
          </div>
        </div>
      )}

      {!selectedDept && departments.length === 0 && (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-10 text-center">
          <svg className="w-10 h-10 text-cncp-blue/15 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-cncp-blue/40 text-sm font-medium">
            Create a department to start managing schedules.
          </p>
        </div>
      )}

      {/* Time Range Modal */}
      {modalOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md anim-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-cncp-blue-dark">
                    Time Ranges
                  </h3>
                  <p className="text-xs text-cncp-blue/40 mt-0.5">{modalDate}</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-cncp-blue/5 flex items-center justify-center text-cncp-blue/40 hover:text-cncp-blue hover:bg-cncp-blue/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalRanges.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-cncp-blue/10 rounded-xl mb-4">
                  <svg className="w-8 h-8 text-cncp-blue/15 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-cncp-blue/30 text-xs font-medium">
                    No time ranges set. Click &ldquo;Add Range&rdquo; below.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 mb-4">
                  {modalRanges.map((range, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-3 rounded-xl bg-[#f3eefa] border border-cncp-blue/5"
                    >
                      <TimeSelect
                        value={range.start}
                        onChange={(v) => updateRange(i, "start", v)}
                      />
                      <span className="text-cncp-blue/30 text-xs font-bold flex-shrink-0">
                        to
                      </span>
                      <TimeSelect
                        value={range.end}
                        onChange={(v) => updateRange(i, "end", v)}
                      />
                      <button
                        onClick={() => removeRange(i)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-cncp-blue/20 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={addRange}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-cncp-blue/15 text-cncp-blue/40 text-xs font-semibold hover:border-cncp-blue/30 hover:text-cncp-blue transition-colors mb-4"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Range
              </button>

              <div className="flex gap-2">
                <button
                  onClick={saveRanges}
                  disabled={saving}
                  className="cncp-btn-primary !w-auto !px-5 !py-2.5 !text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="cncp-btn-secondary !w-auto !px-5 !py-2.5 !text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
