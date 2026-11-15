import { ServiceError } from '../utils/ServiceError';
import { logger } from '../utils/logger';

/**
 * Génération de contenu par IA — architecture derrière une interface fournisseur.
 *
 * HONNÊTETÉ : aucun fournisseur n'est actif tant qu'aucune clé n'est configurée
 * dans l'environnement. Rien n'est simulé.
 *   - Texte : activé si `AI_API_KEY` est défini (fournisseur `AI_PROVIDER`,
 *     défaut « anthropic »). Implémentation Anthropic réelle ci-dessous.
 *   - Image : nécessite un fournisseur d'images (`AI_IMAGE_API_KEY`) — non
 *     branché ici ; renvoie une erreur claire tant qu'il n'est pas configuré.
 */

export type ContenuGenere = {
  titre: string;
  legende: string;
  hashtags: string;
  emojis: string;
  cta: string;
  image_prompt: string;
};

export function etatIa(): { texte: boolean; image: boolean; provider: string | null } {
  return {
    texte: Boolean(process.env.AI_API_KEY),
    image: Boolean(process.env.AI_IMAGE_API_KEY),
    provider: process.env.AI_PROVIDER || (process.env.AI_API_KEY ? 'anthropic' : null),
  };
}

const CONTEXTE_MARQUE =
  "Coifili est une plateforme algérienne de réservation en ligne de salons de coiffure, barbier, " +
  "institut de beauté et manucure. Gratuit pour les clients. Couleur de marque rose. Ton chaleureux, " +
  "professionnel et local. Ne jamais inventer de fonctionnalité (pas de paiement carte en ligne, pas " +
  "d'application native, pas de formations).";

/** Extrait un objet JSON d'une réponse potentiellement entourée de texte. */
function extraireJson(texte: string): Partial<ContenuGenere> {
  const debut = texte.indexOf('{');
  const fin = texte.lastIndexOf('}');
  if (debut === -1 || fin === -1) return {};
  try {
    return JSON.parse(texte.slice(debut, fin + 1));
  } catch {
    return {};
  }
}

/** Appelle Anthropic (Messages API) pour produire le contenu structuré. */
async function genererAnthropic(theme: string, apiKey: string): Promise<ContenuGenere> {
  const model = process.env.AI_MODEL || 'claude-3-5-sonnet-latest';
  const prompt =
    `${CONTEXTE_MARQUE}\n\nGénère une publication Instagram en français pour le thème : « ${theme} ».\n` +
    `Réponds UNIQUEMENT par un objet JSON avec ces clés : titre, legende, hashtags, emojis, cta, image_prompt. ` +
    `(image_prompt en anglais, prêt pour un générateur d'images, cohérent avec la marque rose.)`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    logger.error({ status: res.status, detail }, '[ia] réponse fournisseur non OK');
    throw new ServiceError(502, "Le fournisseur d'IA a renvoyé une erreur.");
  }
  const data: any = await res.json();
  const texte: string = data?.content?.[0]?.text ?? '';
  const j = extraireJson(texte);
  return {
    titre: j.titre ?? theme,
    legende: j.legende ?? '',
    hashtags: j.hashtags ?? '',
    emojis: j.emojis ?? '',
    cta: j.cta ?? '',
    image_prompt: j.image_prompt ?? '',
  };
}

/** Génère un contenu de publication. 503 si l'IA n'est pas configurée. */
export async function genererContenu(theme: string): Promise<ContenuGenere> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new ServiceError(503, "La génération IA n'est pas configurée (clé AI_API_KEY absente).");
  }
  const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  if (provider !== 'anthropic') {
    throw new ServiceError(501, `Fournisseur IA « ${provider} » non implémenté. Utilisez « anthropic ».`);
  }
  return genererAnthropic(theme || 'Coifili', apiKey);
}

/** Génère une image à partir d'un prompt. Nécessite un fournisseur d'images. */
export async function genererImage(_prompt: string): Promise<{ url: string }> {
  if (!process.env.AI_IMAGE_API_KEY) {
    throw new ServiceError(503, "La génération d'images n'est pas configurée (clé AI_IMAGE_API_KEY absente). L'architecture est prête : branchez un fournisseur d'images pour l'activer.");
  }
  // Point d'extension : appeler ici le fournisseur d'images configuré, puis
  // enregistrer le résultat dans la médiathèque (ig_media). Non branché tant
  // qu'aucun fournisseur n'est retenu — on ne simule rien.
  throw new ServiceError(501, "Fournisseur d'images à brancher.");
}
