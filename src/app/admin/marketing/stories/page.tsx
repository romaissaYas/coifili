'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import ImageUpload from '@/components/common/ImageUpload';
import { adminApi } from '@/lib/adminApi';
import { IG_STATUT_LABELS, type IgStory, type IgStoryInput, type IgStatut, type IgHighlight } from '@/types/marketing';

const LIMIT = 15;
function toLocalInput(v: string | null): string { return v ? v.replace(' ', 'T').slice(0, 16) : ''; }

function StoryForm({ story, highlights, onClose, onSaved }: { story: IgStory | null; highlights: IgHighlight[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    highlight_id: story?.highlight_id != null ? String(story.highlight_id) : '',
    categorie: story?.categorie ?? '',
    image_url: story?.image_url ?? '',
    video_url: story?.video_url ?? '',
    texte: story?.texte ?? '',
    sticker: story?.sticker ?? '',
    lien: story?.lien ?? '',
    ordre: story?.ordre != null ? String(story.ordre) : '0',
    statut: (story?.statut ?? 'brouillon') as IgStatut,
    date_publication: toLocalInput(story?.date_publication ?? null),
  });
  const [saving, setSaving] = useState(false);
  const champ = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400';
  const label = 'mb-1 block text-sm font-medium text-gray-700';

  async function enregistrer() {
    const body: IgStoryInput = {
      highlight_id: f.highlight_id ? Number(f.highlight_id) : null,
      categorie: f.categorie || null, image_url: f.image_url || null, video_url: f.video_url || null,
      texte: f.texte || null, sticker: f.sticker || null, lien: f.lien || null,
      ordre: Number(f.ordre) || 0, statut: f.statut, date_publication: f.date_publication || null,
    };
    setSaving(true);
    try {
      if (story) await adminApi.marketing.updateStory(story.id, body);
      else await adminApi.marketing.createStory(body);
      onSaved();
    } catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Enregistrement impossible.' }); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{story ? 'Modifier la Story' : 'Nouvelle Story'}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div><label className={label}>Image</label><ImageUpload value={f.image_url} onChange={(url) => setF({ ...f, image_url: url })} endpoint={`${API_URL}/api/uploads/salon-image`} /></div>
          <div><label className={label}>Texte affiché</label><textarea value={f.texte} onChange={(e) => setF({ ...f, texte: e.target.value })} rows={2} className={champ} maxLength={2000} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Sticker / interaction</label><input value={f.sticker} onChange={(e) => setF({ ...f, sticker: e.target.value })} className={champ} placeholder="Sondage, Quiz…" /></div>
            <div><label className={label}>Lien</label><input value={f.lien} onChange={(e) => setF({ ...f, lien: e.target.value })} className={champ} placeholder="https://…" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Rubrique « à la une »</label>
              <select value={f.highlight_id} onChange={(e) => setF({ ...f, highlight_id: e.target.value })} className={champ}>
                <option value="">— Aucune —</option>
                {highlights.map((h) => <option key={h.id} value={h.id}>{h.titre}</option>)}
              </select>
            </div>
            <div><label className={label}>Ordre</label><input type="number" value={f.ordre} onChange={(e) => setF({ ...f, ordre: e.target.value })} className={champ} min={0} /></div>
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

export default function MarketingStoriesPage() {
  const [items, setItems] = useState<IgStory[]>([]);
  const [highlights, setHighlights] = useState<IgHighlight[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filtreH, setFiltreH] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IgStory | null>(null);
  const [creating, setCreating] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.marketing.listStories({ highlight_id: filtreH ? Number(filtreH) : undefined, page, limit: LIMIT });
      setItems(res.data); setTotal(res.total); setTotalPages(res.totalPages);
    } catch { /* réseau */ } finally { setLoading(false); }
  }, [filtreH, page]);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { adminApi.marketing.listHighlights().then(setHighlights).catch(() => {}); }, []);

  const nomHighlight = (id: number | null) => highlights.find((h) => h.id === id)?.titre ?? '—';

  async function supprimer(s: IgStory) {
    const c = await Swal.fire({ icon: 'warning', title: 'Supprimer cette Story ?', showCancelButton: true, confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#dc2626' });
    if (!c.isConfirmed) return;
    try { await adminApi.marketing.deleteStory(s.id); charger(); }
    catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Suppression impossible.' }); }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select value={filtreH} onChange={(e) => { setFiltreH(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" aria-label="Filtrer par rubrique">
          <option value="">Toutes les rubriques</option>
          {highlights.map((h) => <option key={h.id} value={h.id}>{h.titre}</option>)}
        </select>
        <button onClick={() => setCreating(true)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"><Plus className="h-4 w-4" /> Nouvelle Story</button>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-gray-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">Aucune Story.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="relative aspect-[9/16] max-h-48 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image_url || '/img/bg4.jpg'} alt={s.texte ?? 'Story'} className="h-full w-full object-cover" />
                {s.texte && <span className="absolute inset-x-1 bottom-1 line-clamp-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">{s.texte}</span>}
              </div>
              <div className="p-2">
                <div className="truncate text-[11px] text-gray-500">{nomHighlight(s.highlight_id)}{s.sticker ? ` · ${s.sticker}` : ''}</div>
                <div className="mt-1 flex items-center justify-end gap-1">
                  <button onClick={() => setEditing(s)} aria-label="Éditer" className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => supprimer(s)} aria-label="Supprimer" className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-gray-500">{total} storie{total > 1 ? 's' : ''} · page {page} / {totalPages}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft className="h-4 w-4" /> Précédent</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Suivant <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {(creating || editing) && <StoryForm story={editing} highlights={highlights} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); charger(); }} />}
    </div>
  );
}
