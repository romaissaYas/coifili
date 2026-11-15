/** Types du module Marketing Instagram (côté frontend admin). */

export type IgStatut = 'brouillon' | 'programme' | 'publie';

export type IgPost = {
  id: number;
  titre: string;
  image_url: string | null;
  galerie: string[];
  image_prompt: string | null;
  legende: string | null;
  hashtags: string | null;
  emojis: string | null;
  cta: string | null;
  statut: IgStatut;
  date_publication: string | null;
  meta_media_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Données d'un formulaire de publication (création / édition). */
export type IgPostInput = {
  titre: string;
  image_url?: string | null;
  galerie?: string[];
  image_prompt?: string | null;
  legende?: string | null;
  hashtags?: string | null;
  emojis?: string | null;
  cta?: string | null;
  statut?: IgStatut;
  date_publication?: string | null;
};

export type IgPostStats = {
  total: number;
  brouillon: number;
  programme: number;
  publie: number;
};

/** Enveloppe paginée renvoyée par les endpoints `.../page` et marketing. */
export type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const IG_STATUT_LABELS: Record<IgStatut, string> = {
  brouillon: 'Brouillon',
  programme: 'Programmé',
  publie: 'Publié',
};

// --- Reels ---
export type IgReel = {
  id: number;
  titre: string | null;
  video_url: string | null;
  miniature_url: string | null;
  legende: string | null;
  hashtags: string | null;
  musique: string | null;
  duree: number | null;
  statut: IgStatut;
  date_publication: string | null;
  meta_media_id: string | null;
  created_at: string;
  updated_at: string;
};
export type IgReelInput = {
  titre?: string | null;
  video_url?: string | null;
  miniature_url?: string | null;
  legende?: string | null;
  hashtags?: string | null;
  musique?: string | null;
  duree?: number | null;
  statut?: IgStatut;
  date_publication?: string | null;
};

// --- Stories ---
export type IgStory = {
  id: number;
  highlight_id: number | null;
  categorie: string | null;
  image_url: string | null;
  video_url: string | null;
  texte: string | null;
  sticker: string | null;
  lien: string | null;
  ordre: number;
  statut: IgStatut;
  date_publication: string | null;
  created_at: string;
  updated_at: string;
};
export type IgStoryInput = {
  highlight_id?: number | null;
  categorie?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  texte?: string | null;
  sticker?: string | null;
  lien?: string | null;
  ordre?: number | null;
  statut?: IgStatut;
  date_publication?: string | null;
};

// --- Stories à la une ---
export type IgHighlight = {
  id: number;
  cle: string;
  titre: string;
  cover_url: string | null;
  ordre: number;
  nb_stories?: number;
  created_at: string;
  updated_at: string;
};
export type IgHighlightInput = { cle: string; titre: string; cover_url?: string | null; ordre?: number | null };

// --- Médiathèque ---
export type IgMediaType = 'image' | 'video' | 'logo' | 'icon' | 'cover';
export type IgMedia = {
  id: number;
  type: IgMediaType;
  url: string;
  titre: string | null;
  alt: string | null;
  largeur: number | null;
  hauteur: number | null;
  taille: number | null;
  created_at: string;
};
export type IgMediaInput = { type: IgMediaType; url: string; titre?: string | null; alt?: string | null };

// --- Hashtags ---
export type IgHashtagGroup = { id: number; nom: string; tags: string; created_at: string; updated_at: string };
export type IgHashtagGroupInput = { nom: string; tags: string };

// --- Paramètres ---
export type IgSettings = {
  id: number;
  meta_page_id: string | null;
  ig_business_id: string | null;
  ai_provider: string | null;
  updated_at: string | null;
  meta_publication_active: boolean;
  ia_active: boolean;
};
export type IgSettingsInput = { meta_page_id?: string | null; ig_business_id?: string | null; ai_provider?: string | null };

// --- Calendrier ---
export type IgCalendarType = 'post' | 'reel' | 'story';
export type IgCalendarItem = {
  id: number;
  type: IgCalendarType;
  titre: string | null;
  date_publication: string;
  statut: IgStatut;
};

// --- Connexion Meta (Facebook + Instagram) ---
export type MetaConnection = {
  configure: boolean;
  connected: boolean;
  statut: 'pending' | 'connected' | null;
  pageName: string | null;
  igUsername: string | null;
  igBusinessId: string | null;
};
export type MetaPage = { id: string; name: string; hasInstagram: boolean };
export type MetaResultatReseau = { statut: 'succes' | 'echec'; media_id?: string; erreur?: string };
export type MetaPublishResult = { facebook?: MetaResultatReseau; instagram?: MetaResultatReseau };

// --- IA ---
export type IgAiStatus = { texte: boolean; image: boolean; provider: string | null };
export type IgContenuGenere = {
  titre: string;
  legende: string;
  hashtags: string;
  emojis: string;
  cta: string;
  image_prompt: string;
};
