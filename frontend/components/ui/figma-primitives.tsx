"use client";

import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function FigmaCard({
  children,
  className,
  onClick
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800",
        onClick ? "cursor-pointer hover:shadow-lg" : "",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

type FigmaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
};

export function FigmaButton({ children, className, disabled, loading, variant = "primary", ...props }: FigmaButtonProps) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
    secondary:
      "border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
    ghost: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-gray-900",
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}

type FigmaInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: LucideIcon;
  invalid?: boolean;
};

export function FigmaInput({ className, icon: Icon, invalid, label, ...props }: FigmaInputProps) {
  return (
    <label className="block">
      {label ? <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span> : null}
      <span className="relative block">
        {Icon ? <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /> : null}
        <input
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100",
            Icon ? "pl-10" : "",
            invalid ? "border-red-500 focus:ring-red-500" : "",
            className
          )}
          aria-invalid={invalid}
          {...props}
        />
      </span>
    </label>
  );
}

type FigmaSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  invalid?: boolean;
};

export function FigmaSelect({ children, className, invalid, label, ...props }: FigmaSelectProps) {
  return (
    <label className="block">
      {label ? <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span> : null}
      <select
        className={cn(
          "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100",
          invalid ? "border-red-500 focus:ring-red-500" : "",
          className
        )}
        aria-invalid={invalid}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

type FigmaTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  invalid?: boolean;
};

export function FigmaTextarea({ className, invalid, label, ...props }: FigmaTextareaProps) {
  return (
    <label className="block">
      {label ? <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span> : null}
      <textarea
        className={cn(
          "w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100",
          invalid ? "border-red-500 focus:ring-red-500" : "",
          className
        )}
        aria-invalid={invalid}
        {...props}
      />
    </label>
  );
}

export function FigmaModal({
  children,
  isOpen,
  onClose,
  title,
  size = "md"
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!isOpen) {
    return null;
  }

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl"
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="figma-modal-title"
        className={cn("max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800", sizes[size])}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 id="figma-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}
