import * as React from "react";

export function Button({
  children,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={
        "inline-flex items-center justify-center px-4 py-2 rounded-md font-medium " +
        "bg-orange-600 text-white hover:bg-orange-700 active:scale-95 transition " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
