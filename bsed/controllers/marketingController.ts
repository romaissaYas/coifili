import { Request, Response } from 'express';
import { ServiceError } from '../utils/ServiceError';
import { logger } from '../utils/logger';
import * as mediaSvc from '../services/marketingMediaService';
import * as reelSvc from '../services/marketingReelService';
import * as storySvc from '../services/marketingStoryService';
import * as highlightSvc from '../services/marketingHighlightService';
import * as hashtagSvc from '../services/marketingHashtagService';
import * as settingsSvc from '../services/marketingSettingsService';
import * as calendarSvc from '../services/marketingCalendarService';
import * as aiSvc from '../services/aiService';
import * as metaOAuth from '../services/metaOAuthService';
import * as metaPublish from '../services/metaPublishService';

function fail(res: Response, error: unknown, contexte: string): void {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, `Marketing (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

const num = (v: unknown): number | undefined => (v !== undefined ? Number(v) : undefined);
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

// --- Médiathèque ---
export const media = {
  async lister(req: Request, res: Response) {
    try {
      res.json(await mediaSvc.listerMedia({ type: str(req.query.type), q: str(req.query.q), page: num(req.query.page), limit: num(req.query.limit) }));
    } catch (e) { fail(res, e, 'media.lister'); }
  },
  async creer(req: Request, res: Response) {
    try { res.status(201).json(await mediaSvc.creerMedia(req.body)); } catch (e) { fail(res, e, 'media.creer'); }
  },
  async supprimer(req: Request, res: Response) {
    try { await mediaSvc.supprimerMedia(Number(req.params.id)); res.json({ message: 'Média supprimé.' }); } catch (e) { fail(res, e, 'media.supprimer'); }
  },
};

// --- Reels ---
export const reels = {
  async lister(req: Request, res: Response) {
    try {
      res.json(await reelSvc.listerReels({ statut: str(req.query.statut), q: str(req.query.q), tri: str(req.query.tri), page: num(req.query.page), limit: num(req.query.limit) }));
    } catch (e) { fail(res, e, 'reels.lister'); }
  },
  async obtenir(req: Request, res: Response) {
    try { res.json(await reelSvc.obtenirReel(Number(req.params.id))); } catch (e) { fail(res, e, 'reels.obtenir'); }
  },
  async creer(req: Request, res: Response) {
    try { res.status(201).json(await reelSvc.creerReel(req.body)); } catch (e) { fail(res, e, 'reels.creer'); }
  },
  async modifier(req: Request, res: Response) {
    try { res.json(await reelSvc.modifierReel(Number(req.params.id), req.body)); } catch (e) { fail(res, e, 'reels.modifier'); }
  },
  async supprimer(req: Request, res: Response) {
    try { await reelSvc.supprimerReel(Number(req.params.id)); res.json({ message: 'Reel supprimé.' }); } catch (e) { fail(res, e, 'reels.supprimer'); }
  },
  async dupliquer(req: Request, res: Response) {
    try { res.status(201).json(await reelSvc.dupliquerReel(Number(req.params.id))); } catch (e) { fail(res, e, 'reels.dupliquer'); }
  },
};

// --- Stories ---
export const stories = {
  async lister(req: Request, res: Response) {
    try {
      res.json(await storySvc.listerStories({
        highlight_id: req.query.highlight_id !== undefined ? Number(req.query.highlight_id) : undefined,
        statut: str(req.query.statut), q: str(req.query.q), page: num(req.query.page), limit: num(req.query.limit),
      }));
    } catch (e) { fail(res, e, 'stories.lister'); }
  },
  async obtenir(req: Request, res: Response) {
    try { res.json(await storySvc.obtenirStory(Number(req.params.id))); } catch (e) { fail(res, e, 'stories.obtenir'); }
  },
  async creer(req: Request, res: Response) {
    try { res.status(201).json(await storySvc.creerStory(req.body)); } catch (e) { fail(res, e, 'stories.creer'); }
  },
  async modifier(req: Request, res: Response) {
    try { res.json(await storySvc.modifierStory(Number(req.params.id), req.body)); } catch (e) { fail(res, e, 'stories.modifier'); }
  },
  async supprimer(req: Request, res: Response) {
    try { await storySvc.supprimerStory(Number(req.params.id)); res.json({ message: 'Story supprimée.' }); } catch (e) { fail(res, e, 'stories.supprimer'); }
  },
};

// --- Stories à la une (highlights) ---
export const highlights = {
  async lister(_req: Request, res: Response) {
    try { res.json(await highlightSvc.listerHighlights()); } catch (e) { fail(res, e, 'highlights.lister'); }
  },
  async creer(req: Request, res: Response) {
    try { res.status(201).json(await highlightSvc.creerHighlight(req.body)); } catch (e) { fail(res, e, 'highlights.creer'); }
  },
  async modifier(req: Request, res: Response) {
    try { res.json(await highlightSvc.modifierHighlight(Number(req.params.id), req.body)); } catch (e) { fail(res, e, 'highlights.modifier'); }
  },
  async supprimer(req: Request, res: Response) {
    try { await highlightSvc.supprimerHighlight(Number(req.params.id)); res.json({ message: 'Rubrique supprimée.' }); } catch (e) { fail(res, e, 'highlights.supprimer'); }
  },
};

// --- Hashtags ---
export const hashtags = {
  async lister(_req: Request, res: Response) {
    try { res.json(await hashtagSvc.listerHashtagGroups()); } catch (e) { fail(res, e, 'hashtags.lister'); }
  },
  async creer(req: Request, res: Response) {
    try { res.status(201).json(await hashtagSvc.creerHashtagGroup(req.body)); } catch (e) { fail(res, e, 'hashtags.creer'); }
  },
  async modifier(req: Request, res: Response) {
    try { res.json(await hashtagSvc.modifierHashtagGroup(Number(req.params.id), req.body)); } catch (e) { fail(res, e, 'hashtags.modifier'); }
  },
  async supprimer(req: Request, res: Response) {
    try { await hashtagSvc.supprimerHashtagGroup(Number(req.params.id)); res.json({ message: 'Banque supprimée.' }); } catch (e) { fail(res, e, 'hashtags.supprimer'); }
  },
};

// --- Paramètres ---
export const settings = {
  async obtenir(_req: Request, res: Response) {
    try { res.json(await settingsSvc.obtenirSettings()); } catch (e) { fail(res, e, 'settings.obtenir'); }
  },
  async modifier(req: Request, res: Response) {
    try { res.json(await settingsSvc.modifierSettings(req.body)); } catch (e) { fail(res, e, 'settings.modifier'); }
  },
};

// --- Calendrier éditorial ---
export const calendar = {
  async lister(req: Request, res: Response) {
    try {
      const from = str(req.query.from);
      const to = str(req.query.to);
      if (!from || !to) { res.status(400).json({ error: 'Paramètres from et to (YYYY-MM-DD) requis.' }); return; }
      res.json(await calendarSvc.listerCalendrier(from, to));
    } catch (e) { fail(res, e, 'calendar.lister'); }
  },
  async reprogrammer(req: Request, res: Response) {
    try {
      res.json(await calendarSvc.reprogrammer(String(req.params.type), Number(req.params.id), String(req.body?.date ?? '')));
    } catch (e) { fail(res, e, 'calendar.reprogrammer'); }
  },
};

// --- Génération IA ---
export const ai = {
  async etat(_req: Request, res: Response) {
    try { res.json(aiSvc.etatIa()); } catch (e) { fail(res, e, 'ai.etat'); }
  },
  async generer(req: Request, res: Response) {
    try { res.json(await aiSvc.genererContenu(String(req.body?.theme ?? ''))); } catch (e) { fail(res, e, 'ai.generer'); }
  },
  async image(req: Request, res: Response) {
    try { res.json(await aiSvc.genererImage(String(req.body?.prompt ?? ''))); } catch (e) { fail(res, e, 'ai.image'); }
  },
};

// --- Connexion & publication Meta (OAuth Facebook/Instagram, API officielle) ---
export const meta = {
  // État de la connexion (configuration + compte connecté). Jamais de jeton.
  async etat(_req: Request, res: Response) {
    try { res.json(await metaOAuth.obtenirConnexion()); } catch (e) { fail(res, e, 'meta.etat'); }
  },
  // URL d'autorisation OAuth à ouvrir côté frontend.
  async connectUrl(_req: Request, res: Response) {
    try { res.json({ url: metaOAuth.urlAutorisation() }); } catch (e) { fail(res, e, 'meta.connectUrl'); }
  },
  // Pages en attente de sélection (si plusieurs Pages sur le compte).
  async pages(_req: Request, res: Response) {
    try { res.json(await metaOAuth.listerPagesEnAttente()); } catch (e) { fail(res, e, 'meta.pages'); }
  },
  async selectPage(req: Request, res: Response) {
    try { await metaOAuth.selectionnerPage(String(req.body?.pageId ?? '')); res.json({ message: 'Page connectée.' }); }
    catch (e) { fail(res, e, 'meta.selectPage'); }
  },
  async disconnect(_req: Request, res: Response) {
    try { await metaOAuth.deconnecter(); res.json({ message: 'Compte Meta déconnecté.' }); }
    catch (e) { fail(res, e, 'meta.disconnect'); }
  },
  // Publication Instagram seule (compat route existante).
  async publierPost(req: Request, res: Response) {
    try { res.json(await metaPublish.publierInstagram(Number(req.params.id))); } catch (e) { fail(res, e, 'meta.publierPost'); }
  },
  // Publication par réseau (cases Facebook / Instagram).
  async publierReseaux(req: Request, res: Response) {
    try {
      res.json(await metaPublish.publierSurReseaux(Number(req.params.id), {
        facebook: Boolean(req.body?.facebook), instagram: Boolean(req.body?.instagram),
      }));
    } catch (e) { fail(res, e, 'meta.publierReseaux'); }
  },
};

/**
 * Callback OAuth Meta — route PUBLIQUE (appelée par Facebook, sans JWT ; la
 * sécurité repose sur le `state` signé). Redirige vers l'admin avec le résultat.
 */
export async function metaCallback(req: Request, res: Response): Promise<void> {
  const base = (process.env.APP_URL || process.env.PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const dest = `${base}/admin/marketing/parametres`;
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!code) { res.redirect(`${dest}?meta=error&reason=code_manquant`); return; }
    const r = await metaOAuth.traiterCallback(code, state);
    if (r.resultat === 'error') { res.redirect(`${dest}?meta=error&reason=${encodeURIComponent(r.reason ?? 'inconnu')}`); return; }
    res.redirect(`${dest}?meta=${r.resultat}`); // success | select
  } catch (e) {
    const msg = e instanceof ServiceError ? e.message : 'erreur_serveur';
    logger.error({ err: e }, 'Meta callback');
    res.redirect(`${dest}?meta=error&reason=${encodeURIComponent(msg)}`);
  }
}
