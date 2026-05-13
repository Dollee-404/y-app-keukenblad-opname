import type { Blad, Opname, Point, Sparing } from "../data/seed-types";
import { rechthoekOutline, boundingBox } from "./bladHelpers";
import { sparingPath } from "./sparingHelpers";
import { effectiefMateriaalSoort } from "../state/helpers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPOSIET_SOORTEN = new Set(["COMPOSIET", "KWARTSCOMPOSIET"]);

// ---------------------------------------------------------------------------
// Pure helper: kleur per sparing-type
// ---------------------------------------------------------------------------

function sparingKleur(type: Sparing["type"]): { fill: string; stroke: string } {
  if (type === "KOOKPLAAT") return { fill: "#ef4444", stroke: "#dc2626" };
  if (type === "SPOELBAK") return { fill: "#3b82f6", stroke: "#2563eb" };
  return { fill: "#94a3b8", stroke: "#64748b" };
}

// ---------------------------------------------------------------------------
// Intern helper
// ---------------------------------------------------------------------------

function pts(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

// ---------------------------------------------------------------------------
// Exported pure helpers (testable)
// ---------------------------------------------------------------------------

/**
 * Berekent de SVG-viewBox-parameters voor een blad op basis van de outline.
 * Padding is 6% van de grootste dimensie.
 */
export function berekenViewBox(outline: Point[]): { x: number; y: number; w: number; h: number } {
  const bb = boundingBox(outline);
  const padding = Math.max(bb.maxX - bb.minX, bb.maxY - bb.minY) * 0.06;
  return {
    x: bb.minX - padding,
    y: bb.minY - padding,
    w: bb.maxX - bb.minX + padding * 2,
    h: bb.maxY - bb.minY + padding * 2,
  };
}

/**
 * True als een sparing een vlakbouw-waarschuwing moet krijgen:
 * inbouwwijze VLAKBOUW én het blad is van composiet-soort.
 */
export function heeftVlakbouwWarning(sparing: Sparing, blad: Blad, state: Opname): boolean {
  if (sparing.inbouwwijze !== "VLAKBOUW") return false;
  return COMPOSIET_SOORTEN.has(effectiefMateriaalSoort(blad, state));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type MiniCanvasBladProps = {
  blad: Blad;
  state: Opname;
  width?: number;
  height?: number;
};

export default function MiniCanvasBlad({
  blad,
  state,
  width = 240,
  height = 100,
}: MiniCanvasBladProps): React.JSX.Element {
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const sparingen = blad.sparingen ?? [];
  const boorgaten = blad.boorgaten ?? [];

  const vb = berekenViewBox(outline);
  const fontSize = vb.h * 0.12;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blad-outline */}
      <polygon
        points={pts(outline)}
        fill="#f8fafc"
        stroke="#94a3b8"
        strokeWidth={1.5}
      />

      {/* Sparingen */}
      {sparingen.map((sparing) => {
        const kleur = sparingKleur(sparing.type);
        const warning = heeftVlakbouwWarning(sparing, blad, state);
        return (
          <g key={sparing.id}>
            <path
              d={sparingPath(sparing, "boven")}
              fill={kleur.fill}
              stroke={kleur.stroke}
              strokeWidth={1}
              opacity={0.7}
            />
            {warning && (
              <text
                x={sparing.positie.x}
                y={sparing.positie.y + fontSize * 0.35}
                textAnchor="middle"
                fontSize={fontSize}
                fill="#eab308"
              >
                ⚠
              </text>
            )}
          </g>
        );
      })}

      {/* Boorgaten */}
      {boorgaten.map((boorgat) => (
        <circle
          key={boorgat.id}
          cx={boorgat.positie.x}
          cy={boorgat.positie.y}
          r={15}
          fill="#7c3aed"
          opacity={0.6}
        />
      ))}
    </svg>
  );
}
