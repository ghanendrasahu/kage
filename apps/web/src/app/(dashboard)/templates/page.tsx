"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Loader2, Mail, Plus, Trash2 } from "lucide-react";

import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTemplates = React.useCallback(async () => {
    try {
      const res = await fetch("/api/templates", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template? Campaigns using it keep their sent copy.")) {
      return;
    }
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not delete the template");
      }
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates"
        description="Reusable copy blocks for email and LinkedIn. Variables resolve from the prospect record at generation time."
        actions={
          <Link
            href="/templates/new"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            <Plus />
            New template
          </Link>
        }
      />

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-card border border-line bg-surface p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-3 w-16" />
              <Skeleton className="mt-4 h-16 w-full" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No templates yet"
          description="Start with one strong email and one LinkedIn note. Templates keep your voice consistent while the research changes per account."
          action={
            <Link
              href="/templates/new"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <Plus />
              Create your first template
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <article
              key={template.id}
              className="group flex flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg border border-line bg-elevated text-subtle">
                  {template.channel === "EMAIL" ? (
                    <Mail className="size-4" />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3.5a1.96 1.96 0 100 3.92 1.96 1.96 0 000-3.92zM20.44 20h-3.38v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V20H9.65V8.5h3.25v1.57h.05c.45-.86 1.56-1.77 3.2-1.77 3.43 0 4.06 2.26 4.06 5.2V20z" />
                    </svg>
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  {template.is_default ? (
                    <Badge variant="success" dot>
                      Default
                    </Badge>
                  ) : null}
                  <Badge variant="outline">{template.channel}</Badge>
                </div>
              </div>

              <h2 className="mt-3 text-[13px] font-semibold text-foreground">
                {template.name}
              </h2>
              {template.subject ? (
                <p className="mt-1 text-[11px] text-subtle">Subject: {template.subject}</p>
              ) : null}
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[12px] leading-relaxed text-muted">
                {template.body}
              </p>

              {template.variables && template.variables.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.variables.slice(0, 6).map((variable) => (
                    <span
                      key={variable}
                      className="rounded border border-line bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-subtle"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-[11px] text-subtle">
                <span>Created {formatDate(template.created_at)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTemplate(template.id)}
                  disabled={deleting === template.id}
                  className="text-subtle hover:bg-danger/10 hover:text-danger"
                >
                  {deleting === template.id ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 />
                  )}
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
