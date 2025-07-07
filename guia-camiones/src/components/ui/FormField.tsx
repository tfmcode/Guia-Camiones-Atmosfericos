"use client";

interface Props {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}

export default function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: Props) {
  const inputStyles =
    "block w-full min-h-[44px] px-4 py-2.5 rounded-lg border text-sm text-zinc-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1c2e39] transition-all";

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
          className={`${inputStyles} border-gray-300 resize-none`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${inputStyles} border-gray-300`}
        />
      )}

      {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
