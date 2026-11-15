'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Hash, Copy } from 'lucide-react';
import Swal from 'sweetalert2';
import { adminApi } from '@/lib/adminApi';
import type { IgHashtagGroup, IgHashtagGroupInput } from '@/types/marketing';

function HashtagForm({ item, onClose, onSaved }: { item: IgHashtagGroup | null; onClose: () => void; onSaved: () => void }) {
  const [nom, setNom] = useState(item?.nom ?? '');
  const [tags, setTags] = useState(item?.tags ?? '');
  const [saving, setSaving] = useState(false);
  const champ = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400';
  const label = 'mb-1 block text-sm font-medium text-gray-700';

  async function enregistrer() {
    if (!nom.trim() || !tags.trim()) { Swal.fire({ icon: 'warning', title: 'Champs requis', text: 'Nom et hashtags obligatoires.' }); return; }
    const body: IgHashtagGroupInput = { nom: nom.trim(), tags: tags.trim() };
    setSaving(true);
    try {
      if (item) await adminApi.marketing.updateHashtag(item.id, body);
      else await adminApi.marketing.createHashtag(body);
      onSaved();
    } catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Enregistrement impossible.' }); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{item ? 'Modifier la banque' : 'Nouvelle banque'}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div><label className={label}>Nom</label><input value={nom} onChange={(e) => setNom(e.target.value)} className={champ} placeholder="Clients, Salons, Local…" maxLength={100} /></div>
          <div><label className={label}>Hashtags</label><textarea value={tags} onChange={(e) => setTags(e.target.value)} rows={4} className={champ} placeholder="#Coifili #BeautéAlgérie #DZ" maxLength={2000} /></div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button onClick={enregistrer} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  );
}

export default function MarketingHashtagsPage() {
  const [items, setItems] = useState<IgHashtagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IgHashtagGroup | null>(null);
  const [creating, setCreating] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try { setItems(await adminApi.marketing.listHashtags()); } catch { /* réseau */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  async function supprimer(g: IgHashtagGroup) {
    const c = await Swal.fire({ icon: 'warning', title: 'Supprimer cette banque ?', text: g.nom, showCancelButton: true, confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#dc2626' });
    if (!c.isConfirmed) return;
    try { await adminApi.marketing.deleteHashtag(g.id); charger(); }
    catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Suppression impossible.' }); }
  }

  async function copier(g: IgHashtagGroup) {
    try { await navigator.clipboard.writeText(g.tags); Swal.fire({ icon: 'success', title: 'Copié !', timer: 1000, showConfirmButton: false }); } catch { /* clipboard indispo */ }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">Banques de hashtags réutilisables pour vos publications.</p>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"><Plus className="h-4 w-4" /> Nouvelle</button>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-gray-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">Aucune banque. Créez la première #️⃣</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((g) => (
            <div key={g.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900"><Hash className="h-4 w-4 text-rose-500" /> {g.nom}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => copier(g)} aria-label="Copier" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Copy className="h-4 w-4" /></button>
                  <button onClick={() => setEditing(g)} aria-label="Éditer" className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => supprimer(g)} aria-label="Supprimer" className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="text-sm text-rose-600">{g.tags}</p>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && <HashtagForm item={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); charger(); }} />}
    </div>
  );
}
