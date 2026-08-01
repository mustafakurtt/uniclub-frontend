import type { SelectHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Native `<select>` — global `select-field` stilini uygular. */
export default function SelectField({ className = "", ...props }: SelectFieldProps) {
  return <select className={className ? `select-field ${className}` : "select-field"} {...props} />;
}
