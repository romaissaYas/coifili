'use client';

import { useState } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import ImageUpload from '@/components/common/ImageUpload';
import { adminApi } from '@/lib/adminApi';
import { IG_STATUT_LABELS, type IgPost, type IgPostInput, type IgStatut } from '@/types/marketing';

/** Convertit un DATETIME serveur (ou ISO) vers la valeur d'un input datetime-local. */
function toLocalInput(v: string | null): string {
  if (!v) return '';
  const s = v.replace(' ', 'T');
  return s.slice(0, 16);
}

/**
 * Formulaire de création / édition d'une publication Instagram, en modale.
 * Réutilise le composant d'upload d'image existant (endpoint public salon-image)
 * et le client `adminApi`. Le bouton « Générer avec IA » est présent mais
 * informe que la fonctionnalité sera activée une fois un fournisseur configuré
 * (aucun provider IA n'existe encore dans le projet — rien n'est simulé).
 */
export default function MarketingPostForm({
  post,
  onClose,
  onSaved,
}: {
  post: IgPost | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [titre, setTitre] = useState(post?.titre ?? '');
  const [imageUrl, setImageUrl] = useState(post?.image_url ?? '');
  const [galerie, setGalerie] = useState((post?.galerie ?? []).join('\n'));
  const [imagePrompt, setImagePrompt] = useState(post?.image_prompt ?? '');
  const [legende, setLegende] = useState(post?.legende ?? '');
  const [hashtags, setHashtags] = useState(post?.hashtags ?? '');
  const [emojis, setEmojis] = useState(post?.emojis ?? '');
  const [cta, setCta] = useState(post?.cta ?? '');
  const [statut, setStatut] = useState<IgStatut>(post?.statut ?? 'brouillon');
  const [datePublication, setDatePublication] = useState(toLocalInput(post?.date_publication ?? null));
  const [saving, setSaving] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  // Génération IA du contenu : remplit automatiquement le formulaire.
  // L'API renvoie une erreur claire si aucun fournisseur n'est configuré.
  async function genererIA() {
    const { value: theme } = await Swal.fire({
      title: 'Générer avec IA', input: 'text', inputLabel: 'Thème de la publication',
      inputValue: titre, inputPlaceholder: 'Ex. réserver son barbier',
      showCancelButton: true, confirmButtonText: 'Générer', cancelButtonText: 'Annuler',
    });
    if (!theme) return;
    setGenLoading(true);
    try {
      const c = await adminApi.marketing.aiGenerate(String(theme));
      setTitre(c.titre); setLegende(c.legende); setHashtags(c.hashtags);
      setEmojis(c.emojis); setCta(c.cta); setImagePrompt(c.image_prompt);
      Swal.fire({ icon: 'success', title: 'Contenu généré', timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'info', title: 'Génération IA', text: e instanceof Error ? e.message : 'Indisponible.' });
    } finally { setGenLoading(false); }
  }

  async function genererImageIA() {
    if (!imagePrompt.trim()) { Swal.fire({ icon: 'warning', title: 'Prompt requis', text: 'Renseignez un prompt d’image.' }); return; }
    try {
      const r = await adminApi.marketing.aiImage(imagePrompt);
      setImageUrl(r.url);
      Swal.fire({ icon: 'success', title: 'Image générée', timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'info', title: 'Génération d’image', text: e instanceof Error ? e.message : 'Indisponible.' });
    }
  }

  async function enregistrer() {
    if (!titre.trim()) {
      Swal.fire({ icon: 'warning', title: 'Titre requis', text: 'Donnez un titre à la publication.' });
      return;
    }
    const body: IgPostInput = {
      titre: titre.trim(),
      image_url: imageUrl || null,
      galerie: galerie.split(/[\n]/).map((s) => s.trim()).filter(Boolean),
      image_prompt: imagePrompt || null,
      legende: legende || null,
      hashtags: hashtags || null,
      emojis: emojis || null,
      cta: cta || null,
      statut,
      date_publication: datePublication || null,
    };
    setSaving(true);
    try {
      if (post) await adminApi.marketing.updatePost(post.id, body);
      else await adminApi.marketing.createPost(body);
      onSaved();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Enregistrement impossible.' });
    } finally {
      setSaving(false);
    }
  }

  const champ = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400';
  const label = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{post ? 'Modifier la publication' : 'Nouvelle publication'}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          {/* Colonne formulaire */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-800">Contenu</span>
              <button
                type="button"
                onClick={genererIA}
                disabled={genLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" /> {genLoading ? 'Génération…' : 'Générer avec IA'}
              </button>
            </div>

            <div>
              <label className={label}>Titre *</label>
              <input value={titre} onChange={(e) => setTitre(e.target.value)} className={champ} maxLength={150} />
            </div>

            <div>
              <label className={label}>Image principale</label>
              <ImageUpload value={imageUrl} onChange={setImageUrl} endpoint={`${API_URL}/api/uploads/salon-image`} />
            </div>

            <div>
              <label className={label}>Galerie (une URL par ligne)</label>
              <textarea value={galerie} onChange={(e) => setGalerie(e.target.value)} rows={2} className={champ} placeholder="/img/bg1.jpg" />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className={label + ' mb-0'}>Prompt de génération d’image</label>
                <button type="button" onClick={genererImageIA} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100">
                  <Sparkles className="h-3 w-3" /> Générer l’image
                </button>
              </div>
              <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} rows={2} className={champ} />
            </div>

            <div>
              <label className={label}>Légende</label>
              <textarea value={legende} onChange={(e) => setLegende(e.target.value)} rows={4} className={champ} maxLength={5000} />
            </div>

            <div>
              <label className={label}>Hashtags</label>
              <textarea value={hashtags} onChange={(e) => setHashtags(e.target.value)} rows={2} className={champ} placeholder="#Coifili #BeautéAlgérie" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Emojis</label>
                <input value={emojis} onChange={(e) => setEmojis(e.target.value)} className={champ} placeholder="✂️💛" />
              </div>
              <div>
                <label className={label}>Appel à l’action</label>
                <input value={cta} onChange={(e) => setCta(e.target.value)} className={champ} placeholder="Lien en bio 🔗" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Statut</label>
                <select value={statut} onChange={(e) => setStatut(e.target.value as IgStatut)} className={champ}>
                  {(Object.keys(IG_STATUT_LABELS) as IgStatut[]).map((s) => (
                    <option key={s} value={s}>{IG_STATUT_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Date de publication</label>
                <input type="datetime-local" value={datePublication} onChange={(e) => setDatePublication(e.target.value)} className={champ} />
              </div>
            </div>
          </div>

          {/* Colonne aperçu */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-gray-800">Aperçu</span>
            <div className="mx-auto max-w-xs overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-[10px] font-bold text-white">C</span>
                <span className="text-xs font-semibold text-gray-800">coifili_plateforme</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl || galerie.split('\n')[0] || '/img/bg4.jpg'} alt="Aperçu" className="aspect-square w-full object-cover" />
              <div className="px-3 py-2 text-xs text-gray-700">
                <p className="whitespace-pre-wrap"><span className="font-semibold">coifili_plateforme</span> {legende}</p>
                {cta && <p className="mt-1 font-medium text-gray-800">{cta}</p>}
                {hashtags && <p className="mt-1 text-rose-600">{hashtags}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={enregistrer}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
