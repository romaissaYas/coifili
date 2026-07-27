'use client';

import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { TYPES_IMAGE, IMAGE_MAX_MB } from '@/lib/imageUpload';
import { getAuthHeaders } from '@/lib/authHeaders';

/**
 * Logique d'upload d'image réutilisable (validation format/taille, envoi
 * multipart/form-data, état de chargement, messages d'erreur). Identique au
 * comportement de l'upload des images de produits, factorisé ici pour être
 * partagé (produits, image de salon à l'inscription et côté admin).
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  /**
   * Valide puis envoie `file` à `endpoint`. Renvoie l'URL enregistrée, ou
   * `null` en cas de fichier invalide / erreur (un message est alors affiché).
   * `auth=true` joint le token (endpoints protégés, ex. produits).
   */
  async function uploader(file: File, endpoint: string, auth = false): Promise<string | null> {
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
      const res = await axios.post<{ url: string }>(endpoint, data, {
        headers: { ...(auth ? getAuthHeaders() : {}), 'Content-Type': 'multipart/form-data' },
      });
      return res.data.url;
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Échec de l’envoi', text: (axios.isAxiosError(e) && e.response?.data?.error) || 'Veuillez réessayer.' });
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { uploading, uploader };
}
