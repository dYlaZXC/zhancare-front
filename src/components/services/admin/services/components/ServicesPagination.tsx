"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PageItem = number | "gap-left" | "gap-right";

// Always at most 7 slots so the bar doesn't jump in width while paging:
// 1 2 3 4 5 … 61  /  1 … 28 29 30 … 61  /  1 … 57 58 59 60 61
function buildPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap-right", totalPages];
  if (page >= totalPages - 3) {
    return [1, "gap-left", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "gap-left", page - 1, page, page + 1, "gap-right", totalPages];
}

export function ServicesPagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const navButton =
    "p-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
      <p className="text-sm text-gray-500 tabular-nums">
        Показано {from}–{to} из {totalCount}
      </p>

      <nav className="flex items-center gap-1" aria-label="Страницы">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={navButton}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {buildPageItems(page, totalPages).map((item) =>
          typeof item === "string" ? (
            <span key={item} className="px-1.5 text-gray-400 select-none">…</span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={`min-w-[40px] px-2 py-2 rounded-2xl border-2 text-sm font-semibold tabular-nums transition-colors ${
                item === page
                  ? "bg-sky-500 border-sky-500 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-sky-300"
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={navButton}
          aria-label="Следующая страница"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
