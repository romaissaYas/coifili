import express, { Request, Response } from 'express';
import { openapiSpec } from '../docs/openapi';

/**
 * Documentation de l'API :
 *   GET /api/docs.json → spécification OpenAPI 3.0 (JSON)
 *   GET /api/docs      → rendu HTML lisible, généré côté serveur (aucun JS,
 *                        aucune dépendance externe → compatible CSP stricte).
 *
 * La page HTML n'affiche aucune donnée utilisateur : on assouplit la CSP pour
 * ce seul point d'entrée afin d'autoriser un style en ligne minimal.
 */
const router = express.Router();

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const COULEUR_METHODE: Record<string, string> = {
  get: '#16a34a', post: '#2563eb', put: '#d97706', delete: '#dc2626', patch: '#7c3aed',
};

function rendreHtml(): string {
  const paths = openapiSpec.paths as Record<string, Record<string, any>>;
  const blocs: string[] = [];

  for (const [chemin, methodes] of Object.entries(paths)) {
    for (const [methode, op] of Object.entries(methodes)) {
      const couleur = COULEUR_METHODE[methode] ?? '#6b7280';
      const secu = op.security ? ' 🔒' : '';
      const tag = Array.isArray(op.tags) ? op.tags[0] : '';
      const reponses = Object.entries(op.responses ?? {})
        .map(([code, r]: [string, any]) => `<code class="r">${esc(code)}</code> ${esc(r.description)}`)
        .join('<br>');
      blocs.push(`
        <div class="op">
          <div class="ligne">
            <span class="m" style="background:${couleur}">${esc(methode.toUpperCase())}</span>
            <span class="p">${esc(chemin)}</span>
            <span class="t">${esc(tag)}${secu}</span>
          </div>
          <div class="s">${esc(op.summary ?? '')}</div>
          ${op.description ? `<div class="d">${esc(op.description)}</div>` : ''}
          <div class="rep">${reponses}</div>
        </div>`);
    }
  }

  const info = openapiSpec.info;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(info.title)} — Documentation</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:920px;margin:0 auto;padding:24px;color:#1f2937;line-height:1.5}
  h1{font-size:26px;margin:0 0 4px}
  .ver{color:#6b7280;font-size:14px;margin-bottom:16px}
  .intro{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 16px;font-size:14px;margin-bottom:20px}
  .op{border:1px solid #e5e7eb;border-radius:10px;padding:12px 16px;margin-bottom:10px}
  .ligne{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .m{color:#fff;font-weight:700;font-size:12px;padding:2px 8px;border-radius:6px;min-width:56px;text-align:center}
  .p{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:600}
  .t{color:#6b7280;font-size:12px;margin-left:auto}
  .s{margin-top:6px;font-size:14px}
  .d{margin-top:4px;font-size:13px;color:#6b7280}
  .rep{margin-top:8px;font-size:13px;color:#374151}
  code{font-family:ui-monospace,Menlo,Consolas,monospace}
  code.r{background:#f3f4f6;border-radius:4px;padding:1px 5px;font-size:12px}
  a{color:#e11d67}
</style></head>
<body>
  <h1>${esc(info.title)}</h1>
  <div class="ver">v${esc(info.version)} · OpenAPI ${esc(openapiSpec.openapi)}</div>
  <div class="intro">${esc(info.description)}<br><br>
    Spécification brute : <a href="/api/docs.json">/api/docs.json</a> (importable dans Swagger Editor / Postman).
    🔒 = authentification requise (Bearer JWT).</div>
  ${blocs.join('\n')}
</body></html>`;
}

router.get('/docs.json', (_req: Request, res: Response) => {
  res.json(openapiSpec);
});

router.get('/docs', (_req: Request, res: Response) => {
  // Page statique sans donnée utilisateur : on autorise le style en ligne.
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'self'");
  res.type('html').send(rendreHtml());
});

export default router;
