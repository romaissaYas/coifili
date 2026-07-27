'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search, Eye, UserX, Pencil, Ban, Trash2,
  List, CalendarDays, CalendarCheck, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useReservationsSalon } from '@/hooks/useReservationsSalon';
import { PageHeading } from '@/components/dashboard/ui';
import { STATUT_META, statutEffectif, type ReservationSalon } from '@/types/reservationSalon';

const DA = (v: number | string | null) => (v == null ? '—' : `${Number(v).toLocaleString('fr-FR')} DA`);
const hCourte = (h: string | null) => (h ?? '').slice(0, 5);
const nomComplet = (r: ReservationSalon) => [r.client_prenom, r.client_nom].filter(Boolean).join(' ');
const initiale = (r: ReservationSalon) => (r.client_prenom || r.client_nom || '?').charAt(0).toUpperCase();
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const PERIODES = [
  { v: '', l: 'Toutes' },
  { v: 'today', l: "Aujourd'hui" },
  { v: 'tomorrow', l: 'Demain' },
  { v: 'week', l: 'Cette semaine' },
  { v: 'month', l: 'Ce mois' },
];

function Badge({ r }: { r: ReservationSalon }) {
  const m = STATUT_META[statutEffectif(r)];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.classe}`}>{m.label}</span>;
}

export default function ReservationsTab() {
  const R = useReservationsSalon();
  const [vue, setVue] = useState<'liste' | 'calendrier'>('liste');
  const [detail, setDetail] = useState<ReservationSalon | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (detail) setNotes(detail.notes ?? '');
  }, [detail]);

  // Ouvrir le détail marque la réservation comme « consultée » (retire le vert).
  const ouvrirDetail = (r: ReservationSalon) => {
    setDetail(r);
    if (!r.vue_coiffeur) R.marquerVue(r.id);
  };

  const employesOpts = useMemo(() => {
    const map = new Map<number, string>();
    R.reservations.forEach((r) => r.employe_id && r.employe_nom && map.set(r.employe_id, r.employe_nom));
    return [...map.entries()];
  }, [R.reservations]);
  const servicesOpts = useMemo(() => {
    const map = new Map<number, string>();
    R.reservations.forEach((r) => r.prestation_nom && map.set(r.prestation_id, r.prestation_nom));
    return [...map.entries()];
  }, [R.reservations]);

  const btn = 'rounded-md px-2 py-1 text-xs font-semibold transition-colors';

  function actions(r: ReservationSalon) {
    const fini = r.statut === 'annule' || r.statut === 'termine';
    return (
      <div className="flex flex-wrap gap-1">
        <button onClick={() => ouvrirDetail(r)} className={`${btn} bg-gray-100 text-gray-600 hover:bg-gray-200`} title="Voir"><Eye className="h-3.5 w-3.5" /></button>
        {r.statut === 'en_attente' && !r.no_show && (
          <button onClick={() => R.confirmer(r.id)} className={`${btn} bg-blue-100 text-blue-700 hover:bg-blue-200`}>Confirmer</button>
        )}
        {!fini && !r.no_show && (
          <button onClick={() => R.terminer(r.id)} className={`${btn} bg-green-100 text-green-700 hover:bg-green-200`}>Terminer</button>
        )}
        {!fini && !r.no_show && (
          <button onClick={() => R.absent(r.id)} className={`${btn} bg-orange-100 text-orange-700 hover:bg-orange-200`} title="Absent"><UserX className="h-3.5 w-3.5" /></button>
        )}
        {!fini && (
          <button onClick={() => R.modifier(r)} className={`${btn} bg-indigo-100 text-indigo-700 hover:bg-indigo-200`} title="Modifier"><Pencil className="h-3.5 w-3.5" /></button>
        )}
        {!fini && (
          <button onClick={() => R.annuler(r.id)} className={`${btn} bg-rose-100 text-rose-700 hover:bg-rose-200`} title="Annuler"><Ban className="h-3.5 w-3.5" /></button>
        )}
        {r.statut === 'annule' && (
          <button onClick={() => R.supprimer(r.id)} className={`${btn} bg-red-100 text-red-600 hover:bg-red-200`} title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        title="Réservations"
        subtitle="Gérez les demandes de vos clients"
        icon={<CalendarCheck size={20} />}
        actions={
          <div className="flex rounded-full bg-slate-100 p-1">
            <button onClick={() => setVue('liste')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${vue === 'liste' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List className="h-4 w-4" /> Liste</button>
            <button onClick={() => setVue('calendrier')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${vue === 'calendrier' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarDays className="h-4 w-4" /> Calendrier</button>
          </div>
        }
      />

      {/* Recherche + filtres */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input value={R.filtres.q ?? ''} onChange={(e) => R.setFiltre('q', e.target.value)} placeholder="Client, téléphone, email, n°…" className="w-full bg-transparent py-2 text-sm outline-none" />
        </div>
        <select value={R.filtres.statut ?? ''} onChange={(e) => R.setFiltre('statut', e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="confirme">Confirmées</option>
          <option value="termine">Terminées</option>
          <option value="annule">Annulées</option>
          <option value="no_show">Absents</option>
        </select>
        <select value={R.filtres.employe_id ?? ''} onChange={(e) => R.setFiltre('employe_id', e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <option value="">Tous les employés</option>
          {employesOpts.map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
        </select>
        <select value={R.filtres.prestation_id ?? ''} onChange={(e) => R.setFiltre('prestation_id', e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <option value="">Tous les services</option>
          {servicesOpts.map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
        </select>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {PERIODES.map((p) => (
          <button key={p.v} onClick={() => R.setFiltre('periode', p.v)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${(R.filtres.periode ?? '') === p.v ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-rose-50'}`}>{p.l}</button>
        ))}
      </div>

      {R.loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : vue === 'liste' ? (
        <ListeReservations reservations={R.reservations} actions={actions} />
      ) : (
        <Calendrier reservations={R.reservations} onOuvrir={ouvrirDetail} />
      )}

      {detail && (
        <DetailModal
          r={detail}
          notes={notes}
          setNotes={setNotes}
          onClose={() => setDetail(null)}
          onSaveNotes={async () => { await R.enregistrerNotes(detail.id, notes); }}
        />
      )}
    </div>
  );
}

