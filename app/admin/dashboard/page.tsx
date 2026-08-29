"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminStats, getDepartments } from "@/lib/queries";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    departments: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    activeLinks: 0,
  });
  const [departments, setDepartments] = useState<
    { id: string; name: string; color: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, d] = await Promise.all([getAdminStats(), getDepartments()]);
      if (s) setStats(s);
      if (d.data) setDepartments(d.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-cncp-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    {
      label: "Departments",
      value: stats.departments,
      href: "/admin/schedules",
      color: "bg-blue-50 text-blue-600",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: "Total Bookings",
      value: stats.totalBookings,
      href: "/admin/schedules",
      color: "bg-purple-50 text-purple-600",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: "Confirmed",
      value: stats.confirmedBookings,
      href: "/admin/schedules",
      color: "bg-green-50 text-green-600",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Active Links",
      value: stats.activeLinks,
      href: "/admin/links",
      color: "bg-amber-50 text-amber-600",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 anim-fade-in-up">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5"
          >
            <div
              className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center mb-3`}
            >
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-cncp-blue-dark">
              {card.value}
            </p>
            <p className="text-xs font-medium text-cncp-blue/40 mt-0.5">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Departments */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-cncp-blue-dark">
            Departments
          </h3>
          <Link
            href="/admin/schedules"
            className="text-xs font-semibold text-cncp-blue hover:text-cncp-blue-dark transition-colors"
          >
            Manage
          </Link>
        </div>
        {departments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-cncp-blue/30 text-sm">
              No departments yet. Create one in the{" "}
              <Link
                href="/admin/schedules"
                className="text-cncp-blue font-semibold hover:underline"
              >
                Schedules
              </Link>{" "}
              page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f0f4fa] border border-cncp-blue/5"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: dept.color }}
                />
                <span className="text-sm font-semibold text-cncp-blue-dark">
                  {dept.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/schedules"
          className="bg-cncp-blue-dark rounded-2xl p-6 text-white hover:bg-cncp-blue transition-colors duration-200 shadow-[0_2px_16px_rgba(15,35,64,0.2)]"
        >
          <svg className="w-6 h-6 text-cncp-yellow mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="font-bold text-sm">Manage Schedules</p>
          <p className="text-white/40 text-xs mt-1">
            Set date ranges and time slots per department
          </p>
        </Link>
        <Link
          href="/admin/links"
          className="bg-white rounded-2xl p-6 border border-cncp-blue/10 hover:border-cncp-yellow/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200"
        >
          <svg className="w-6 h-6 text-cncp-blue mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="font-bold text-sm text-cncp-blue-dark">
            Create Interview Links
          </p>
          <p className="text-cncp-blue/40 text-xs mt-1">
            Generate shareable booking URLs for groups
          </p>
        </Link>
      </div>
    </div>
  );
}
