import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Icon } from "@/shared/ui/Icon";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function parseSelectOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{
      value?: string | number;
      disabled?: boolean;
      children?: ReactNode;
    }>;
    if (el.type !== "option") return;
    options.push({
      value: String(el.props.value ?? ""),
      label: String(el.props.children ?? "").trim(),
      disabled: el.props.disabled,
    });
  });
  return options;
}

function fireChange(
  onChange: SelectHTMLAttributes<HTMLSelectElement>["onChange"],
  name: string | undefined,
  nextValue: string
) {
  onChange?.({
    target: { value: nextValue, name: name ?? "" },
    currentTarget: { value: nextValue, name: name ?? "" },
  } as ChangeEvent<HTMLSelectElement>);
}

function fireBlur(
  onBlur: SelectHTMLAttributes<HTMLSelectElement>["onBlur"],
  name: string | undefined,
  value: string
) {
  onBlur?.({
    target: { value, name: name ?? "" },
    currentTarget: { value, name: name ?? "" },
  } as FocusEvent<HTMLSelectElement>);
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement>;

const CONTAINER_CLASS_PREFIX =
  /^(w-|min-w-|max-w-|flex-|shrink|grow|basis-|self-|col-span-|row-span-)/;

/** `select-field` dış sarmalayıcıya değil tetikleyiciye gider; çift kutu/chevron önlenir. */
function splitSelectClassName(className: string) {
  const container: string[] = [];
  const trigger: string[] = [];

  for (const token of className.split(/\s+/).filter(Boolean)) {
    if (token === "select-field") continue;
    if (CONTAINER_CLASS_PREFIX.test(token)) container.push(token);
    else trigger.push(token);
  }

  const hasWidth = container.some(
    (t) => t.startsWith("w-") || t.startsWith("min-w-") || t.startsWith("max-w-")
  );
  if (!hasWidth) container.push("w-full");

  return { container: container.join(" "), trigger: trigger.join(" ") };
}

/**
 * Tema uyumlu açılır liste — native `<select>` yerine özelleştirilmiş panel.
 * `register()`, `value`/`onChange` ve `<option>` çocukları ile uyumludur.
 */
const SelectField = forwardRef<HTMLInputElement, SelectFieldProps>(function SelectField(
  {
    className = "",
    children,
    value,
    defaultValue,
    onChange,
    onBlur,
    disabled,
    id,
    name,
    required,
    autoFocus,
    form,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    "aria-describedby": ariaDescribedby,
    "aria-invalid": ariaInvalid,
  },
  ref
) {
  const options = parseSelectOptions(children);
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ""));
  const currentValue = isControlled ? String(value ?? "") : internalValue;

  const emptyOption = options.find((o) => o.value === "");
  const selectable = options.filter((o) => o.value !== "" && !o.disabled);
  const selected =
    options.find((o) => o.value === currentValue) ??
    (currentValue === "" ? emptyOption : undefined);
  const displayLabel =
    currentValue === "" || !selected
      ? (emptyOption?.label ?? "Seçin…")
      : selected.label;

  const choose = (next: string) => {
    if (!isControlled) setInternalValue(next);
    fireChange(onChange, name, next);
    setOpen(false);
    setHighlight(-1);
    fireBlur(onBlur, name, next);
  };

  const close = () => {
    setOpen(false);
    setHighlight(-1);
    fireBlur(onBlur, name, currentValue);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  });

  useEffect(() => {
    if (!open) return;
    const idx = selectable.findIndex((o) => o.value === currentValue);
    setHighlight(idx >= 0 ? idx : 0);
  }, [open, currentValue, selectable]);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
    }
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((i) => (i + 1) % selectable.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((i) => (i - 1 + selectable.length) % selectable.length);
    }
    if (event.key === "Enter" && highlight >= 0) {
      event.preventDefault();
      choose(selectable[highlight].value);
    }
  };

  const { container: containerClass, trigger: triggerClass } = splitSelectClassName(className);

  return (
    <div ref={containerRef} className={`relative ${containerClass}`}>
      <input
        ref={ref}
        type="hidden"
        name={name}
        value={currentValue}
        required={required}
        form={form}
        readOnly
        tabIndex={-1}
        aria-hidden
      />

      <button
        id={id}
        type="button"
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={`select-trigger flex w-full items-center justify-between gap-2 text-left ${
          currentValue === "" ? "text-slate-400" : "text-slate-800"
        } ${triggerClass} ${open ? "border-brand-500 ring-4 ring-brand-500/15 bg-white" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        <Icon
          name="chevronDown"
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="select-field-menu"
          aria-activedescendant={
            highlight >= 0 ? `${listboxId}-opt-${highlight}` : undefined
          }
        >
          {options.map((option) => {
            if (option.value === "") return null;
            const selectedOpt = option.value === currentValue;
            const idx = selectable.findIndex((o) => o.value === option.value);
            const highlighted = idx === highlight;
            return (
              <li key={option.value} role="presentation">
                <button
                  id={idx >= 0 ? `${listboxId}-opt-${idx}` : undefined}
                  type="button"
                  role="option"
                  aria-selected={selectedOpt}
                  disabled={option.disabled}
                  className={`select-field-option ${selectedOpt ? "is-selected" : ""} ${
                    highlighted ? "is-highlighted" : ""
                  }`}
                  onMouseEnter={() => idx >= 0 && setHighlight(idx)}
                  onClick={() => !option.disabled && choose(option.value)}
                >
                  {option.label}
                  {selectedOpt ? <Icon name="check" size={14} className="ml-auto text-brand-600" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

export default SelectField;
