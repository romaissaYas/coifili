import Swal from 'sweetalert2';
import { adminApi } from './adminApi';
import type { AdminSalon, AdminUser, AdminReservation, AdminEmploye } from '@/types/admin';

const ROSE = '#e11d67';
type Reload = () => void;

async function run(fn: () => Promise<unknown>, successTitle: string, reload: Reload): Promise<void> {
  try {
    await fn();
    reload();
    await Swal.fire({ icon: 'success', title: successTitle, timer: 1200, showConfirmButton: false });
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Erreur' });
  }
}

async function confirm(question: string): Promise<boolean> {
  const r = await Swal.fire({
    title: question,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Confirmer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: ROSE,
  });
  return r.isConfirmed;
}

export const salonActions = {
  validate: (s: AdminSalon, reload: Reload) =>
    run(() => adminApi.validateSalon(s.id), 'Salon validé', reload),

  reactivate: (s: AdminSalon, reload: Reload) =>
    run(() => adminApi.reactivateSalon(s.id), 'Salon réactivé', reload),

  suspend: async (s: AdminSalon, reload: Reload) => {
    if (await confirm(`Suspendre « ${s.nom} » ?`)) {
      run(() => adminApi.suspendSalon(s.id), 'Salon suspendu', reload);
    }
  },

  refuse: async (s: AdminSalon, reload: Reload) => {
    if (await confirm(`Refuser l'inscription de « ${s.nom} » ? Le salon sera supprimé.`)) {
      run(() => adminApi.refuseSalon(s.id), 'Inscription refusée', reload);
    }
  },

  remove: async (s: AdminSalon, reload: Reload) => {
    if (await confirm(`Supprimer définitivement « ${s.nom} » et ses réservations ?`)) {
      run(() => adminApi.deleteSalon(s.id), 'Salon supprimé', reload);
    }
  },

  subscription: async (s: AdminSalon, reload: Reload) => {
    const { value } = await Swal.fire({
      title: `Abonnement — ${s.nom}`,
      html: `
        <label class="swal2-label" style="display:block;text-align:left;font-size:13px">Début</label>
        <input id="ab-debut" type="date" class="swal2-input" value="${s.abonnement_debut ?? ''}">
        <label class="swal2-label" style="display:block;text-align:left;font-size:13px">Fin</label>
        <input id="ab-fin" type="date" class="swal2-input" value="${s.abonnement_fin ?? ''}">
        <input id="ab-montant" type="number" min="0" class="swal2-input" placeholder="Montant (DA)" value="${s.abonnement_montant ?? ''}">
        <select id="ab-paiement" class="swal2-input">
          <option value="en_attente">Paiement en attente</option>
          <option value="paye">Payé</option>
          <option value="impaye">Impayé</option>
        </select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: ROSE,
      didOpen: () => {
        const sel = document.getElementById('ab-paiement') as HTMLSelectElement | null;
        if (sel) sel.value = s.paiement_statut;
      },
      preConfirm: () => {
        const debut = (document.getElementById('ab-debut') as HTMLInputElement).value;
        const fin = (document.getElementById('ab-fin') as HTMLInputElement).value;
        const montant = (document.getElementById('ab-montant') as HTMLInputElement).value;
        const paiement = (document.getElementById('ab-paiement') as HTMLSelectElement).value;
        if (!debut || !fin) {
          Swal.showValidationMessage('Les dates de début et de fin sont requises.');
          return false;
        }
        if (fin < debut) {
          Swal.showValidationMessage('La date de fin doit être postérieure au début.');
          return false;
        }
        return {
          abonnement_debut: debut,
          abonnement_fin: fin,
          abonnement_montant: montant ? Number(montant) : undefined,
          paiement_statut: paiement,
        };
      },
    });
    if (value) {
      run(() => adminApi.updateSubscription(s.id, value), 'Abonnement mis à jour', reload);
    }
  },

  changePlan: async (s: AdminSalon, reload: Reload) => {
    const plans = await adminApi.listPlans();
    if (plans.length === 0) {
      await Swal.fire({ icon: 'error', title: 'Aucun plan disponible' });
      return;
    }
    const options = plans.map((p) => `<option value="${p.id}">${p.nom} — ${Number(p.prix).toLocaleString('fr-FR')} DA / ${p.duree_mois} mois</option>`).join('');
    const { value } = await Swal.fire({
      title: `Changer le plan — ${s.nom}`,
      html: `<select id="cp-plan" class="swal2-input">${options}</select>`,
      showCancelButton: true,
      confirmButtonText: 'Changer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: ROSE,
      preConfirm: () => Number((document.getElementById('cp-plan') as HTMLSelectElement).value),
    });
    if (value) run(() => adminApi.changePlan(s.id, value), 'Plan mis à jour', reload);
  },

  extend: async (s: AdminSalon, reload: Reload) => {
    const { value } = await Swal.fire({
      title: `Prolonger — ${s.nom}`,
      input: 'number',
      inputLabel: 'Nombre de mois à ajouter',
      inputValue: 1,
      inputAttributes: { min: '1', max: '60' },
      showCancelButton: true,
      confirmButtonText: 'Prolonger',
      cancelButtonText: 'Annuler',
      confirmButtonColor: ROSE,
      inputValidator: (v) => (!v || Number(v) < 1 ? 'Entrez un nombre de mois valide.' : undefined),
    });
    if (value) run(() => adminApi.extendSubscription(s.id, Number(value)), 'Abonnement prolongé', reload);
  },
};

const nomComplet = (u: AdminUser) => [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;

export const userActions = {
  suspend: async (u: AdminUser, reload: Reload) => {
    if (await confirm(`Suspendre le compte de ${nomComplet(u)} ?`)) {
      run(() => adminApi.suspendUser(u.id), 'Compte suspendu', reload);
    }
  },
  reactivate: (u: AdminUser, reload: Reload) =>
    run(() => adminApi.reactivateUser(u.id), 'Compte réactivé', reload),
  remove: async (u: AdminUser, reload: Reload) => {
    if (await confirm(`Supprimer définitivement ${nomComplet(u)} ?`)) {
      run(() => adminApi.deleteUser(u.id), 'Compte supprimé', reload);
    }
  },
  resetPassword: async (u: AdminUser, reload: Reload) => {
    const r = await Swal.fire({
      title: 'Réinitialiser le mot de passe',
      text: `Un mot de passe temporaire sera généré pour ${u.email}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Générer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: ROSE,
    });
    if (!r.isConfirmed) return;
    try {
      const res = await adminApi.resetPassword(u.id);
      reload();
      await Swal.fire({
        icon: 'success',
        title: 'Mot de passe réinitialisé',
        html: res.temporaryPassword
          ? `Mot de passe temporaire :<br><code style="font-size:16px">${res.temporaryPassword}</code><br><small>Communiquez-le à l'utilisateur.</small>`
          : 'Fait.',
      });
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Erreur' });
    }
  },
  edit: async (u: AdminUser, reload: Reload) => {
    const { value } = await Swal.fire({
      title: `Modifier ${u.email}`,
      html: `
        <input id="u-fn" class="swal2-input" placeholder="Prénom" value="${u.firstName ?? ''}">
        <input id="u-ln" class="swal2-input" placeholder="Nom" value="${u.lastName ?? ''}">
        <input id="u-em" class="swal2-input" placeholder="Email" value="${u.email ?? ''}">
        <input id="u-ph" class="swal2-input" placeholder="Téléphone" value="${u.phone ?? ''}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: ROSE,
      preConfirm: () => {
        const firstName = (document.getElementById('u-fn') as HTMLInputElement).value.trim();
        const lastName = (document.getElementById('u-ln') as HTMLInputElement).value.trim();
        const email = (document.getElementById('u-em') as HTMLInputElement).value.trim();
        const phone = (document.getElementById('u-ph') as HTMLInputElement).value.trim();
        if (!firstName || !lastName || !email || !phone) {
          Swal.showValidationMessage('Tous les champs sont requis.');
          return false;
        }
        return { firstName, lastName, email, phone };
      },
    });
    if (value) run(() => adminApi.updateUser(u.id, value), 'Utilisateur mis à jour', reload);
  },
};

export const reservationActions = {
  setStatut: (r: AdminReservation, statut: string, reload: Reload) =>
    run(() => adminApi.changeReservationStatut(r.id, statut), 'Statut mis à jour', reload),
  cancel: async (r: AdminReservation, reload: Reload) => {
    if (await confirm(`Annuler la réservation de ${r.client_nom} ?`)) {
      run(() => adminApi.cancelReservation(r.id), 'Réservation annulée', reload);
    }
  },
  remove: async (r: AdminReservation, reload: Reload) => {
    if (await confirm('Supprimer définitivement cette réservation ?')) {
      run(() => adminApi.deleteReservation(r.id), 'Réservation supprimée', reload);
    }
  },
};

export const employeActions = {
  remove: async (e: AdminEmploye, reload: Reload) => {
    if (await confirm(`Supprimer l'employé « ${e.nom} » ?`)) {
      run(() => adminApi.deleteEmploye(e.id), 'Employé supprimé', reload);
    }
  },
};

export const paymentActions = {
  validate: async (id: number, reference: string, reload: Reload) => {
    if (await confirm(`Valider le paiement ${reference} ? Le salon sera activé.`)) {
      run(() => adminApi.validatePayment(id), 'Paiement validé — salon activé', reload);
    }
  },
  refuse: async (id: number, reference: string, reload: Reload) => {
    if (await confirm(`Refuser le paiement ${reference} ?`)) {
      run(() => adminApi.refusePayment(id), 'Paiement refusé', reload);
    }
  },
};

export const abonnementActions = {
  runJob: async (reload: Reload) => {
    try {
      const res = await adminApi.runSubscriptions();
      reload();
      await Swal.fire({
        icon: 'success',
        title: 'Traitement effectué',
        text: `${res.expires} salon(s) expiré(s), ${res.alertes} alerte(s) envoyée(s).`,
      });
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Erreur', text: e instanceof Error ? e.message : 'Erreur' });
    }
  },
};