function ListeReservations({ reservations, actions }: { reservations: ReservationSalon[]; actions: (r: ReservationSalon) => React.ReactNode }) {
  if (reservations.length === 0) return <p className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">Aucune réservation.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">N°</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Employé</th>
            <th className="px-4 py-3">Date / Heure</th>
            <th className="px-4 py-3">Durée</th>
            <th className="px-4 py-3">Prix</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reservations.map((r) => (
            <tr key={r.id} className={r.vue_coiffeur ? 'hover:bg-gray-50' : 'bg-green-50 hover:bg-green-100'}>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.reference ?? `#${r.id}`}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">{initiale(r)}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{nomComplet(r)}</div>
                    <div className="text-xs text-gray-400">{r.client_telephone}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">{r.prestation_nom ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{r.employe_nom ?? '—'}</td>
              <td className="px-4 py-3 text-gray-700">{r.date}<div className="text-xs text-gray-400">{hCourte(r.heure_debut)}</div></td>
              <td className="px-4 py-3 text-gray-600">{r.duree ? `${r.duree} min` : '—'}</td>
              <td className="px-4 py-3 font-semibold text-gray-800">{DA(r.prix)}</td>
              <td className="px-4 py-3"><Badge r={r} /></td>
              <td className="px-4 py-3">{actions(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailModal({ r, notes, setNotes, onClose, onSaveNotes }: {
  r: ReservationSalon; notes: string; setNotes: (v: string) => void; onClose: () => void; onSaveNotes: () => Promise<void>;
}) {
  const info = (k: string, v: React.ReactNode) => (
    <div className="flex justify-between border-b border-gray-100 py-2 text-sm"><span className="text-gray-500">{k}</span><span className="font-medium text-gray-900">{v}</span></div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Réservation {r.reference ?? `#${r.id}`}</h3>
          <Badge r={r} />
        </div>
        <h4 className="mb-1 text-sm font-semibold uppercase text-gray-400">Client</h4>
        {info('Nom', nomComplet(r))}
        {info('Téléphone', r.client_telephone ?? '—')}
        {info('Email', r.client_email ?? '—')}
        <h4 className="mb-1 mt-4 text-sm font-semibold uppercase text-gray-400">Rendez-vous</h4>
        {info('Service', r.prestation_nom ?? '—')}
        {info('Employé', r.employe_nom ?? '—')}
        {info('Date', r.date)}
        {info('Heure', hCourte(r.heure_debut))}
        {info('Durée', r.duree ? `${r.duree} min` : '—')}
        {info('Prix', DA(r.prix))}
        {r.cancellation_reason && info("Motif d'annulation", r.cancellation_reason)}
        <h4 className="mb-1 mt-4 text-sm font-semibold uppercase text-gray-400">Notes internes (non visibles par le client)</h4>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-rose-400" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Fermer</button>
          <button onClick={onSaveNotes} className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:from-rose-600 hover:to-pink-700">Enregistrer les notes</button>
        </div>
      </div>
    </div>
  );
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function Calendrier({ reservations, onOuvrir }: { reservations: ReservationSalon[]; onOuvrir: (r: ReservationSalon) => void }) {
  const [vue, setVue] = useState<'mois' | 'semaine' | 'jour'>('mois');
  const [ref, setRef] = useState(new Date());

  const parJour = useMemo(() => {
    const m = new Map<string, ReservationSalon[]>();
    reservations.forEach((r) => {
      const arr = m.get(r.date) ?? [];
      arr.push(r);
      m.set(r.date, arr);
    });
    return m;
  }, [reservations]);

  const bloc = (r: ReservationSalon) => (
    <button key={r.id} onClick={() => onOuvrir(r)} className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white" style={{ backgroundColor: STATUT_META[statutEffectif(r)].couleur }}>
      {hCourte(r.heure_debut)} {nomComplet(r)}
    </button>
  );

  const naviguer = (delta: number) => {
    const d = new Date(ref);
    if (vue === 'mois') d.setMonth(d.getMonth() + delta);
    else if (vue === 'semaine') d.setDate(d.getDate() + 7 * delta);
    else d.setDate(d.getDate() + delta);
    setRef(d);
  };

  const lundiDeLaSemaine = (d: Date) => {
    const x = new Date(d);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  };

  let titre = '';
  let contenu: React.ReactNode = null;

  if (vue === 'mois') {
    titre = ref.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const premier = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const debut = lundiDeLaSemaine(premier);
    const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(debut); d.setDate(d.getDate() + i); return d; });
    contenu = (
      <div className="grid grid-cols-7 gap-1">
        {JOURS.map((j) => <div key={j} className="py-1 text-center text-xs font-semibold text-gray-400">{j}</div>)}
        {cells.map((d) => {
          const list = parJour.get(ymd(d)) ?? [];
          const dansMois = d.getMonth() === ref.getMonth();
          return (
            <div key={ymd(d)} className={`min-h-[84px] rounded-lg border p-1 ${dansMois ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 text-gray-300'}`}>
              <div className="mb-1 text-xs font-semibold text-gray-500">{d.getDate()}</div>
              <div className="space-y-0.5">{list.slice(0, 3).map(bloc)}{list.length > 3 && <div className="text-[10px] text-gray-400">+{list.length - 3}</div>}</div>
            </div>
          );
        })}
      </div>
    );
  } else if (vue === 'semaine') {
    const debut = lundiDeLaSemaine(ref);
    const jours = Array.from({ length: 7 }, (_, i) => { const d = new Date(debut); d.setDate(d.getDate() + i); return d; });
    titre = `Semaine du ${debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
    contenu = (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {jours.map((d) => (
          <div key={ymd(d)} className="rounded-lg border border-gray-200 bg-white p-2">
            <div className="mb-2 text-xs font-semibold text-gray-500">{JOURS[(d.getDay() + 6) % 7]} {d.getDate()}</div>
            <div className="space-y-0.5">{(parJour.get(ymd(d)) ?? []).map(bloc)}</div>
          </div>
        ))}
      </div>
    );
  } else {
    titre = ref.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const list = (parJour.get(ymd(ref)) ?? []).slice().sort((a, b) => (a.heure_debut ?? '').localeCompare(b.heure_debut ?? ''));
    contenu = list.length === 0
      ? <p className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">Aucune réservation ce jour.</p>
      : <div className="space-y-2">{list.map((r) => (
          <button key={r.id} onClick={() => onOuvrir(r)} className="flex w-full items-center gap-3 rounded-lg border-l-4 bg-white p-3 text-left shadow-sm hover:bg-gray-50" style={{ borderColor: STATUT_META[statutEffectif(r)].couleur }}>
            <span className="font-semibold text-gray-800">{hCourte(r.heure_debut)}</span>
            <span className="text-gray-700">{nomComplet(r)}</span>
            <span className="text-sm text-gray-400">· {r.prestation_nom}</span>
            <span className="ml-auto"><Badge r={r} /></span>
          </button>
        ))}</div>;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => naviguer(-1)} className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-gray-100"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[180px] text-center font-semibold capitalize text-gray-800">{titre}</span>
          <button onClick={() => naviguer(1)} className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-gray-100"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="flex rounded-full bg-white p-1 shadow-sm">
          {(['jour', 'semaine', 'mois'] as const).map((v) => (
            <button key={v} onClick={() => setVue(v)} className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${vue === v ? 'bg-rose-600 text-white' : 'text-gray-500'}`}>{v}</button>
          ))}
        </div>
      </div>
      {contenu}
    </div>
  );
}
