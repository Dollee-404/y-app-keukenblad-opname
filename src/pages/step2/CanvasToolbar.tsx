import type { Blad, Opname } from "../../data/seed-types";

interface Props {
  blad: Blad | null;
  state: Opname;
  onHoekKnippen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onDrawerOpen?: () => void;
}

export default function CanvasToolbar({
  blad,
  state,
  onHoekKnippen,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onDrawerOpen,
}: Props) {
  const matSoort = blad?.materiaalOverride?.soort ?? state.materiaal?.soort ?? "";
  const dikte = blad?.dikte ?? "";
  const werkstuk = blad?.werkstukType ?? "";

  const iconBtn = (label: string, onClick: () => void, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        padding: "4px 8px",
        border: "0.5px solid #cbd5e1",
        borderRadius: 4,
        background: "white",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      {label === "Hoek wegknippen" ? "⌐" :
       label === "Overhang" ? "↔" :
       label === "Zoom in" ? "+" :
       label === "Zoom uit" ? "−" : "⊡"}
    </button>
  );

  return (
    <div
      className="bg-white flex-shrink-0 flex items-center justify-between"
      style={{
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        padding: "8px 16px",
        minHeight: 44,
      }}
    >
      {/* Links: drawer-toggle (mobiel) + blad-label + materiaal-pill */}
      <div className="flex items-center" style={{ gap: 10 }}>
        {onDrawerOpen && (
          <button
            onClick={onDrawerOpen}
            className="md:hidden"
            style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}
            aria-label="Bladenlijst openen"
          >
            ☰
          </button>
        )}
        {blad ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{blad.label}</span>
            {(werkstuk || matSoort) && (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  background: "#f1f5f9",
                  borderRadius: 4,
                  color: "#475569",
                }}
              >
                {[werkstuk, dikte ? `${dikte} mm` : "", matSoort].filter(Boolean).join(" · ")}
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 13, color: "#94a3b8" }}>Geen blad geselecteerd</span>
        )}
      </div>

      {/* Rechts: actie-knoppen */}
      <div className="flex items-center" style={{ gap: 6 }}>
        {iconBtn("Hoek wegknippen", onHoekKnippen, !blad)}
        {iconBtn("Overhang", () => {}, true)}
        <div style={{ width: "0.5px", height: 16, background: "#cbd5e1", margin: "0 2px" }} />
        {iconBtn("Zoom in", onZoomIn, !blad)}
        {iconBtn("Zoom uit", onZoomOut, !blad)}
        {iconBtn("Fit scherm", onFitScreen, !blad)}
      </div>
    </div>
  );
}
