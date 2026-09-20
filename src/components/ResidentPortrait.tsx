import type { Tenant } from "../game/tenants";

export function ResidentPortrait({ tenant, size = 40 }: { tenant: Tenant; size?: number }) {
  const { skin, hair, shirt } = tenant.look;
  return <span className={`resident-portrait ${tenant.kind === "special" ? "special" : ""}`} style={{ width: size, height: size, borderColor: tenant.auraColor ?? "transparent", boxShadow: tenant.auraColor ? `0 0 0 2px ${tenant.auraColor}25, 0 0 16px ${tenant.auraColor}40` : undefined }} aria-hidden="true">
    <svg width={size} height={size} viewBox="0 0 48 48">
      <rect width="48" height="48" rx="16" fill={tenant.auraColor ? `${tenant.auraColor}25` : "#e7e7d8"} />
      <path d="M10 48v-7c0-8 28-8 28 0v7" fill={shirt} />
      <ellipse cx="24" cy="23" rx="15" ry="16" fill={hair} />
      <ellipse cx="24" cy="26" rx="13" ry="13" fill={skin} />
      <path d="M10 22Q11 5 25 8q14 0 14 15l-7-9-5 6-5-5-5 7Z" fill={hair} />
      <ellipse cx="19" cy="27" rx="1.6" ry="2.1" fill="#3c3734" /><ellipse cx="29" cy="27" rx="1.6" ry="2.1" fill="#3c3734" />
      <ellipse cx="14" cy="31" rx="3" ry="1.3" fill="#e3a297" opacity=".75" /><ellipse cx="34" cy="31" rx="3" ry="1.3" fill="#e3a297" opacity=".75" />
      <path d="M21 32q3 3 6 0" fill="none" stroke="#af6e63" strokeWidth="1.2" strokeLinecap="round" />
      {tenant.kind === "special" && <path d="m36 3 1.4 3.6L41 8l-3.6 1.4L36 13l-1.4-3.6L31 8l3.6-1.4Z" fill={tenant.auraColor ?? "#d4b77a"} />}
    </svg>
  </span>;
}