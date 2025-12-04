import React from "react";
import { Button } from "@/components/ui/button";

export default function Pagination({ page, totalPages, onChange }) {
  const pages = generatePages(page, totalPages);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </Button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={i} className="px-2 text-gray-500">
            ...
          </span>
        ) : (
          <Button
            key={i}
            variant={p === page ? "default" : "outline"}
            className={p === page ? "bg-orange-600 text-white" : ""}
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

/* Pagination generator */
function generatePages(current, total) {
  if (total <= 7) return [...Array(total)].map((_, i) => i + 1);

  const pages = [];
  pages.push(1);

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}
