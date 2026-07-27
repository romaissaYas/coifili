import { pool, withTransaction } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { getPaymentProvider } from './payment';
import { envoyerEmail } from './emailService';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Système d'abonnement payant (plans / souscriptions / paiements).
 *
 * ZÉRO RÉGRESSION : à l'ACTIVATION, ce service met à jour `salons.statut` et
 * `abonnement_*` — donc le gating public/réservation/login EXISTANT (basé sur
 * salons.statut) continue de fonctionner sans aucune modification.
 */

export type MethodePaiement = 'cash' | 'cib';

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function ajouterMois(dateStr: string, mois: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + mois);
  return d.toISOString().slice(0, 10);
}

/** Email d'abonnement, en fire-and-forget (ne bloque/annule jamais l'opération). */
function notifierSalon(salonId: number, sujet: string, message: string): void {
  void (async () => {
    try {
      const [rows]: any = await pool.query('SELECT nom, email FROM salons WHERE id = ?', [salonId]);
      const salon = rows[0];
      if (!salon?.email) return;
      const html = `<div style="font-family:Arial,sans-serif;padding:20px;background:#f7f7fb">
        <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
          <div style="background:#e11d67;padding:20px 28px"><span style="color:#fff;font-size:22px;font-weight:800">Coifili</span></div>
          <div style="padding:28px"><h2 style="margin:0 0 12px;color:#111827;font-size:18px">${sujet}</h2>
          <p style="color:#374151;font-size:14px;line-height:1.6">Bonjour ${salon.nom},<br>${message}</p></div>
        </div></div>`;
      await envoyerEmail({ to: salon.email, subject: `Coifili — ${sujet}`, html });
    } catch (e) {
      logger.error({ err: e }, '[abonnement] email échoué :');
    }
  })();
}

export async function listerPlans(actifsSeulement = true) {
  const [rows] = await pool.query(
    `SELECT id, nom, prix, duree_mois, description, actif
     FROM subscription_plans ${actifsSeulement ? 'WHERE actif = 1' : ''} ORDER BY duree_mois`
  );
  return rows;
}

async function chargerPlan(planId: number) {
  const [rows]: any = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
  if (!rows[0]) throw new ServiceError(404, 'Plan introuvable.');
  return rows[0];
}

