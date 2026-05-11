const STAPPEN = [
  { nr: 1, label: "Klant" },
  { nr: 2, label: "Tekening" },
  { nr: 3, label: "Specificaties" },
  { nr: 4, label: "Overzicht" },
];

interface Props {
  huidigStap: number;
}

export default function StepIndicator({ huidigStap }: Props) {
  return (
    <nav className="flex items-center justify-center gap-0 py-4">
      {STAPPEN.map((stap, i) => {
        const actief = stap.nr === huidigStap;
        const gedaan = stap.nr < huidigStap;
        return (
          <div key={stap.nr} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                  actief
                    ? "bg-teal-600 text-white"
                    : gedaan
                    ? "bg-teal-100 text-teal-700"
                    : "bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {stap.nr}
              </div>
              <span
                className={[
                  "text-xs",
                  actief ? "text-teal-700 font-medium" : "text-slate-400",
                ].join(" ")}
              >
                {stap.label}
              </span>
            </div>
            {i < STAPPEN.length - 1 && (
              <div className="w-12 h-px bg-slate-200 mb-5 mx-1" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
