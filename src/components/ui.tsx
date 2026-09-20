import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export const money = (n: number) => `฿${Math.round(n).toLocaleString("th-TH")}`;

export function Sheet({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-end justify-center md:items-stretch md:justify-end">
      <div
        className="pointer-events-auto absolute inset-0 bg-black/45 backdrop-blur-[2px] md:pointer-events-none md:bg-black/10 md:backdrop-blur-none"
        onClick={onClose}
      />
      <div
        className={cn(
          "anim-sheet glass pointer-events-auto relative flex w-full max-w-[560px] flex-col rounded-t-[26px] md:my-3 md:mr-3 md:max-h-[calc(100%-1.5rem)] md:w-[400px] md:rounded-[26px]",
          "max-h-[78vh]",
        )}
      >
        <div className="flex items-start gap-3 border-b border-white/10 px-4 pt-4 pb-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">{icon}</div>
          <div className="min-w-0 flex-1">
            <h2 className="font-cute truncate text-lg leading-tight font-bold text-white">{title}</h2>
            {subtitle && <p className="truncate text-xs text-white/55">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="ปิดเมนู"
            className="btn-pop grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
          >
            ✕
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-3">{children}</div>
        {footer && <div className="border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

export function Bar({ value, color = "#8ef0d0", height = 8 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-black/35" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color, boxShadow: `0 0 10px ${color}66` }}
      />
    </div>
  );
}

export function Chip({
  children,
  color,
  className,
  onClick,
  active,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "btn-pop inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        onClick ? "cursor-pointer" : "cursor-default",
        active ? "ring-2 ring-white/70" : "",
        className,
      )}
      style={
        color
          ? { background: `${color}26`, color, border: `1px solid ${color}55` }
          : { background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }
      }
    >
      {children}
    </button>
  );
}

export function Btn({
  children,
  onClick,
  tone = "primary",
  disabled,
  className,
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "ghost" | "danger" | "gold";
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const tones = {
    primary: "bg-gradient-to-b from-[#6de0b0] to-[#35b98a] text-[#06281c] shadow-[0_6px_0_#1f8a63]",
    gold: "bg-gradient-to-b from-[#ffd979] to-[#f0ae3c] text-[#4a2c00] shadow-[0_6px_0_#c07f18]",
    ghost: "bg-white/10 text-white border border-white/15",
    danger: "bg-gradient-to-b from-[#ff8c8c] to-[#e05353] text-[#3a0808] shadow-[0_6px_0_#a53434]",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "btn-pop rounded-2xl font-bold whitespace-nowrap transition",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        tones[tone],
        disabled ? "cursor-not-allowed opacity-40 grayscale" : "",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="text-[11px] tracking-tight text-amber-300">
      {"★".repeat(Math.round(value))}
      <span className="text-white/20">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}
