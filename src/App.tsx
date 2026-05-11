import { useEffect, useState } from 'react'
import seedRaw from './data/seed-data.json'
import type { SeedData } from './data/seed-types'
import {
  IN_YAPP_CONTEXT,
  HOST_ORIGIN,
  INSTANCE_ID,
  ERPNEXT_URL,
  LANG,
} from './bridge'

const seed = seedRaw as unknown as SeedData

const totaalKleuren = Object.values(seed.materialen).reduce(
  (sum, m) => sum + m.kleuren.length,
  0
)

export default function App() {
  const [laadtijdstip] = useState(() => new Date().toLocaleTimeString('nl-NL'))

  useEffect(() => {
    console.log(
      `[keukenblad-opname] Seed geladen: v${seed.versie}, ` +
      `${Object.keys(seed.materialen).length} materialen, ` +
      `${totaalKleuren} kleuren totaal, ` +
      `${seed.zichtzijden.length} zichtzijden`
    )
    console.log(`[keukenblad-opname] Y-App context: ${IN_YAPP_CONTEXT ? 'verbonden' : 'niet verbonden'}`)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-lg mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Keukenblad Opname</h1>
          <p className="text-sm text-slate-500">extensie v0.1.0</p>
        </div>

        <section className="bg-white rounded-lg border border-slate-200 p-5 space-y-2">
          <h2 className="font-semibold text-slate-700">Seed-data</h2>
          <p className="text-sm text-slate-500">Versie {seed.versie} — geladen om {laadtijdstip}</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>Materialen: {Object.keys(seed.materialen).length} ({totaalKleuren} kleuren totaal)</li>
            <li>Zichtzijden: {seed.zichtzijden.length}</li>
            <li>Werkstukken: {seed.werkstukken.length}</li>
          </ul>
        </section>

        <section className="bg-white rounded-lg border border-slate-200 p-5 space-y-2">
          <h2 className="font-semibold text-slate-700">Y-App context</h2>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>
              Status:{' '}
              <span className={IN_YAPP_CONTEXT ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                {IN_YAPP_CONTEXT ? 'verbonden' : 'niet verbonden'}
              </span>
            </li>
            <li>Host: {HOST_ORIGIN !== '*' ? HOST_ORIGIN : 'n.v.t.'}</li>
            <li>Instance: {INSTANCE_ID || 'n.v.t.'}</li>
            <li>ERP-URL: {ERPNEXT_URL || 'n.v.t.'}</li>
            <li>Taal: {LANG || 'nl (default)'}</li>
          </ul>
          {!IN_YAPP_CONTEXT && (
            <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Geen Y-App context — alleen UI-test
            </p>
          )}
        </section>

        <p className="text-sm text-slate-400">Wizard volgt in volgende sessie.</p>

      </div>
    </div>
  )
}
