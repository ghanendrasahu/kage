"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  variables: string[] | null;
  is_default: boolean;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (res.ok) fetchTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
        <Link
          href="/templates/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Template
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            Loading...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            No templates yet. Create your first template to reuse across campaigns.
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                  <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    {template.channel}
                  </span>
                </div>
                {template.is_default && (
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Default
                  </span>
                )}
              </div>
              {template.subject && (
                <p className="mt-2 text-sm text-gray-500">Subject: {template.subject}</p>
              )}
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">{template.body}</p>
              {template.variables && template.variables.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.variables.map((v) => (
                    <span
                      key={v}
                      className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button className="text-sm text-indigo-600 hover:text-indigo-900">Edit</button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="text-sm text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
