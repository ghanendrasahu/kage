"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  className?: string;
}) {
  const pages = Math.max(1, totalPages);

  return (
    <div
      className={`flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <p className="tabular-nums">
        Page <span className="font-medium text-foreground">{page}</span> of {pages}
        {typeof totalItems === "number" ? (
          <span className="text-subtle"> · {totalItems} total</span>
        ) : null}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(Math.min(pages, page + 1))}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
