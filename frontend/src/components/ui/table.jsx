import * as React from "react";

export function Table({ children, className = "" }) {
  return (
    <div className="w-full overflow-auto">
      <table className={"w-full text-left border-collapse " + className}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return <thead className="bg-gray-200">{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }) {
  return <tr className="border-b hover:bg-gray-100">{children}</tr>;
}

export function TableHead({ children }) {
  return (
    <th className="p-2 font-semibold text-sm text-gray-700 uppercase tracking-wide">
      {children}
    </th>
  );
}

export function TableCell({ children }) {
  return <td className="p-2 text-sm">{children}</td>;
}
