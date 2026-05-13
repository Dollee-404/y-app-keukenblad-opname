import type { Opname } from "../../data/seed-types";
import type { OpnameAction } from "../../state/opnameReducer";

interface Props { state: Opname; dispatch: React.Dispatch<OpnameAction>; }

export default function MateriaalSectie({ state: _state, dispatch: _dispatch }: Props) {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>Materiaal & kleur</h2>
      <p style={{ color: "#94a3b8", fontSize: 13 }}>Volgt in subtaak 6.</p>
    </div>
  );
}
