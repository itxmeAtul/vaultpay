import React, { useEffect, useState, useMemo } from "react";

/**
 * Props
 * - title: string
 * - fetchHook: function({ page, pageSize, search, filters }) => { data, isLoading, isFetching, error, refetch }
 *   (a RTK Query hook invocation wrapper, see examples)
 * - columns: [{ key, label, width?, render?: (row) => node }]
 * - rowKey: string (default: "_id")
 * - actions?: (row) => node  // render action buttons for each row
 * - pageSizes?: [10,20,50]
 * - initialPageSize?: number
 * - extraControls?: node (slot for filters / buttons)
 */
export default function Layout({
  title,
  fetchHook,
  columns,
  rowKey = "_id",
  actions,
  pageSizes = [10, 20, 50],
  initialPageSize = 10,
  extraControls,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [filters, setFilters] = useState({}); // optional filters object

  // call user's fetchHook (wrapper around RTK Query hook)
  const { data, isLoading, isFetching, error, refetch } = fetchHook({
    page,
    pageSize,
    search: debouncedSearch,
    filters,
  });

  const items = data?.items || data?.users || [];
  const total = data?.total ?? data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    // when pageSize/search/filters change, reset to page 1
    setPage(1);
  }, [pageSize, debouncedSearch, JSON.stringify(filters)]);

  const onRefresh = () => refetch?.();

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-gray-500">{total} results</p>
        </div>

        <div className="flex items-center gap-3">
          {extraControls}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="border rounded p-2 w-64"
          />
          <button
            onClick={onRefresh}
            className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-sm font-semibold text-gray-600 ${
                    col.width ?? ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y">
            {isLoading || isFetching ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="p-6 text-center"
                >
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="p-6 text-center text-gray-500"
                >
                  No results found
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row[rowKey]}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}

                  {actions && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="inline-flex gap-2">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer: pagination */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50">
          {/* page size */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded p-1"
            >
              {pageSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>

          {/* pager */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            {generatePageNumbers(page, totalPages).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 border rounded ${
                  p === page ? "bg-orange-600 text-white" : ""
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------
   Helpers
   ------------------------- */
function useDebounce(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function generatePageNumbers(current, total) {
  // produce a short pagination range: [1, ..., 4,5,6, ..., total]
  const delta = 2;
  const range = [];
  for (
    let i = Math.max(1, current - delta);
    i <= Math.min(total, current + delta);
    i++
  ) {
    range.push(i);
  }
  if (range[0] !== 1) range.unshift(1);
  if (range[0] > 2) range.splice(1, 0, "...");
  if (range[range.length - 1] !== total) range.push("...");
  if (range[range.length - 1] !== total) range.push(total);
  // clean up duplicates
  return range.filter((x, i) => range.indexOf(x) === i);
}
