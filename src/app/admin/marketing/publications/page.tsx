'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Pencil, Copy, Trash2, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import Swal from 'sweetalert2';
import { adminApi } from '@/lib/adminApi';
import { IG_STATUT_LABELS, type IgPost, type IgStatut } from '@/types/marketing';
import MarketingPostForm from '@/components/admin/marketing/MarketingPostForm';

const STATUTS: { value: string; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillons' },
  { value: 'programme', label: 'Programmées' },
  { value: 'publie', label: 'Publiées' },
];
const TRIS = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'ancien', label: 'Plus anciennes' },
  { value: 'date_pub', label: 'Date de publication' },
];
const LIMIT = 12;

const badge: Record<IgStatut, string> = {
  brouillon: 'bg-amber-100 text-amber-700',
  programme: 'bg-blue-100 text-blue-700',
  publie: 'bg-green-100 text-green-700',
};

export default function MarketingPublicationsPage() {
  const [items, setItems] = useState<IgPost[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [tri, setTri] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IgPost | null>(null);
  const [creating, setCreating] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.marketing.listPosts({ q, statut, tri, page, limit: LIMIT });
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      /* réseau */
    } finally {
      setLoading(false);
    }
  }, [q, statut, tri, page]);

  useEffect(() => { charger(); }, [charger]);

  const changer = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1); };

  async function dupliquer(p: IgPost) {
    try {
      await adminApi.marketing.duplicatePost(p.id);
      charger();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Duplication impossible.' });
    }
  }

  async function publier(p: IgPost) {
    const titre = (p.titre || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const c = await Swal.fire({
      title: 'Publier',
      html:
        `<div style="text-align:left">
           <p style="margin:0 0 10px"><b>${titre}</b></p>
           <label style="display:block;margin:6px 0"><input type="checkbox" id="pub-fb" checked> Facebook (Page)</label>
           <label style="display:block;margin:6px 0"><input type="checkbox" id="pub-ig" checked> Instagram</label>
           <small style="color:#6b7280">Via l’API officielle de Meta. L’image doit être une URL publique.</small>
         </div>`,
      showCancelButton: true, confirmButtonText: 'Publier', cancelButtonText: 'Annuler', confirmButtonColor: '#16a34a',
      preConfirm: () => {
        const fb = (document.getElementById('pub-fb') as HTMLInputElement | null)?.checked ?? false;
        const ig = (document.getElementById('pub-ig') as HTMLInputElement | null)?.checked ?? false;
        if (!fb && !ig) { Swal.showValidationMessage('Choisissez au moins un réseau.'); return false; }
        return { facebook: fb, instagram: ig };
      },
    });
    if (!c.isConfirmed || !c.value) return;

    try {
      const r = await adminApi.marketing.publishReseaux(p.id, c.value as { facebook: boolean; instagram: boolean });
      const ligne = (nom: string, res?: { statut: 'succes' | 'echec'; erreur?: string }) =>
        res ? `<div style="margin:4px 0"><b>${nom}</b> : ${res.statut === 'succes'
          ? '<span style="color:#16a34a">✅ publié</span>'
          : `<span style="color:#dc2626">❌ ${(res.erreur || 'échec').replace(/</g, '&lt;')}</span>`}</div>` : '';
      const tousOk = (!r.facebook || r.facebook.statut === 'succes') && (!r.instagram || r.instagram.statut === 'succes');
      await Swal.fire({
        icon: tousOk ? 'success' : 'warning',
        title: tousOk ? 'Publié 🎉' : 'Résultat de publication',
        html: `<div style="text-align:left">${ligne('Facebook', r.facebook)}${ligne('Instagram', r.instagram)}</div>`,
      });
      charger();
    } catch (e) {
      Swal.fire({ icon: 'info', title: 'Publication Meta', text: e instanceof Error ? e.message : 'Indisponible.' });
    }
  }

  async function supprimer(p: IgPost) {
    const r = await Swal.fire({
      icon: 'warning', title: 'Supprimer cette publication ?', text: p.titre,
      showCancelButton: true, confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    try {
      await adminApi.marketing.deletePost(p.id);
      charger();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Suppression impossible.' });
    }
  }

  const selectCls = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm';

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input value={q} onChange={(e) => changer(setQ)(e.target.value)} placeholder="Rechercher (titre, légende, hashtags)…" className="w-full bg-transparent py-2 text-sm outline-none" aria-label="Rechercher" />
        </div>
        <select value={statut} onChange={(e) => changer(setStatut)(e.target.value)} className={selectCls} aria-label="Statut">
          {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={tri} onChange={(e) => changer(setTri)(e.target.value)} className={selectCls} aria-label="Trier">
          {TRIS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={() => setCreating(true)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
          <Plus className="h-4 w-4" /> Nouvelle
        </button>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-gray-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">Aucune publication. Créez la première 🎉</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image_url || p.galerie[0] || '/img/bg4.jpg'} alt={p.titre} className="aspect-square w-full object-cover" />
              <div className="p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-semibold text-gray-900">{p.titre}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge[p.statut]}`}>{IG_STATUT_LABELS[p.statut]}</span>
                </div>
                <p className="line-clamp-2 text-xs text-gray-500">{p.legende || <span className="italic">Sans légende</span>}</p>
                <div className="mt-3 flex items-center gap-1">
                  <button onClick={() => setEditing(p)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Pencil className="h-3.5 w-3.5" /> Éditer</button>
                  <button onClick={() => dupliquer(p)} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"><Copy className="h-3.5 w-3.5" /> Dupliquer</button>
                  <button onClick={() => publier(p)} aria-label="Publier sur Facebook / Instagram" title="Publier (Facebook / Instagram)" className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"><Send className="h-4 w-4" /></button>
                  <button onClick={() => supprimer(p)} aria-label="Supprimer" className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-gray-500">{total} publication{total > 1 ? 's' : ''} · page {page} / {totalPages}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft className="h-4 w-4" /> Précédent</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Suivant <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {(creating || editing) && (
        <MarketingPostForm
          post={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); charger(); }}
        />
      )}
    </div>
  );
}
