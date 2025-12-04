"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import DataTable from "./DataTable";
import Pagination from "./Pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ListingLayout({
  title,
  selectorKey, // example: "users"
  fetchAction, // example: getUsers
  columns,
  rowKey = "_id",
  actions,
  extraControls,
  initialPageSize = 10,
}) {
  const dispatch = useDispatch();
  const { items, total, isLoading } = useSelector((s) => s[selectorKey]);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 500);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    dispatch(
      fetchAction({
        page,
        limit: pageSize,
        search: debounced,
      })
    );
  }, [page, debounced]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-white rounded-md p-4 shadow ">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-gray-500 text-sm">{total} results</p>
        </div>

        <div className="flex items-center gap-3">
          {extraControls}

          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />

          <Button
            variant="outline"
            onClick={() =>
              dispatch(
                fetchAction({ page, limit: pageSize, search: debounced })
              )
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <DataTable
        columns={columns}
        rowKey={rowKey}
        rows={isLoading ? [] : items}
        actions={actions}
      />

      {isLoading && <p className="text-center p-4 text-gray-600">Loading...</p>}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  );
}

/* Debounce Hook */
function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value]);
  return v;
}
