'use client';

import Swal from 'sweetalert2';
import { CheckCircle2, Clock, Download, Sparkles, CreditCard } from 'lucide-react';
import { useMonAbonnement } from '@/hooks/useMonAbonnement';
import { PageHeading } from '@/components/dashboard/ui';
import { telechargerRecu } from '@/lib/recu';
import { STATUT_LABELS, type Plan } from '@/types/abonnement';

const DA = (v: number | string) => `${Number(v).toLocaleString('fr-FR')} DA`;
const methodeLabel = (m: string) => (m === 'cash' ? 'Espèces' : m === 'cib' ? 'Carte CIB' : m);

function statutBadge(statut: string) {
  const styles: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    actif: 'bg-green-100 text-green-700',
    waiting_cash: 'bg-amber-100 text-amber-700',
    waiting_card: 'bg-amber-100 text-amber-700',
    pending: 'bg-gray-100 text-gray-600',
    en_attente: 'bg-amber-100 text-amber-700',
    refused: 'bg-red-100 text-red-700',
    expired: 'bg-red-100 text-red-700',
    expire: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-200 text-gray-600',
    suspendu: 'bg-orange-100 text-orange-700',
  };
  return `inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[statut] ?? 'bg-gray-100 text-gray-600'}`;
}

export default function MonAbonnementTab() {
  const { plans, mine, loading, souscrire } = useMonAbonnement();

  async function choisirPlan(plan: Plan) {
    // Le paiement par carte n'est proposé que si le backend l'a activé
    // (cash-only tant que l'intégration SATIM n'est pas finalisée).
    const carteActive = mine?.paiementCarteActive === true;
    const r = await Swal.fire({
      title: `Plan ${plan.nom}`,
      html: carteActive
        ? `<b>${DA(plan.prix)}</b> · ${plan.duree_mois} mois<br><br>Choisissez votre mode de paiement :`
        : `<b>${DA(plan.prix)}</b> · ${plan.duree_mois} mois<br><br>Réglez en espèces auprès d'un administrateur.`,
      showCancelButton: true,
      showDenyButton: carteActive,
      confirmButtonText: carteActive ? '💵 Espèces' : 'Confirmer (espèces)',
      denyButtonText: '💳 Carte CIB',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#16a34a',
      denyButtonColor: '#e11d67',
    });
    if (r.isConfirmed) souscrire(plan.id, 'cash');
    else if (r.isDenied && carteActive) souscrire(plan.id, 'cib');
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>;

  const actif = mine?.salonStatut === 'actif';
  const cta = actif ? 'Renouveler' : "S'abonner";

  return (
    <div>
      <PageHeading
        title="Mon abonnement"
        subtitle="Votre formule, vos paiements et votre échéance"
        icon={<CreditCard size={20} />}
      />

      {/* Statut courant */}
      <div className="mb-8 rounded-2xl bg-white p-6 shadow-md">
        {mine?.abonnement && (mine.salonStatut === 'actif' || mine.abonnement.statut === 'paid') ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <span className="text-lg font-bold text-gray-900">{mine.abonnement.plan_nom}</span>
                <span className={statutBadge(mine.salonStatut)}>{STATUT_LABELS[mine.salonStatut] ?? mine.salonStatut}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Du <b>{mine.abonnement_debut ?? '—'}</b> au <b>{mine.abonnement_fin ?? '—'}</b>
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-3xl font-bold text-rose-600">
                <Clock className="h-6 w-6" /> {mine.joursRestants ?? '—'}
              </div>
              <p className="text-sm text-gray-500">jours restants</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-rose-500" />
            <div>
              <p className="font-semibold text-gray-900">Votre salon n&apos;est pas encore actif.</p>
              <p className="text-sm text-gray-600">
                {mine?.abonnement && (mine.abonnement.statut === 'waiting_cash' || mine.abonnement.statut === 'waiting_card')
                  ? 'Un paiement est en attente de validation.'
                  : 'Abonnez-vous à un plan ci-dessous pour être visible et recevoir des réservations.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plans */}
      <h3 className="mb-4 text-lg font-semibold text-gray-800">{cta} — choisissez un plan</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg">
            <h4 className="text-lg font-bold text-gray-900">{plan.nom}</h4>
            <div className="mt-2 text-3xl font-extrabold text-rose-600">{DA(plan.prix)}</div>
            <p className="text-sm text-gray-500">pour {plan.duree_mois} mois</p>
            {plan.description && <p className="mt-3 flex-1 text-sm text-gray-600">{plan.description}</p>}
            <button
              onClick={() => choisirPlan(plan)}
              className="mt-4 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-rose-600 hover:to-pink-700"
            >
              {cta}
            </button>
          </div>
        ))}
      </div>

      {/* Historique des paiements */}
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Historique des paiements</h3>
      {!mine || mine.paiements.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">Aucun paiement pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Méthode</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mine.paiements.map((pay) => (
                <tr key={pay.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(pay.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{pay.reference}</td>
                  <td className="px-4 py-3 text-gray-600">{methodeLabel(pay.methode)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{DA(pay.montant)}</td>
                  <td className="px-4 py-3"><span className={statutBadge(pay.statut)}>{STATUT_LABELS[pay.statut] ?? pay.statut}</span></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => telechargerRecu(pay, mine.salonNom ?? 'Salon', mine.abonnement?.plan_nom)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                    >
                      <Download className="h-3.5 w-3.5" /> Reçu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