/** Un salon souscrit à un plan avec une méthode de paiement. Crée subscription + payment. */
export async function souscrire(salonId: number, planId: number, methode: MethodePaiement) {
  if (methode !== 'cash' && methode !== 'cib') {
    throw new ServiceError(400, 'Méthode de paiement invalide.');
  }
  // Paiement par carte désactivé (intégration SATIM non finalisée) : on refuse
  // proprement côté serveur, même si une requête tente de le forcer.
  if (methode === 'cib' && !env.paiementCarteActive) {
    throw new ServiceError(400, "Le paiement par carte est temporairement indisponible. Veuillez régler en espèces.");
  }
  const plan = await chargerPlan(planId);
  if (!plan.actif) throw new ServiceError(400, "Ce plan n'est plus disponible.");

  const subStatut = methode === 'cash' ? 'waiting_cash' : 'waiting_card';

  // Le fournisseur prépare l'intention de paiement HORS transaction (aucune
  // écriture DB ; pour une vraie passerelle, aucun appel réseau ne doit avoir
  // lieu à l'intérieur d'une transaction ouverte).
  const provider = getPaymentProvider(methode);
  const intent = await provider.creerPaiement({ salonId, montant: Number(plan.prix), description: plan.nom });

  // subscription + payment créés atomiquement (ROLLBACK si l'un échoue).
  const { subscriptionId, paymentId } = await withTransaction(async (conn) => {
    const [subRes]: any = await conn.execute(
      'INSERT INTO subscriptions (salon_id, plan_id, statut) VALUES (?, ?, ?)',
      [salonId, planId, subStatut]
    );
    const subId = subRes.insertId;
    const [payRes]: any = await conn.execute(
      `INSERT INTO payments (subscription_id, salon_id, methode, montant, statut, reference, checkout_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [subId, salonId, methode, Number(plan.prix), subStatut, intent.reference, intent.checkoutUrl ?? null]
    );
    return { subscriptionId: subId, paymentId: payRes.insertId };
  });

  notifierSalon(
    salonId,
    "Demande d'abonnement enregistrée",
    methode === 'cash'
      ? `Votre demande d'abonnement au plan <b>${plan.nom}</b> est enregistrée. Référence de paiement en espèces : <b>${intent.reference}</b>. Un administrateur validera votre paiement.`
      : `Votre demande d'abonnement au plan <b>${plan.nom}</b> est enregistrée. Réglez par carte via le lien de paiement fourni.`
  );

  return {
    subscriptionId,
    paymentId,
    reference: intent.reference,
    checkoutUrl: intent.checkoutUrl ?? null,
    statut: subStatut,
    plan,
  };
}

/** Active un abonnement : calcule les dates, marque payé, ET active le salon (bridge gating). */
export async function activerAbonnement(subscriptionId: number, adminId?: number) {
  const [subs]: any = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
  const sub = subs[0];
  if (!sub) throw new ServiceError(404, 'Abonnement introuvable.');
  const plan = await chargerPlan(sub.plan_id);

  const debut = ymd(new Date());
  const fin = ajouterMois(debut, plan.duree_mois);

  // Les 3 mises à jour (subscription, payment, salon) sont atomiques : l'état
  // ne peut jamais rester incohérent (ex. paiement marqué payé mais salon
  // resté inactif).
  await withTransaction(async (conn) => {
    await conn.execute('UPDATE subscriptions SET statut = ?, date_debut = ?, date_fin = ? WHERE id = ?', ['paid', debut, fin, subscriptionId]);
    await conn.execute(
      "UPDATE payments SET statut = 'paid', validated_by = ?, validated_at = NOW() WHERE subscription_id = ? AND statut IN ('waiting_cash','waiting_card','pending')",
      [adminId ?? null, subscriptionId]
    );
    // BRIDGE vers le gating existant (public/réservation/login lisent salons.statut).
    await conn.execute(
      "UPDATE salons SET statut = 'actif', abonnement_debut = ?, abonnement_fin = ?, abonnement_montant = ?, paiement_statut = 'paye' WHERE id = ?",
      [debut, fin, Number(plan.prix), sub.salon_id]
    );
  });

  notifierSalon(sub.salon_id, 'Abonnement activé', `Votre abonnement <b>${plan.nom}</b> est actif jusqu'au <b>${fin}</b>. Votre salon est de nouveau visible et peut recevoir des réservations.`);
  return getAbonnementSalon(sub.salon_id);
}

/** Admin : valide un paiement en espèces -> active l'abonnement. */
export async function validerPaiementEspeces(paymentId: number, adminId?: number) {
  const [rows]: any = await pool.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
  const pay = rows[0];
  if (!pay) throw new ServiceError(404, 'Paiement introuvable.');
  if (pay.methode !== 'cash') throw new ServiceError(400, "Ce paiement n'est pas en espèces.");
  if (pay.statut !== 'waiting_cash') throw new ServiceError(409, "Ce paiement n'est pas en attente de validation.");
  notifierSalon(pay.salon_id, 'Paiement validé', 'Votre paiement en espèces a été validé par un administrateur.');
  return activerAbonnement(pay.subscription_id, adminId);
}

/** Admin : refuse un paiement -> annule l'abonnement associé (le salon reste non actif). */
export async function refuserPaiement(paymentId: number) {
  const [rows]: any = await pool.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
  const pay = rows[0];
  if (!pay) throw new ServiceError(404, 'Paiement introuvable.');
  await pool.execute("UPDATE payments SET statut = 'refused' WHERE id = ?", [paymentId]);
  await pool.execute("UPDATE subscriptions SET statut = 'cancelled' WHERE id = ?", [pay.subscription_id]);
  notifierSalon(pay.salon_id, 'Paiement refusé', "Votre paiement a été refusé. Contactez l'administrateur pour régulariser.");
}

/**
 * Confirme un paiement par CARTE à partir de sa référence (appelé par le
 * webhook signé de la passerelle) et ACTIVE l'abonnement. Idempotent : un
 * paiement déjà `paid` renvoie l'abonnement sans double activation.
 */
export async function confirmerPaiementCarteParReference(reference: string) {
  const [rows]: any = await pool.query('SELECT * FROM payments WHERE reference = ?', [reference]);
  const pay = rows[0];
  if (!pay) throw new ServiceError(404, 'Paiement introuvable.');
  if (pay.methode !== 'cib') throw new ServiceError(400, "Ce paiement n'est pas un paiement par carte.");
  if (pay.statut === 'paid') {
    return getAbonnementSalon(pay.salon_id); // déjà confirmé (idempotence)
  }
  if (pay.statut !== 'waiting_card') {
    throw new ServiceError(409, "Ce paiement n'est pas en attente de règlement par carte.");
  }
  notifierSalon(pay.salon_id, 'Paiement par carte confirmé', 'Votre paiement par carte a bien été confirmé.');
  return activerAbonnement(pay.subscription_id);
}

/** Vue « Mon abonnement » d'un salon : abonnement courant + jours restants + historique des paiements. */
export async function getAbonnementSalon(salonId: number) {
  const [subs]: any = await pool.query(
    `SELECT s.*, p.nom AS plan_nom, p.prix AS plan_prix, p.duree_mois AS plan_duree
     FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id
     WHERE s.salon_id = ? ORDER BY s.created_at DESC LIMIT 1`,
    [salonId]
  );
  const [paiements]: any = await pool.query(
    'SELECT id, methode, montant, statut, reference, checkout_url, created_at, validated_at FROM payments WHERE salon_id = ? ORDER BY created_at DESC',
    [salonId]
  );
  const [salonRows]: any = await pool.query('SELECT nom, statut, abonnement_debut, abonnement_fin FROM salons WHERE id = ?', [salonId]);
  const salon = salonRows[0] || {};
  let joursRestants: number | null = null;
  if (salon.abonnement_fin) {
    const diff = new Date(`${salon.abonnement_fin}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime();
    joursRestants = Math.ceil(diff / 86400000);
  }
  return {
    abonnement: subs[0] ?? null,
    salonNom: salon.nom ?? null,
    salonStatut: salon.statut,
    abonnement_debut: salon.abonnement_debut ?? null,
    abonnement_fin: salon.abonnement_fin ?? null,
    joursRestants,
    paiements,
  };
}

/** Admin : change le plan d'un salon (nouvel abonnement payé + réactivation). */
export async function changerPlan(salonId: number, planId: number, _adminId?: number) {
  const plan = await chargerPlan(planId);
  const debut = ymd(new Date());
  const fin = ajouterMois(debut, plan.duree_mois);

  const reference = `ADM-${Date.now().toString(36).toUpperCase()}`;
  await withTransaction(async (conn) => {
    const [subRes]: any = await conn.execute(
      "INSERT INTO subscriptions (salon_id, plan_id, statut, date_debut, date_fin) VALUES (?, ?, 'paid', ?, ?)",
      [salonId, planId, debut, fin]
    );
    await conn.execute(
      "INSERT INTO payments (subscription_id, salon_id, methode, montant, statut, reference, validated_at) VALUES (?, ?, 'admin', ?, 'paid', ?, NOW())",
      [subRes.insertId, salonId, Number(plan.prix), reference]
    );
    await conn.execute(
      "UPDATE salons SET statut = 'actif', abonnement_debut = ?, abonnement_fin = ?, abonnement_montant = ?, paiement_statut = 'paye' WHERE id = ?",
      [debut, fin, Number(plan.prix), salonId]
    );
  });
  notifierSalon(salonId, 'Changement de plan', `Votre abonnement est désormais <b>${plan.nom}</b>, actif jusqu'au <b>${fin}</b>.`);
  return getAbonnementSalon(salonId);
}

/** Admin : prolonge l'abonnement d'un salon de `mois` mois (depuis la fin courante ou aujourd'hui). */
export async function prolongerAbonnement(salonId: number, mois: number, _adminId?: number) {
  if (!Number.isInteger(mois) || mois <= 0 || mois > 60) {
    throw new ServiceError(400, 'Nombre de mois invalide (1 à 60).');
  }
  const [rows]: any = await pool.query('SELECT abonnement_fin FROM salons WHERE id = ?', [salonId]);
  if (!rows[0]) throw new ServiceError(404, 'Salon introuvable.');
  const aujourdhui = ymd(new Date());
  const base = rows[0].abonnement_fin && rows[0].abonnement_fin >= aujourdhui ? rows[0].abonnement_fin : aujourdhui;
  const fin = ajouterMois(base, mois);

  const [subRows]: any = await pool.query('SELECT id FROM subscriptions WHERE salon_id = ? ORDER BY id DESC LIMIT 1', [salonId]);
  await withTransaction(async (conn) => {
    await conn.execute("UPDATE salons SET abonnement_fin = ?, statut = 'actif', paiement_statut = 'paye' WHERE id = ?", [fin, salonId]);
    if (subRows[0]) {
      await conn.execute("UPDATE subscriptions SET date_fin = ?, statut = 'paid' WHERE id = ?", [fin, subRows[0].id]);
    }
  });
  notifierSalon(salonId, 'Abonnement prolongé', `Votre abonnement a été prolongé jusqu'au <b>${fin}</b>.`);
  return getAbonnementSalon(salonId);
}

/** Admin : liste des abonnements (filtre statut + recherche salon). */
export async function listerAbonnementsAdmin(filtres: { statut?: string; q?: string }) {
  const conditions: string[] = [];
  const values: any[] = [];
  if (filtres.statut) {
    conditions.push('s.statut = ?');
    values.push(filtres.statut);
  }
  if (filtres.q) {
    conditions.push('(sa.nom LIKE ? OR sa.email LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT s.id, s.salon_id, s.statut, s.date_debut, s.date_fin, s.created_at,
            p.nom AS plan_nom, p.prix AS plan_prix,
            sa.nom AS salon_nom, sa.email AS salon_email, sa.statut AS salon_statut
     FROM subscriptions s
     JOIN subscription_plans p ON p.id = s.plan_id
     JOIN salons sa ON sa.id = s.salon_id
     ${where} ORDER BY s.created_at DESC`,
    values
  );
  return rows;
}

/** Admin : liste des paiements (filtre statut) — pour valider les paiements espèces. */
export async function listerPaiementsAdmin(filtres: { statut?: string }) {
  const conditions: string[] = [];
  const values: any[] = [];
  if (filtres.statut) {
    conditions.push('pay.statut = ?');
    values.push(filtres.statut);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT pay.id, pay.subscription_id, pay.salon_id, pay.methode, pay.montant, pay.statut,
            pay.reference, pay.created_at, pay.validated_at,
            sa.nom AS salon_nom, sa.email AS salon_email, pl.nom AS plan_nom
     FROM payments pay
     JOIN salons sa ON sa.id = pay.salon_id
     JOIN subscriptions su ON su.id = pay.subscription_id
     JOIN subscription_plans pl ON pl.id = su.plan_id
     ${where} ORDER BY pay.created_at DESC`,
    values
  );
  return rows;
}
