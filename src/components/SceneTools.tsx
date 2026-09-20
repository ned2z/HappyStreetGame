import type { SceneOptions } from "../three/scene";

export function SceneTools({ options, onChange, onZoom, onReset, page, maxPage, onPage }: {
  options: SceneOptions;
  onChange: (options: SceneOptions) => void;
  onZoom: (amount: number) => void;
  onReset: () => void;
  page: number;
  maxPage: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="scene-tools" aria-label="ควบคุมมุมมอง 3D">
      <div className="scene-tool-row">
        <button type="button" aria-pressed={options.scope === "room"} onClick={() => onChange({ ...options, scope: options.scope === "room" ? "building" : "room" })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7M7 9h.01M17 9h.01"/></svg>
          {options.scope === "room" ? "ดู 3 หลังพร้อมกัน" : "เจาะดูบ้านนี้"}
        </button>
        <button type="button" aria-pressed={options.upper} onClick={() => onChange({ ...options, upper: !options.upper })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m3 8 9-5 9 5-9 5ZM3 12l9 5 9-5M3 16l9 5 9-5"/></svg>
          {options.upper ? "ซ่อนชั้นสอง" : "แสดงชั้นสอง"}
        </button>
        <button type="button" aria-pressed={options.paths} onClick={() => onChange({ ...options, paths: !options.paths })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M5 7v5h14v5"/></svg>
          เส้นทางเดิน
        </button>
      </div>
      {maxPage > 0 && <div className="scene-page">
        <button type="button" aria-label="กลุ่มบ้านก่อนหน้า" disabled={page === 0} onClick={() => onPage(page - 1)}>&lt;</button>
        <span>กลุ่ม {page + 1}/{maxPage + 1}</span>
        <button type="button" aria-label="กลุ่มบ้านถัดไป" disabled={page === maxPage} onClick={() => onPage(page + 1)}>&gt;</button>
      </div>}
      <div className="scene-zoom">
        <button type="button" aria-label="ซูมเข้า" onClick={() => onZoom(1.18)}>+</button>
        <button type="button" aria-label="ซูมออก" onClick={() => onZoom(0.85)}>-</button>
        <button type="button" aria-label="คืนมุมกล้อง" onClick={onReset}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></svg>
        </button>
      </div>
    </div>
  );
}