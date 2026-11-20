"use client";

import * as RS from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export type SelectItem = { value: string; label: string; icon?: ReactNode };

/**
 * A styled, accessible dropdown built on Radix UI — keyboard-navigable, themed, and
 * consistent across browsers (unlike the native <select>).
 */
export function Select({
  value,
  onValueChange,
  items,
  ariaLabel,
  placeholder = "Select…",
  className = "",
}: {
  value: string;
  onValueChange: (value: string) => void;
  items: SelectItem[];
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <RS.Root value={value} onValueChange={onValueChange}>
      <RS.Trigger
        aria-label={ariaLabel}
        className={`inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm font-medium outline-none transition hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500/30 data-[placeholder]:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      >
        <span className="truncate">
          <RS.Value placeholder={placeholder} />
        </span>
        <RS.Icon>
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        </RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-black/5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <RS.Viewport className="p-1">
            {items.map((item) => (
              <RS.Item
                key={item.value}
                value={item.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-indigo-50 data-[highlighted]:text-indigo-900 dark:data-[highlighted]:bg-indigo-950/50 dark:data-[highlighted]:text-indigo-100"
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <RS.ItemText>{item.label}</RS.ItemText>
                <RS.ItemIndicator className="ml-auto">
                  <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </RS.ItemIndicator>
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  );
}
