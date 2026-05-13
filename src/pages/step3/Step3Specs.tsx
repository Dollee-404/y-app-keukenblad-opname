import { useState } from "react";
import type { Opname } from "../../data/seed-types";
import type { OpnameAction } from "../../state/opnameReducer";
import MateriaalSectie from "./MateriaalSectie";
import RandafwerkingSectie from "./RandafwerkingSectie";
import AccessoiresSectie from "./AccessoiresSectie";
import SamenvattingPanel from "./SamenvattingPanel";

type SubSectie = "materiaal" | "randafwerking" | "accessoires";

const SUB_SECTIES: { id: SubSectie; label: string }[] = [
  { id: "materiaal",     label: "Materiaal & kleur" },
  { id: "randafwerking", label: "Randafwerking" },
  { id: "accessoires",   label: "Accessoires" },
];

interface Props {
  state: Opname;
  dispatch: React.Dispatch<OpnameAction>;
  selectedSubSection?: string;
}

export default function Step3Specs({ state, dispatch }: Props) {
  const [actief, setActief] = useState<SubSectie>(import.meta.env.DEV ? "randafwerking" : "materiaal");

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      {/* Linker navigatie */}
      <nav style={{
        width: 240, flexShrink: 0,
        borderRight: "1px solid rgba(0,0,0,0.08)",
        padding: "20px 12px",
        background: "white",
        overflowY: "auto",
      }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 8 }}>
          STAP 3 — SPECIFICATIES
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {SUB_SECTIES.map(s => (
            <li key={s.id}>
              <button
                onClick={() => setActief(s.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: actief === s.id ? "#f0fdfb" : "transparent",
                  color: actief === s.id ? "#0d9488" : "#475569",
                  fontWeight: actief === s.id ? 600 : 400,
                  fontSize: 14,
                  cursor: "pointer",
                  textAlign: "left",
                  minHeight: 44,
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Midden: actieve sub-sectie */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", minWidth: 0 }}>
        {actief === "materiaal"     && <MateriaalSectie     state={state} dispatch={dispatch} />}
        {actief === "randafwerking" && <RandafwerkingSectie state={state} dispatch={dispatch} />}
        {actief === "accessoires"   && <AccessoiresSectie   state={state} dispatch={dispatch} />}
      </div>

      {/* Rechts: live samenvatting */}
      <SamenvattingPanel state={state} />
    </div>
  );
}
