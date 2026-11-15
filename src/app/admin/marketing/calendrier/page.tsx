'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Film, Clapperboard } from 'lucide-react';
import Swal from 'sweetalert2';
import { adminApi } from '@/lib/adminApi';
import type { IgCalendarItem, IgCalendarType } from '@/types/marketing';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const ICONE: Record<IgCalendarType, typeof FileText> = { post: FileText, reel: Film, story: Clapperboard };
const COULEUR: Record<IgCalendarType, string> = {
  post: 'bg-rose-100 text-rose-700 border-rose-200',
  reel: 'bg-purple-100 text-purple-700 border-purple-200',
  story: 'bg-blue-100 text-blue-700 border-blue-200',
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function jourDe(iso: string): string {
  return iso.replace('T', ' ').slice(0, 10);
}

export default function MarketingCalendrierPage() {
  const [curseur, setCurseur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [items, setItems] = useState<IgCalendarItem[]>([]);
  const [drag, setDrag] = useState<IgCalendarItem | null>(null);

  const annee = curseur.getFullYear();
  const mois = curseur.getMonth();

  const charger = useCallback(async () => {
    const from = ymd(new Date(annee, mois, 1));
    const to = ymd(new Date(annee, mois + 1, 1));
    try { setItems(await adminApi.marketing.calendar(from, to)); } catch { /* réseau */ }
  }, [annee, mois]);
  useEffect(() => { charger(); }, [charger]);

  // Grille : cases du lundi précédent au dimanche suivant.
  const cases = useMemo(() => {
    const premier = new Date(annee, mois, 1);
    const decalage = (premier.getDay() + 6) % 7; // 0 = lundi
    const debut = new Date(annee, mois, 1 - decalage);
    return Array.from({ length: 42 }, (_, i) => new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i));
  }, [annee, mois]);

  const parJour = useMemo(() => {
    const map: Record<string, IgCalendarItem[]> = {};
    for (const it of items) { const k = jourDe(it.date_publication); (map[k] ??= []).push(it); }
    return map;
  }, [items]);

  async function deposer(jour: Date) {
    if (!drag) return;
    const item = drag;
    setDrag(null);
    try {
      await adminApi.marketing.reschedule(item.type, item.id, ymd(jour));
      charger();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Reprogrammation impossible.' });
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurseur(new Date(annee, mois - 1, 1))} aria-label="Mois précédent" className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[160px] text-center text-lg font-semibold text-gray-900">{MOIS[mois]} {annee}</span>
          <button onClick={() => setCurseur(new Date(annee, mois + 1, 1))} aria-label="Mois suivant" className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rose-200" /> Publication</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-purple-200" /> Reel</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-200" /> Story</span>
        </div>
      </div>
      <p className="mb-3 text-xs text-gray-400">Glissez-déposez un contenu sur un autre jour pour le reprogrammer (il passe en « programmé »).</p>

      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-gray-200 bg-white text-sm">
        {JOURS.map((j) => <div key={j} className="border-b border-gray-100 bg-gray-50 px-2 py-2 text-center text-xs font-semibold text-gray-500">{j}</div>)}
        {cases.map((jour, i) => {
          const horsMois = jour.getMonth() !== mois;
          const k = ymd(jour);
          const dejour = parJour[k] ?? [];
          const aujourdhui = ymd(new Date()) === k;
          return (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => deposer(jour)}
              className={`min-h-[92px] border-b border-r border-gray-100 p-1.5 ${horsMois ? 'bg-gray-50/60' : 'bg-white'}`}
            >
              <div className={`mb-1 text-right text-[11px] ${aujourdhui ? 'font-bold text-rose-600' : horsMois ? 'text-gray-300' : 'text-gray-400'}`}>{jour.getDate()}</div>
              <div className="space-y-1">
                {dejour.map((it) => {
                  const Icone = ICONE[it.type];
                  return (
                    <div
                      key={`${it.type}-${it.id}`}
                      draggable
                      onDragStart={() => setDrag(it)}
                      title={it.titre ?? ''}
                      className={`flex cursor-grab items-center gap-1 truncate rounded border px-1.5 py-0.5 text-[11px] ${COULEUR[it.type]}`}
                    >
                      <Icone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{it.titre || it.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
