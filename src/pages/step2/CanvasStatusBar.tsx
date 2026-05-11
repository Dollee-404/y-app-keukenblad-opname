export default function CanvasStatusBar() {
  return (
    <div
      className="bg-white flex-shrink-0 flex items-center justify-between"
      style={{
        borderTop: "0.5px solid rgba(0,0,0,0.08)",
        padding: "6px 16px",
        fontSize: 11,
        color: "#64748b",
      }}
    >
      <div className="flex items-center" style={{ gap: 16 }}>
        <span>📷 0 foto's</span>
        <span>✏️ 0 notities</span>
      </div>
      <span>Schaal 1:20 · 100%</span>
    </div>
  );
}
