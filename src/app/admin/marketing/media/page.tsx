'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Trash2, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import ImageUpload from '@/components/common/ImageUpload';
import { adminApi } from '@/lib/adminApi';
import type { IgMedia, IgMediaType } from '@/types/marketing';

const TYPES: { value: string; label: string }[] = [
  { value: '', label: 'Tous les types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Vidéos' },
  { value: 'logo', label: 'Logos' },
  { value: 'icon', label: 'Icônes' },
  { value: 'cover', label: 'Couvertures' },
];
const LIMIT = 24;

function MediaForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<IgMediaType>('image');
  const [url, setUrl] = useState('');
  const [titre, setTitre] = useState('');
  const [saving, setSaving] = useState(false);
  const champ = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400';
  const label = 'mb-1 block text-sm font-medium text-gray-700';

  async function enregistrer() {
    if (!url) { Swal.fire({ icon: 'warning', title: 'Fichier requis', text: 'Téléversez une image d’abord.' }); return; }
    setSaving(true);
    try { await adminApi.marketing.createMedia({ type, url, titre: titre || null }); onSaved(); }
    catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Enregistrement impossible.' }); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Ajouter un média</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div><label className={label}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as IgMediaType)} className={champ}>
              {TYPES.filter((t) => t.value).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><label className={label}>Fichier</label><ImageUpload value={url} onChange={setUrl} endpoint={`${API_URL}/api/uploads/salon-image`} /></div>
          <div><label className={label}>Titre (optionnel)</label><input value={titre} onChange={(e) => setTitre(e.target.value)} className={champ} maxLength={150} /></div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button onClick={enregistrer} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Ajout…' : 'Ajouter'}</button>
        </div>
      </div>
    </div>
  );
}

export default function MarketingMediaPage() {
  const [items, setItems] = useState<IgMedia[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.marketing.listMedia({ q, type, page, limit: LIMIT });
      setItems(res.data); setTotal(res.total); setTotalPages(res.totalPages);
    } catch { /* réseau */ } finally { setLoading(false); }
  }, [q, type, page]);
  useEffect(() => { charger(); }, [charger]);
  const changer = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1); };

  async function supprimer(m: IgMedia) {
    const c = await Swal.fire({ icon: 'warning', title: 'Supprimer ce média ?', showCancelButton: true, confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#dc2626' });
    if (!c.isConfirmed) return;
    try { await adminApi.marketing.deleteMedia(m.id); charger(); }
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
        <select value={type} onChange={(e) => changer(setType)(e.target.value)} className={selectCls} aria-label="Type">
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={() => setCreating(true)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"><Plus className="h-4 w-4" /> Ajouter</button>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-gray-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">Médiathèque vide. Ajoutez un premier média 🖼️</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.titre ?? m.type} className="aspect-square w-full object-cover" />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium capitalize text-white">{m.type}</span>
              <button onClick={() => supprimer(m)} aria-label="Supprimer" className="absolute right-1 top-1 rounded-lg bg-white/90 p-1 text-gray-500 opacity-0 transition group-hover:opacity-100 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-gray-500">{total} média{total > 1 ? 's' : ''} · page {page} / {totalPages}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft className="h-4 w-4" /> Précédent</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Suivant <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {creating && <MediaForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); charger(); }} />}
    </div>
  );
}
