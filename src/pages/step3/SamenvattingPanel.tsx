import type { Opname } from "../../data/seed-types";

interface Props { state: Opname; }

export default function SamenvattingPanel({ state: _state }: Props) {
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      borderLeft: "1px solid rgba(0,0,0,0.08)",
      padding: "20px 16px",
      background: "#fafafa",
      overflowY: "auto",
    }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em" }}>SAMENVATTING</p>
      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Volgt in subtaak 9.</p>
    </aside>
  );
}
