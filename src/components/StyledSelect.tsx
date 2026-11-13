import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

type OptionItem = {
  value: string;
  label: React.ReactNode;
  disabled: boolean;
};

function optionText(node: React.ReactNode): string {
  return React.Children.toArray(node)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('');
}

function readOptions(children: React.ReactNode): OptionItem[] {
  const items: OptionItem[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      items.push(...readOptions((child.props as { children?: React.ReactNode }).children));
      return;
    }
    if (child.type !== 'option') return;

    const props = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean };
    const value = props.value == null ? optionText(props.children) : String(props.value);
    items.push({ value, label: props.children, disabled: Boolean(props.disabled) });
  });
  return items;
}

interface StyledSelectProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  required?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onValueChange?: (value: string) => void;
}

export function StyledSelect({
  children,
  className = '',
  id,
  name,
  value,
  defaultValue,
  required,
  disabled,
  onValueChange,
  ...ariaProps
}: StyledSelectProps) {
  const generatedId = useId().replace(/:/g, '');
  const selectId = id || `staydesk-select-${generatedId}`;
  const listboxId = `${selectId}-options`;
  const options = useMemo(() => readOptions(children), [children]);
  const initialValue = defaultValue == null
    ? (options.find((option) => !option.disabled)?.value ?? '')
    : String(defaultValue);
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue);
  const selectedValue = value == null ? uncontrolledValue : String(value);
  const selectedOption = options.find((option) => option.value === selectedValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => {
    const selectedIndex = options.findIndex((option) => option.value === selectedValue && !option.disabled);
    return selectedIndex >= 0 ? selectedIndex : options.findIndex((option) => !option.disabled);
  });
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isControlled = value != null;

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const maxHeight = Math.min(256, Math.max(120, window.innerHeight - 32));
    const estimatedHeight = Math.min(maxHeight, options.filter((option) => !option.disabled).length * 40 + 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < estimatedHeight + 12 && rect.top > spaceBelow;
    const width = Math.min(rect.width, window.innerWidth - 16);
    setMenuPosition({
      position: 'fixed',
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
      top: placeAbove ? Math.max(8, rect.top - maxHeight - 6) : rect.bottom + 6,
      maxHeight,
      zIndex: 80,
    });
  };

  const focusActiveOption = (index: number) => {
    requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLButtonElement>(`[data-option-index="${index}"]`)?.focus();
    });
  };

  const openMenu = (direction: 1 | -1 = 1) => {
    const selectedIndex = options.findIndex((option) => option.value === selectedValue && !option.disabled);
    const firstEnabled = options.findIndex((option) => !option.disabled);
    const nextIndex = selectedIndex >= 0 ? selectedIndex : direction === 1 ? firstEnabled : options.length - 1;
    setActiveIndex(nextIndex);
    updateMenuPosition();
    setOpen(true);
    focusActiveOption(nextIndex);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === 'Tab') {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, options.length]);

  const chooseOption = (option: OptionItem) => {
    if (option.disabled) return;
    if (!isControlled) setUncontrolledValue(option.value);
    onValueChange?.(option.value);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const moveActive = (from: number, direction: 1 | -1) => {
    if (!options.length) return;
    let next = from;
    for (let count = 0; count < options.length; count += 1) {
      next = (next + direction + options.length) % options.length;
      if (!options[next].disabled) {
        setActiveIndex(next);
        focusActiveOption(next);
        return;
      }
    }
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openMenu(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(-1);
    }
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <select
        id={`${selectId}-native`}
        name={name}
        value={selectedValue}
        required={required}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        onChange={() => undefined}
        onFocus={() => triggerRef.current?.focus()}
      >
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value} disabled={option.disabled}>{optionText(option.label)}</option>
        ))}
      </select>
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        className={`styled-select-trigger relative inline-flex items-center justify-between gap-3 text-left ${className}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={required && !selectedValue ? true : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        {...ariaProps}
      >
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label ?? 'Select an option'}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          className="overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 ring-1 ring-slate-900/5"
          style={menuPosition}
        >
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              type="button"
              role="option"
              aria-selected={option.value === selectedValue}
              aria-disabled={option.disabled || undefined}
              data-option-index={index}
              tabIndex={index === activeIndex && !option.disabled ? 0 : -1}
              disabled={option.disabled}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={(event) => {
                setActiveIndex(index);
                event.currentTarget.focus();
              }}
              onClick={() => chooseOption(option)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  moveActive(index, 1);
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  moveActive(index, -1);
                } else if (event.key === 'Home' || event.key === 'End') {
                  event.preventDefault();
                  const next = event.key === 'Home'
                    ? options.findIndex((item) => !item.disabled)
                    : options.map((item) => !item.disabled).lastIndexOf(true);
                  setActiveIndex(next);
                  focusActiveOption(next);
                }
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors focus:outline-none ${
                option.disabled
                  ? 'cursor-not-allowed text-slate-400'
                  : option.value === selectedValue
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-slate-700 hover:bg-brand-50 hover:text-brand-800 focus:bg-brand-50 focus:text-brand-800'
              }`}
            >
              <span className="min-w-0 flex-1">{option.label}</span>
              {option.value === selectedValue && !option.disabled && <Check className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
