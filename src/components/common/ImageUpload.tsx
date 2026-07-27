'use client';

import { useEffect, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { IMAGE_MAX_MB } from '@/lib/imageUpload';

/**
 * Champ d'upload d'une image (réutilisable). Reproduit exactement le
 * comportement de l'upload des images de produits :
 *  - sélection d'un fichier depuis l'appareil ;
 *  - aperçu LOCAL immédiat (URL.createObjectURL) ;
 *  - envoi au serveur puis stockage de l'URL renvoyée (via `onChange`) ;
 *  - remplacement / retrait avant validation, avec nettoyage des aperçus ;
 *  - état de chargement et messages d'erreur.
 *
 * `value` = URL serveur actuelle (persistée dans le formulaire). L'aperçu local
 * n'est jamais renvoyé au backend : `onChange` ne reçoit que l'URL serveur.
 */
export default function ImageUpload({
  value,
  onChange,
  endpoint,
  auth = false,
  className = '',
}: {
  value: string;
  onChange: (url: string) => void;
  endpoint: string;
  auth?: boolean;
  className?: string;
}) {
  const { uploading, uploader } = useImageUpload();
  const [preview, setPreview] = useState('');

  // Révoque l'URL objet précédente à chaque changement / démontage (anti-fuite).
  useEffect(() => {
    return () => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const affichee = preview || value;

  async function choisir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return; // annulation de la sélection
    const local = URL.createObjectURL(file);
    setPreview(local); // aperçu immédiat
    const url = await uploader(file, endpoint, auth);
    if (url) onChange(url);
    else setPreview(''); // échec : on retire l'aperçu (état cohérent)
  }

  function retirer() {
    setPreview('');
    onChange('');
  }

  return (
    <div className={className}>
      {affichee ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={affichee} alt="Aperçu" className="h-20 w-20 rounded-lg border border-gray-200 object-cover" />
          {uploading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Envoi…
            </span>
          )}
          <button
            type="button"
            onClick={retirer}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <X className="h-4 w-4" /> Retirer
          </button>
        </div>
      ) : (
        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-6 text-sm text-gray-500 hover:border-rose-400 hover:bg-rose-50/40 ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Envoi en cours…' : `Choisir une image (JPG, PNG, WebP — max ${IMAGE_MAX_MB} Mo)`}
          <input type="file" accept="image/*" className="hidden" onChange={choisir} disabled={uploading} />
        </label>
      )}
    </div>
  );
}
