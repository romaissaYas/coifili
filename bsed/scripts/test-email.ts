import 'dotenv/config';
import nodemailer from 'nodemailer';
import { envoyerEmail, estSmtpConfigure } from '../services/emailService';

/**
 * Envoi d'un email de TEST, sans passer par une réservation.
 * Usage : `npm run test:email -- destinataire@exemple.com`
 *
 *  - SMTP configuré (.env)  → envoi RÉEL via votre fournisseur (Gmail/Mailtrap…).
 *  - SMTP non configuré     → envoi RÉEL via un compte de test Ethereal (créé à
 *    la volée) + affichage d'une URL d'aperçu de l'email. Cela prouve que
 *    l'envoi fonctionne de bout en bout, indépendamment de votre config.
 */
async function main(): Promise<void> {
  const to = process.argv[2] || process.env.SMTP_USER || 'destinataire@exemple.com';
  const html = `
    <div style="font-family:Arial,sans-serif;padding:20px">
      <h1 style="color:#e11d67">Coifili — Email de test ✅</h1>
      <p>Si vous lisez cet email, l'envoi SMTP fonctionne.</p>
      <p>Date : ${new Date().toLocaleString('fr-FR')}</p>
    </div>`;

  if (estSmtpConfigure()) {
    console.log(`SMTP configuré (${process.env.SMTP_HOST}). Envoi réel à ${to}…`);
    await envoyerEmail({ to, subject: 'Coifili — email de test', html });
    console.log('✅ Email envoyé. Vérifiez la boîte de réception (et les spams).');
  } else {
    console.log("SMTP non configuré : envoi via un compte de test Ethereal…");
    const compte = await nodemailer.createTestAccount();
    const transport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: compte.user, pass: compte.pass },
    });
    const info = await transport.sendMail({
      from: 'Coifili <test@coifili.dev>',
      to,
      subject: 'Coifili — email de test (Ethereal)',
      html,
    });
    console.log('✅ Email envoyé via Ethereal (serveur de test réel).');
    console.log('🔗 Aperçu de l\'email :', nodemailer.getTestMessageUrl(info));
    console.log('   (Pour un envoi vers de vraies boîtes, renseignez SMTP_* dans bsed/.env.)');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Échec du test email :', err);
  process.exit(1);
});
