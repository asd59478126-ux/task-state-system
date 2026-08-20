import { clsx } from "./clsx";

const baseInputClass =
  "w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-neutral-800 ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all";

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={baseInputClass}
      />
    </div>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={clsx(baseInputClass, "resize-y")}
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={clsx(baseInputClass, "cursor-pointer")}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
