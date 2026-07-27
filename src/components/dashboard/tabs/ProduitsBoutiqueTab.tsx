'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Plus, Pencil, Trash2, Eye, Upload, Download, X, ShoppingBag, Loader2 } from 'lucide-react';
import { useMesProduits } from '@/hooks/useMesProduits';
import { BTN_PRIMARY, PageHeading } from '@/components/dashboard/ui';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';

// Contraintes d'upload (alignées sur le backend : middleware/upload.ts).
const TYPES_IMAGE = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const IMAGE_MAX_MB = 5;
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORIE_LABELS,
  type Product,
} from '@/types/product';

const EMPTY = {
  nom: '',
  description: '',
  categorie: 'cheveux' as (typeof PRODUCT_CATEGORIES)[number],
  marque: '',
  prix: '',
  prix_promo: '',
  stock: '',
  disponibilite: true,
  imagePrincipale: '',
  galerie: '',
};

const prixNb = (v: number | string | null) => (v == null ? null : Number(v));
const formatDA = (v: number | string | null) => {
  const n = prixNb(v);
  return n == null ? '—' : `${n.toLocaleString('fr-FR')} DA`;
};

export default function ProduitsBoutiqueTab() {
  const { produits, loading, creer, modifier, supprimer, publier, depublier } = useMesProduits();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [preview, setPreview] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [uploading, setUploading] = useState(false);
  // Aperçu LOCAL immédiat (URL.createObjectURL) de l'image principale, affiché
  // dès la sélection — indépendamment de l'upload. `form.imagePrincipale`
  // continue de ne contenir que l'URL serveur (jamais un blob:), donc
  // l'enregistrement reste inchangé.
  const [mainPreview, setMainPreview] = useState('');

  // Libère l'URL objet précédente à chaque changement / démontage (anti-fuite).
  useEffect(() => {
    return () => {
      if (mainPreview.startsWith('blob:')) URL.revokeObjectURL(mainPreview);
    };
  }, [mainPreview]);

  // Ce qui est réellement affiché : l'aperçu local s'il existe, sinon l'URL serveur.
  const imagePrincipaleAffichee = mainPreview || form.imagePrincipale;

  // Galerie stockée en interne comme chaîne (une URL par ligne) : inchangé pour
  // construirePayload. On la manipule ici sous forme de liste.
  const galerieList = form.galerie.split('\n').map((s) => s.trim()).filter(Boolean);

  /** Envoie un fichier au serveur (multipart/form-data) et renvoie l'URL enregistrée. */
  async function uploaderImage(file: File): Promise<string | null> {
    if (!TYPES_IMAGE.includes(file.type)) {
      Swal.fire({ icon: 'warning', title: 'Format non supporté', text: 'Formats acceptés : JPG, JPEG, PNG, WebP.' });
      return null;
    }
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'Image trop volumineuse', text: `Taille maximale : ${IMAGE_MAX_MB} Mo.` });
      return null;
    }
    const data = new FormData();
    data.append('image', file);
    setUploading(true);
    try {
      const res = await axios.post<{ url: string }>(`${API_URL}/api/uploads/image`, data, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
      });
      return res.data.url;
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Échec de l’envoi', text: (axios.isAxiosError(e) && e.response?.data?.error) || 'Veuillez réessayer.' });
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function choisirImagePrincipale(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return; // garde : aucun fichier sélectionné (ex. annulation)
    // 1) Aperçu LOCAL immédiat (aucune attente réseau).
    const apercu = URL.createObjectURL(file);
    setMainPreview(apercu);
    // 2) Upload en arrière-plan → URL serveur pour l'enregistrement.
    const url = await uploaderImage(file);
    if (url) {
      setForm((f) => ({ ...f, imagePrincipale: url }));
    } else {
      // Échec (format/taille/serveur) : on retire l'aperçu, état cohérent.
      setMainPreview('');
    }
  }

  function retirerImagePrincipale() {
    setMainPreview('');
    setForm((f) => ({ ...f, imagePrincipale: '' }));
  }

  async function ajouterImagesGalerie(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    for (const file of files) {
      const url = await uploaderImage(file);
      if (url) setForm((f) => ({ ...f, galerie: [...f.galerie.split('\n').map((s) => s.trim()).filter(Boolean), url].join('\n') }));
    }
  }

  function retirerImageGalerie(url: string) {
    setForm((f) => ({ ...f, galerie: f.galerie.split('\n').map((s) => s.trim()).filter((u) => u && u !== url).join('\n') }));
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  function ouvrirCreation() {
    setEditing(null);
    setMainPreview('');
    setForm({ ...EMPTY });
    setFormOpen(true);
  }

  function ouvrirEdition(p: Product) {
    setEditing(p);
    setMainPreview(''); // on repart de l'URL serveur existante (p.images[0])
    setForm({
      nom: p.nom,
      description: p.description ?? '',
      categorie: p.categorie,
      marque: p.marque ?? '',
      prix: String(prixNb(p.prix) ?? ''),
      prix_promo: p.prix_promo != null ? String(prixNb(p.prix_promo)) : '',
      stock: p.stock != null ? String(p.stock) : '',
      disponibilite: p.disponibilite,
      imagePrincipale: p.images[0] ?? '',
      galerie: p.images.slice(1).join('\n'),
    });
    setFormOpen(true);
  }

  function construirePayload(statut?: 'draft' | 'published') {
    const images = [form.imagePrincipale, ...form.galerie.split(/[\n,]/).map((s) => s.trim())].filter(Boolean);
    return {
      nom: form.nom.trim(),
      description: form.description.trim() || undefined,
      categorie: form.categorie,
      marque: form.marque.trim() || undefined,
      prix: Number(form.prix),
      prix_promo: form.prix_promo ? Number(form.prix_promo) : null,
      stock: form.stock ? Number(form.stock) : null,
      disponibilite: form.disponibilite,
      images,
      ...(statut ? { statut } : {}),
    };
  }

  async function soumettre(statut?: 'draft' | 'published') {
    if (!form.nom.trim() || !form.prix || Number.isNaN(Number(form.prix))) {
      Swal.fire({ icon: 'warning', title: 'Champs requis', text: 'Le nom et un prix valide sont obligatoires.' });
      return;
    }
    const ok = editing
      ? await modifier(editing.id, construirePayload())
      : await creer(construirePayload(statut));
    if (ok) setFormOpen(false);
  }

  const input = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400';

  return (
    <div>
      <PageHeading
        title="Mes Produits"
        subtitle="Votre boutique en ligne"
        icon={<ShoppingBag size={20} />}
        actions={
          <button onClick={ouvrirCreation} className={BTN_PRIMARY}>
            <Plus className="h-4 w-4" /> Nouveau produit
          </button>
        }
      />

      {loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : produits.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
          Aucun produit pour le moment. Cliquez sur « Nouveau produit ».
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produits.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0] || '/img/bg4.jpg'} alt={p.nom} className="h-12 w-12 rounded-lg object-cover" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{p.nom}</div>
                    <div className="text-xs capitalize text-gray-500">{PRODUCT_CATEGORIE_LABELS[p.categorie]}{p.marque ? ` · ${p.marque}` : ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    {prixNb(p.prix_promo) != null ? (
                      <span><span className="font-semibold text-rose-600">{formatDA(p.prix_promo)}</span> <span className="text-xs text-gray-400 line-through">{formatDA(p.prix)}</span></span>
                    ) : (
                      <span className="font-semibold text-gray-800">{formatDA(p.prix)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.stock ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.statut === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.statut === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => ouvrirEdition(p)} className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"><Pencil className="mr-1 inline h-3 w-3" />Modifier</button>
                      {p.statut === 'published' ? (
                        <button onClick={() => depublier(p.id)} className="rounded-md bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-200"><Download className="mr-1 inline h-3 w-3" />Dépublier</button>
                      ) : (
                        <button onClick={() => publier(p.id)} className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-200"><Upload className="mr-1 inline h-3 w-3" />Publier</button>
                      )}
                      <button onClick={() => setPreview(p)} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200"><Eye className="mr-1 inline h-3 w-3" />Aperçu</button>
                      <button onClick={() => supprimer(p.id)} className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-200"><Trash2 className="mr-1 inline h-3 w-3" />Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulaire (création / édition) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editing ? 'Modifier le produit' : 'Nouveau produit'}</h3>
              <button onClick={() => setFormOpen(false)} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-700">Nom *</label><input value={form.nom} onChange={set('nom')} className={input} /></div>
              <div><label className="mb-1 block text-sm font-medium text-gray-700">Catégorie *</label>
                <select value={form.categorie} onChange={set('categorie')} className={input}>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{PRODUCT_CATEGORIE_LABELS[c]}</option>)}
                </select>
              </div>
              <div><label className="mb-1 block text-sm font-medium text-gray-700">Marque</label><input value={form.marque} onChange={set('marque')} className={input} /></div>
              <div><label className="mb-1 block text-sm font-medium text-gray-700">Prix (DA) *</label><input type="number" min="0" value={form.prix} onChange={set('prix')} className={input} /></div>
              <div><label className="mb-1 block text-sm font-medium text-gray-700">Prix promotionnel (DA)</label><input type="number" min="0" value={form.prix_promo} onChange={set('prix_promo')} className={input} /></div>
              <div><label className="mb-1 block text-sm font-medium text-gray-700">Stock</label><input type="number" min="0" value={form.stock} onChange={set('stock')} className={input} /></div>
              <div className="flex items-end"><label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.disponibilite} onChange={set('disponibilite')} className="h-4 w-4" /> Disponible</label></div>
              {/* Image principale : upload depuis l'ordinateur/le téléphone + aperçu */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Image principale</label>
                {imagePrincipaleAffichee ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePrincipaleAffichee} alt="Aperçu" className="h-20 w-20 rounded-lg border border-gray-200 object-cover" />
                    {uploading && <span className="inline-flex items-center gap-1.5 text-xs text-gray-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Envoi…</span>}
                    <button type="button" onClick={retirerImagePrincipale} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                      <X className="h-4 w-4" /> Retirer
                    </button>
                  </div>
                ) : (
                  <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-6 text-sm text-gray-500 hover:border-rose-400 hover:bg-rose-50/40 ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'Envoi en cours…' : 'Choisir une image (JPG, PNG, WebP — max 5 Mo)'}
                    <input type="file" accept="image/*" className="hidden" onChange={choisirImagePrincipale} disabled={uploading} />
                  </label>
                )}
              </div>

              {/* Galerie : plusieurs images uploadées */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Galerie (photos supplémentaires)</label>
                {galerieList.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {galerieList.map((url) => (
                      <div key={url} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Aperçu galerie" className="h-16 w-16 rounded-lg border border-gray-200 object-cover" />
                        <button type="button" onClick={() => retirerImageGalerie(url)} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-500 shadow ring-1 ring-gray-200 hover:text-rose-600" aria-label="Retirer">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-500 hover:border-rose-400 hover:bg-rose-50/40 ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {uploading ? 'Envoi en cours…' : 'Ajouter des photos'}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={ajouterImagesGalerie} disabled={uploading} />
                </label>
              </div>
              <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-700">Description</label><textarea value={form.description} onChange={set('description')} rows={3} className={input} /></div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {editing ? (
                <button onClick={() => soumettre()} disabled={uploading} className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2 text-sm font-semibold text-white hover:from-rose-600 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50">Enregistrer</button>
              ) : (
                <>
                  <button onClick={() => soumettre('draft')} disabled={uploading} className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Brouillon</button>
                  <button onClick={() => soumettre('published')} disabled={uploading} className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2 text-sm font-semibold text-white hover:from-rose-600 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50">Publier</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aperçu */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-52 w-full overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.images[0] || '/img/bg4.jpg'} alt={preview.nom} className="h-full w-full object-cover" />
              {prixNb(preview.prix_promo) != null && <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">Promo</span>}
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900">{preview.nom}</h3>
              <p className="text-sm capitalize text-gray-500">{PRODUCT_CATEGORIE_LABELS[preview.categorie]}{preview.marque ? ` · ${preview.marque}` : ''}</p>
              {preview.description && <p className="mt-2 text-sm text-gray-600">{preview.description}</p>}
              <div className="mt-3 flex items-center gap-2">
                {prixNb(preview.prix_promo) != null ? (
                  <><span className="text-xl font-bold text-rose-600">{formatDA(preview.prix_promo)}</span><span className="text-sm text-gray-400 line-through">{formatDA(preview.prix)}</span></>
                ) : (
                  <span className="text-xl font-bold text-gray-900">{formatDA(preview.prix)}</span>
                )}
              </div>
              <button onClick={() => setPreview(null)} className="mt-4 w-full rounded-full border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
