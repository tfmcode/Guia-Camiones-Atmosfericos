"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

interface Props {
  label: string;
  name: string;
  value: string | null | undefined; // ✅ Permitir null y undefined
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  options?: { value: string; label: string }[];
  helperText?: string;
  maxLength?: number;
  showCharCount?: boolean;
}

export default function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  success,
  required = false,
  disabled = false,
  rows = 4,
  options,
  helperText,
  maxLength,
  showCharCount = false,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  // ✅ FIX: Convertir null/undefined a string vacía para evitar el warning
  const safeValue = value ?? "";

  const isPassword = type === "password";
  const isTextarea = type === "textarea";
  const isSelect = type === "select";
  const hasError = !!error;
  const hasSuccess = !!success;

  const baseInputStyles = `
    block w-full px-4 py-3 text-sm text-gray-900 placeholder-gray-500 
    border rounded-lg transition-all duration-200 focus:outline-none
    ${disabled ? "bg-gray-50 cursor-not-allowed" : "bg-white"}
    ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
        : hasSuccess
        ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
        : focused
        ? "border-blue-500 focus:border-blue-500 focus:ring-blue-500/20"
        : "border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
    }
    focus:ring-4
  `;

  const renderInput = () => {
    if (isSelect && options) {
      return (
        <select
          id={name}
          name={name}
          value={safeValue}
          onChange={onChange}
          disabled={disabled}
          className={baseInputStyles}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
        >
          <option value="" disabled>
            {placeholder || `Seleccionar ${label.toLowerCase()}`}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (isTextarea) {
      return (
        <div className="relative">
          <textarea
            id={name}
            name={name}
            value={safeValue}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            maxLength={maxLength}
            className={`${baseInputStyles} resize-none`}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required={required}
          />
          {showCharCount && maxLength && (
            <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white px-1">
              {safeValue.length}/{maxLength}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <input
          id={name}
          name={name}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={safeValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`${baseInputStyles} ${isPassword ? "pr-12" : ""}`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {showCharCount && maxLength && !isPassword && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-white px-1">
            {safeValue.length}/{maxLength}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label
        htmlFor={name}
        className={`block text-sm font-medium transition-colors ${
          hasError
            ? "text-red-700"
            : hasSuccess
            ? "text-green-700"
            : "text-gray-700"
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      {renderInput()}

      {/* Messages */}
      <div className="min-h-[20px]">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && !error && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle size={16} className="flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {helperText && !error && !success && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    </div>
  );
}
