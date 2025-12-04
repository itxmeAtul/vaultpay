import React from "react";

export default function DataTable({ columns, rows, rowKey, actions }) {
  return (
    <div className="overflow-x-auto rounded shadow bg-white">
      <table className="w-full text-sm">
        <thead className="bg-primaary border-b">
          <tr>
            {columns.map((col, key) => (
              <th
                key={col.key || key}
                className={`p-3 text-left font-semibold text-gray-700 ${
                  col.width ?? ""
                }`}
              >
                {col.label}
              </th>
            ))}

            {actions && (
              <th className="p-3 text-right font-semibold text-gray-700">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="p-6 text-center text-gray-500"
              >
                No results found
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={idx}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-3">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}

                {actions && <td className="p-3 text-right">{actions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
