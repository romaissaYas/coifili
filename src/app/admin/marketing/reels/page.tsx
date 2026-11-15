'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Pencil, Copy, Trash2, ChevronLeft, ChevronRight, X, Save, Film } from 'lucide-react';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import ImageUpload from '@/components/common/ImageUpload';
import { adminApi } from '@/lib/adminApi';
import { IG_STATUT_LABELS, type IgReel, type IgReelInput, type IgStatut } from '@/types/marketing';

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillons' },
  { value: 'programme', label: 'Programmés' },
  { value: 'publie', label: 'Publiés' },
];
const LIMIT = 12;
const badge: Record<IgStatut, string> = {
  brouillon: 'bg-amber-100 text-amber-700',
  programme: 'bg-blue-100 text-blue-700',
  publie: 'bg-green-100 text-green-700',
};

function toLocalInput(v: string | null): string {
  return v ? v.replace(' ', 'T').slice(0, 16) : '';
}

function ReelForm({ reel, onClose, onSaved }: { reel: IgReel | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    titre: reel?.titre ?? '',
    video_url: reel?.video_url ?? '',
    miniature_url: reel?.miniature_url ?? '',
    legende: reel?.legende ?? '',
    hashtags: reel?.hashtags ?? '',
    musique: reel?.musique ?? '',
    duree: reel?.duree != null ? String(reel.duree) : '',
    statut: (reel?.statut ?? 'brouillon') as IgStatut,
    date_publication: toLocalInput(reel?.date_publication ?? null),
  });
  const [saving, setSaving] = useState(false);
  const champ = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400';
  const label = 'mb-1 block text-sm font-medium text-gray-700';

  async function enregistrer() {
    const body: IgReelInput = {
      titre: f.titre || null, video_url: f.video_url || null, miniature_url: f.miniature_url || null,
      legende: f.legende || null, hashtags: f.hashtags || null, musique: f.musique || null,
      duree: f.duree ? Number(f.duree) : null, statut: f.statut, date_publication: f.date_publication || null,
    };
    setSaving(true);
    try {
      if (reel) await adminApi.marketing.updateReel(reel.id, body);
      else await adminApi.marketing.createReel(body);
      onSaved();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Enregistrement impossible.' });
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{reel ? 'Modifier le Reel' : 'Nouveau Reel'}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div><label className={label}>Titre</label><input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} className={champ} maxLength={150} /></div>
          <div><label className={label}>URL de la vidéo</label><input value={f.video_url} onChange={(e) => setF({ ...f, video_url: e.target.value })} className={champ} placeholder="https://…" /></div>
          <div><label className={label}>Miniature</label><ImageUpload value={f.miniature_url} onChange={(url) => setF({ ...f, miniature_url: url })} endpoint={`${API_URL}/api/uploads/salon-image`} /></div>
          <div><label className={label}>Légende</label><textarea value={f.legende} onChange={(e) => setF({ ...f, legende: e.target.value })} rows={3} className={champ} maxLength={5000} /></div>
          <div><label className={label}>Hashtags</label><textarea value={f.hashtags} onChange={(e) => setF({ ...f, hashtags: e.target.value })} rows={2} className={champ} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Musique</label><input value={f.musique} onChange={(e) => setF({ ...f, musique: e.target.value })} className={champ} /></div>
            <div><label className={label}>Durée (s)</label><input type="number" value={f.duree} onChange={(e) => setF({ ...f, duree: e.target.value })} className={champ} min={0} max={600} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Statut</label>
              <select value={f.statut} onChange={(e) => setF({ ...f, statut: e.target.value as IgStatut })} className={champ}>
                {(Object.keys(IG_STATUT_LABELS) as IgStatut[]).map((s) => <option key={s} value={s}>{IG_STATUT_LABELS[s]}</option>)}
              </select>
            </div>
            <div><label className={label}>Date de publication</label><input type="datetime-local" value={f.date_publication} onChange={(e) => setF({ ...f, date_publication: e.target.value })} className={champ} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button onClick={enregistrer} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  );
}

export default function MarketingReelsPage() {
  const [items, setItems] = useState<IgReel[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IgReel | null>(null);
  const [creating, setCreating] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.marketing.listReels({ q, statut, page, limit: LIMIT });
      setItems(res.data); setTotal(res.total); setTotalPages(res.totalPages);
    } catch { /* réseau */ } finally { setLoading(false); }
  }, [q, statut, page]);
  useEffect(() => { charger(); }, [charger]);
  const changer = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1); };

  async function dupliquer(r: IgReel) {
    try { await adminApi.marketing.duplicateReel(r.id); charger(); }
    catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Duplication impossible.' }); }
  }
  async function supprimer(r: IgReel) {
    const c = await Swal.fire({ icon: 'warning', title: 'Supprimer ce Reel ?', text: r.titre ?? '', showCancelButton: true, confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#dc2626' });
    if (!c.isConfirmed) return;
    try { await adminApi.marketing.deleteReel(r.id); charger(); }
    catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Suppression impossible.' }); }
  }

  const selectCls = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm';
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input value={q} onChange={(e) => changer(setQ)(e.target.value)} placeholder="Rechercher…" className="w-full bg-transparent py-2 text-sm outline-none" aria-label="Rechercher" />
        </div>
        <select value={statut} onChange={(e) => changer(setStatut)(e.target.value)} className={selectCls} aria-label="Statut">
          {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={() => setCreating(true)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"><Plus className="h-4 w-4" /> Nouveau</button>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-gray-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">Aucun Reel. Créez le premier 🎬</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="relative aspect-[9/16] max-h-56 w-full bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.miniature_url || '/img/bg4.jpg'} alt={r.titre ?? 'Reel'} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white"><Film className="h-3 w-3" /> Reel{r.duree ? ` · ${r.duree}s` : ''}</span>
              </div>
              <div className="p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-semibold text-gray-900">{r.titre || 'Sans titre'}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge[r.statut]}`}>{IG_STATUT_LABELS[r.statut]}</span>
                </div>
                <p className="line-clamp-2 text-xs text-gray-500">{r.legende || <span className="italic">Sans légende</span>}</p>
                <div className="mt-3 flex items-center gap-1">
                  <button onClick={() => setEditing(r)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Pencil className="h-3.5 w-3.5" /> Éditer</button>
                  <button onClick={() => dupliquer(r)} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"><Copy className="h-3.5 w-3.5" /> Dupliquer</button>
                  <button onClick={() => supprimer(r)} aria-label="Supprimer" className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-gray-500">{total} reel{total > 1 ? 's' : ''} · page {page} / {totalPages}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft className="h-4 w-4" /> Précédent</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Suivant <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {(creating || editing) && <ReelForm reel={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); charger(); }} />}
    </div>
  );
}
