'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Star } from 'lucide-react';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import ImageUpload from '@/components/common/ImageUpload';
import { adminApi } from '@/lib/adminApi';
import type { IgHighlight, IgHighlightInput } from '@/types/marketing';

function HighlightForm({ item, onClose, onSaved }: { item: IgHighlight | null; onClose: () => void; onSaved: () => void }) {
  const [cle, setCle] = useState(item?.cle ?? '');
  const [titre, setTitre] = useState(item?.titre ?? '');
  const [cover, setCover] = useState(item?.cover_url ?? '');
  const [ordre, setOrdre] = useState(item?.ordre != null ? String(item.ordre) : '0');
  const [saving, setSaving] = useState(false);
  const champ = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400';
  const label = 'mb-1 block text-sm font-medium text-gray-700';

  async function enregistrer() {
    if (!cle.trim() || !titre.trim()) { Swal.fire({ icon: 'warning', title: 'Champs requis', text: 'Clé et titre sont obligatoires.' }); return; }
    const body: IgHighlightInput = { cle: cle.trim(), titre: titre.trim(), cover_url: cover || null, ordre: Number(ordre) || 0 };
    setSaving(true);
    try {
      if (item) await adminApi.marketing.updateHighlight(item.id, body);
      else await adminApi.marketing.createHighlight(body);
      onSaved();
    } catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Enregistrement impossible.' }); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{item ? 'Modifier la rubrique' : 'Nouvelle rubrique'}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div><label className={label}>Clé (identifiant unique)</label><input value={cle} onChange={(e) => setCle(e.target.value)} className={champ} placeholder="a_propos, faq, salons…" maxLength={40} /></div>
          <div><label className={label}>Titre</label><input value={titre} onChange={(e) => setTitre(e.target.value)} className={champ} placeholder="À propos" maxLength={100} /></div>
          <div><label className={label}>Couverture</label><ImageUpload value={cover} onChange={setCover} endpoint={`${API_URL}/api/uploads/salon-image`} /></div>
          <div><label className={label}>Ordre d’affichage</label><input type="number" value={ordre} onChange={(e) => setOrdre(e.target.value)} className={champ} min={0} /></div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button onClick={enregistrer} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  );
}

export default function MarketingHighlightsPage() {
  const [items, setItems] = useState<IgHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IgHighlight | null>(null);
  const [creating, setCreating] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try { setItems(await adminApi.marketing.listHighlights()); } catch { /* réseau */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  async function supprimer(h: IgHighlight) {
    const c = await Swal.fire({ icon: 'warning', title: 'Supprimer cette rubrique ?', html: `${h.titre}<br><small>Les stories rattachées seront détachées, pas supprimées.</small>`, showCancelButton: true, confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#dc2626' });
    if (!c.isConfirmed) return;
    try { await adminApi.marketing.deleteHighlight(h.id); charger(); }
    catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Suppression impossible.' }); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">Rubriques de Stories à la une (À propos, FAQ, Salons…). Rattachez-y des Stories depuis l’onglet Stories.</p>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"><Plus className="h-4 w-4" /> Nouvelle</button>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-gray-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">Aucune rubrique. Créez la première ⭐</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((h) => (
            <div key={h.id} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
              <div className="mx-auto mb-2 h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-rose-500 to-pink-600 ring-2 ring-rose-100">
                {h.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.cover_url} alt={h.titre} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-white"><Star className="h-7 w-7" /></span>
                )}
              </div>
              <div className="truncate text-sm font-semibold text-gray-900">{h.titre}</div>
              <div className="text-[11px] text-gray-400">{h.nb_stories ?? 0} storie(s)</div>
              <div className="mt-2 flex items-center justify-center gap-1">
                <button onClick={() => setEditing(h)} aria-label="Éditer" className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => supprimer(h)} aria-label="Supprimer" className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && <HighlightForm item={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); charger(); }} />}
    </div>
  );
}
