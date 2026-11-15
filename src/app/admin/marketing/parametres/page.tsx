'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save, CheckCircle2, XCircle, Facebook, Instagram, Link2, Unlink, AlertTriangle, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { adminApi } from '@/lib/adminApi';
import type { IgSettings, MetaConnection, MetaPage } from '@/types/marketing';

export default function MarketingParametresPage() {
  const [s, setS] = useState<IgSettings | null>(null);
  const [aiProvider, setAiProvider] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [conn, setConn] = useState<MetaConnection | null>(null);
  const [pages, setPages] = useState<MetaPage[]>([]);
  const [busy, setBusy] = useState(false);

  const chargerStatut = useCallback(async () => {
    try {
      const c = await adminApi.marketing.metaStatus();
      setConn(c);
      if (c.statut === 'pending') {
        try { setPages(await adminApi.marketing.metaPages()); } catch { setPages([]); }
      } else {
        setPages([]);
      }
    } catch { /* réseau */ }
  }, []);

  // Chargement initial + traitement du retour OAuth (?meta=success|select|error).
  useEffect(() => {
    adminApi.marketing.getSettings()
      .then((data) => { setS(data); setAiProvider(data.ai_provider ?? ''); })
      .catch(() => {}).finally(() => setLoading(false));

    const params = new URLSearchParams(window.location.search);
    const meta = params.get('meta');
    if (meta) {
      const reason = params.get('reason') || '';
      window.history.replaceState({}, '', window.location.pathname);
      if (meta === 'success') Swal.fire({ icon: 'success', title: 'Compte Meta connecté 🎉', timer: 1800, showConfirmButton: false });
      else if (meta === 'select') Swal.fire({ icon: 'info', title: 'Choisissez votre Page', text: 'Plusieurs Pages Facebook trouvées : sélectionnez celle du salon ci-dessous.' });
      else if (meta === 'error') Swal.fire({ icon: 'error', title: 'Connexion Meta échouée', text: reason ? `Raison : ${reason}` : 'Réessayez.' });
    }
    chargerStatut();
  }, [chargerStatut]);

  async function connecter() {
    setBusy(true);
    try {
      const { url } = await adminApi.marketing.metaConnectUrl();
      window.location.href = url; // redirection vers le dialogue OAuth Facebook
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Connexion impossible.' });
      setBusy(false);
    }
  }

  async function choisirPage(id: string) {
    setBusy(true);
    try {
      await adminApi.marketing.metaSelectPage(id);
      await Swal.fire({ icon: 'success', title: 'Page connectée', timer: 1400, showConfirmButton: false });
      await chargerStatut();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Sélection impossible.' });
    } finally { setBusy(false); }
  }

  async function deconnecter() {
    const c = await Swal.fire({ icon: 'warning', title: 'Déconnecter le compte Meta ?', showCancelButton: true, confirmButtonText: 'Déconnecter', cancelButtonText: 'Annuler', confirmButtonColor: '#dc2626' });
    if (!c.isConfirmed) return;
    setBusy(true);
    try { await adminApi.marketing.metaDisconnect(); await chargerStatut(); }
    catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Déconnexion impossible.' }); }
    finally { setBusy(false); }
  }

  async function enregistrer() {
    setSaving(true);
    try {
      const data = await adminApi.marketing.updateSettings({ ai_provider: aiProvider || null });
      setS(data);
      Swal.fire({ icon: 'success', title: 'Paramètres enregistrés', timer: 1200, showConfirmButton: false });
    } catch (e) { Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Enregistrement impossible.' }); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>;

  const champ = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400';
  const label = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Carte d'intégration Meta (OAuth) */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Facebook className="h-5 w-5 text-[#1877F2]" />
          <Instagram className="h-5 w-5 text-[#E1306C]" />
          <h2 className="text-lg font-semibold text-gray-900">Facebook & Instagram</h2>
        </div>

        {!conn?.configure ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Intégration non configurée côté serveur. Renseignez <code>META_APP_ID</code>, <code>META_APP_SECRET</code>, <code>META_OAUTH_REDIRECT_URI</code> et <code>META_TOKEN_SECRET</code> dans l’environnement, puis redémarrez.</span>
          </div>
        ) : conn.connected ? (
          <div>
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <span><b>Connecté</b> — Page : <b>{conn.pageName}</b></span>
            </div>
            {conn.igUsername ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <Instagram className="h-4 w-4 text-[#E1306C]" /> Compte Instagram lié : <b>@{conn.igUsername}</b>
              </div>
            ) : (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Aucun <b>compte Instagram Professionnel</b> lié à cette Page. La publication Facebook fonctionnera, mais pas Instagram. Liez un compte IG Pro à la Page puis reconnectez.</span>
              </div>
            )}
            <button onClick={deconnecter} disabled={busy} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-60">
              <Unlink className="h-4 w-4" /> Déconnecter
            </button>
          </div>
        ) : conn.statut === 'pending' ? (
          <div>
            <p className="mb-3 text-sm text-gray-600">Plusieurs Pages trouvées. Choisissez la <b>Page du salon</b> :</p>
            <div className="space-y-2">
              {pages.length === 0 ? (
                <p className="text-sm text-gray-400">Chargement des Pages…</p>
              ) : pages.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <span className="text-sm">
                    <b>{p.name}</b>
                    {p.hasInstagram
                      ? <span className="ml-2 text-xs text-green-600">● Instagram lié</span>
                      : <span className="ml-2 text-xs text-amber-600">● sans Instagram</span>}
                  </span>
                  <button onClick={() => choisirPage(p.id)} disabled={busy} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60">Choisir</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-gray-600">Connectez votre Page Facebook et votre compte Instagram Professionnel pour publier depuis Coifili.</p>
            <button onClick={connecter} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166fe0] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Connecter Facebook &amp; Instagram
            </button>
          </div>
        )}
      </div>

      {/* Génération IA */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Génération IA</h2>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s?.ia_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {s?.ia_active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {s?.ia_active ? 'activée' : 'désactivée'}
          </span>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          La <b>clé API</b> (secret) se configure via <code>AI_API_KEY</code> côté serveur — jamais stockée en base. Sans clé, les boutons « Générer » restent inactifs.
        </p>
        <div><label className={label}>Fournisseur IA</label><input value={aiProvider} onChange={(e) => setAiProvider(e.target.value)} className={champ} placeholder="anthropic, openai…" maxLength={40} /></div>
        <div className="mt-4 flex justify-end">
          <button onClick={enregistrer} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  );
}
