"use client";

import { Check, ChevronDown } from "lucide-react";
import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";

type SelectOption = { label: string; value: string };

type SelectProps = {
  ariaLabel: string;
  error?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value?: string;
};

export function Select({ ariaLabel, error, onBlur, onChange, options, placeholder, value }: SelectProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsidePress);
    return () => document.removeEventListener("mousedown", closeOnOutsidePress);
  }, [open]);

  const focusOption = (index: number) => optionRefs.current[(index + options.length) % options.length]?.focus();
  const choose = (option: SelectOption) => { onChange(option.value); setOpen(false); };
  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") { setOpen(false); return; }
    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusOption(event.key === "ArrowUp" ? (selectedIndex >= 0 ? selectedIndex : options.length - 1) : (selectedIndex >= 0 ? selectedIndex : 0)));
    }
  };
  const onOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); root.current?.querySelector("button")?.focus(); }
    if (event.key === "ArrowDown") { event.preventDefault(); focusOption(index + 1); }
    if (event.key === "ArrowUp") { event.preventDefault(); focusOption(index - 1); }
    if (event.key === "Home") { event.preventDefault(); focusOption(0); }
    if (event.key === "End") { event.preventDefault(); focusOption(options.length - 1); }
  };

  return <div ref={root} className="relative mt-2"><button type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={listboxId} onBlur={onBlur} onClick={() => setOpen((current) => !current)} onKeyDown={onTriggerKeyDown} className={`flex min-h-[46px] w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left text-sm outline-none transition ${error ? "border-red-700" : "border-ink/15 hover:border-brand/40 focus:border-brandAction focus:ring-2 focus:ring-brand/15"}`}><span className={selected ? "text-ink" : "text-muted/70"}>{selected?.label ?? placeholder}</span><ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-brandAction transition-transform ${open ? "rotate-180" : ""}`}/></button>{open && <div id={listboxId} role="listbox" aria-label={ariaLabel} className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-ink/10 bg-white p-1.5 shadow-soft">{options.map((option, index) => { const isSelected = option.value === value; return <button key={option.value} ref={(element) => { optionRefs.current[index] = element; }} type="button" role="option" aria-selected={isSelected} onClick={() => choose(option)} onKeyDown={(event) => onOptionKeyDown(event, index)} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-brand/30 ${isSelected ? "bg-brandAction text-white" : "text-ink hover:bg-sky focus:bg-sky"}`}>{option.label}{isSelected && <Check size={17} aria-hidden="true"/>}</button>; })}</div>}</div>;
}
