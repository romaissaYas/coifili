import { pool } from '../db/pool';

/**
 * Paramètres du module Marketing (table `ig_settings`, ligne unique id=1).
 * NE STOCKE PAS de secret : les tokens Meta et clés IA proviennent de
 * l'environnement (voir bsed/.env.example). Ici, seuls des identifiants non
 * sensibles / préférences. On expose aussi l'état d'activation (dérivé de l'env)
 * pour l'UI, sans jamais renvoyer les valeurs secrètes.
 */

export type SettingsInput = {
  meta_page_id?: string | null;
  ig_business_id?: string | null;
  ai_provider?: string | null;
};

export async function obtenirSettings() {
  await pool.execute('INSERT IGNORE INTO ig_settings (id) VALUES (1)');
  const [rows]: any = await pool.query(
    'SELECT id, meta_page_id, ig_business_id, ai_provider, updated_at FROM ig_settings WHERE id = 1'
  );
  const settings = rows[0] ?? { id: 1, meta_page_id: null, ig_business_id: null, ai_provider: null };
  // Booléens d'activation dérivés de l'environnement (secrets jamais exposés).
  return {
    ...settings,
    meta_publication_active: Boolean(process.env.META_ACCESS_TOKEN),
    ia_active: Boolean(process.env.AI_API_KEY),
  };
}

export async function modifierSettings(data: SettingsInput) {
  await pool.execute('INSERT IGNORE INTO ig_settings (id) VALUES (1)');
  await pool.execute(
    'UPDATE ig_settings SET meta_page_id = ?, ig_business_id = ?, ai_provider = ? WHERE id = 1',
    [data.meta_page_id ?? null, data.ig_business_id ?? null, data.ai_provider ?? null]
  );
  return obtenirSettings();
}
