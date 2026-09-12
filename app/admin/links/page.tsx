"use client";

import { useEffect, useState } from "react";
import {
  getDepartments,
  getInterviewLinks,
  createInterviewLink,
  deleteInterviewLink,
  updateInterviewLink,
} from "@/lib/queries";

function generateSlug() {
  return (
    Math.random().toString(36).substring(2, 8) +
    Math.random().toString(36).substring(2, 6)
  );
}

export default function LinksPage() {
  const [departments, setDepartments] = useState<
    { id: string; name: string; color: string }[]
  >([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [form, setForm] = useState({
    department_id: "",
    title: "",
    description: "",
    date_from: "",
    date_to: "",
    slug: generateSlug(),
  });

  useEffect(() => {
    async function load() {
      const [d, l] = await Promise.all([getDepartments(), getInterviewLinks()]);
      if (d.data) {
        setDepartments(d.data);
        if (d.data.length > 0)
          setForm((f) => ({ ...f, department_id: d.data![0].id }));
      }
      if (l.data) setLinks(l.data);
      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department_id || !form.title || !form.date_from || !form.date_to)
      return;

    const { data } = await createInterviewLink({
      department_id: form.department_id,
      title: form.title,
      description: form.description || null,
      date_from: form.date_from,
      date_to: form.date_to,
      slug: form.slug,
      created_by: null,
    });

    if (data) {
      const dept = departments.find((d) => d.id === form.department_id);
      setLinks((prev) => [{ ...data, departments: dept ? { name: dept.name, color: dept.color } : null }, ...prev]);
      setForm({
        department_id: departments[0]?.id ?? "",
        title: "",
        description: "",
        date_from: "",
        date_to: "",
        slug: generateSlug(),
      });
      setShowForm(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await updateInterviewLink(id, { is_active: !isActive });
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, is_active: !isActive } : l))
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this interview link?")) return;
    await deleteInterviewLink(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-cncp-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 anim-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-cncp-blue/40 font-medium">
          {links.length} link{links.length !== 1 && "s"} created
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="cncp-btn-primary !w-auto !px-5 !py-2.5 !text-sm"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Link
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 anim-scale-in"
        >
          <h4 className="text-xs font-bold text-cncp-blue-dark mb-4 uppercase tracking-wider">
            Create Interview Link
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-cncp-blue/50 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={form.department_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department_id: e.target.value }))
                }
                className="cncp-input !py-2.5 !text-sm"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-cncp-blue/50 uppercase tracking-wider mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g., Operations Interview - Batch 1"
                className="cncp-input !py-2.5 !text-sm"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-cncp-blue/50 uppercase tracking-wider mb-1.5">
                Description (optional)
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description for the booking page"
                className="cncp-input !py-2.5 !text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-cncp-blue/50 uppercase tracking-wider mb-1.5">
                Date From
              </label>
              <input
                type="date"
                value={form.date_from}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date_from: e.target.value }))
                }
                className="cncp-input !py-2.5 !text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-cncp-blue/50 uppercase tracking-wider mb-1.5">
                Date To
              </label>
              <input
                type="date"
                value={form.date_to}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date_to: e.target.value }))
                }
                className="cncp-input !py-2.5 !text-sm"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-cncp-blue/50 uppercase tracking-wider mb-1.5">
                Link Slug
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  className="cncp-input !py-2.5 !text-sm flex-1 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, slug: generateSlug() }))}
                  className="px-3 py-2 rounded-xl bg-cncp-blue/5 text-cncp-blue text-xs font-semibold hover:bg-cncp-blue/10 transition-colors"
                >
                  Randomize
                </button>
              </div>
              <p className="text-[10px] text-cncp-blue/30 mt-1 font-mono">
                /book/{form.slug}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button type="submit" className="cncp-btn-primary !w-auto !px-6 !py-2.5 !text-sm">
              Create Link
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="cncp-btn-secondary !w-auto !px-5 !py-2.5 !text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Links list */}
      {links.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-10 text-center">
          <svg className="w-10 h-10 text-cncp-blue/15 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-cncp-blue/40 text-sm font-medium">
            No interview links yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className={`bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-opacity duration-200 ${
                !link.is_active ? "opacity-50" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      background: link.departments?.color ?? "#1a3a6b",
                    }}
                  />
                  <h4 className="text-sm font-bold text-cncp-blue-dark truncate">
                    {link.title}
                  </h4>
                  {!link.is_active && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-md">
                      INACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-cncp-blue/40 mb-2">
                  {link.departments?.name} &middot; {link.date_from} to{" "}
                  {link.date_to}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-[11px] font-mono text-cncp-blue/50 bg-[#f3eefa] px-2 py-1 rounded-md">
                    /book/{link.slug}
                  </code>
                  <button
                    onClick={() => copyLink(link.slug)}
                    className="text-[11px] font-semibold text-cncp-blue hover:text-cncp-blue-dark transition-colors"
                  >
                    {copied === link.slug ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(link.id, link.is_active)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    link.is_active
                      ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {link.is_active ? "Active" : "Disabled"}
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-400 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
