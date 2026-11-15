import 'dotenv/config';
import { pool } from '../db/pool';
import { initializeDb } from '../db/schema';
import { creerPost } from '../services/marketingPostService';

/**
 * Remplit le module Marketing (table ig_posts) avec les 12 publications de
 * lancement prêtes à publier. Idempotent : saute un post dont le titre existe
 * déjà. Statut = brouillon (à relire, puis publier via Meta une fois configuré).
 *
 * NB publication Instagram : pour une publication réelle via l'API Meta, chaque
 * image_url doit être une URL PUBLIQUE (ex. https://<domaine>/img/bg1.jpg).
 * Ici on stocke le chemin relatif /img/... (affichage dans le module) ; à
 * rendre absolu avant publication.
 */
const POSTS = [
  { titre: 'Bienvenue — on est Coifili', image: '/img/bg1.jpg',
    legende: "On est Coifili 💛 La plateforme qui te fait trouver et réserver ton salon de coiffure, barbier, institut ou manucure en Algérie — en ligne, en 2 minutes, gratuitement.",
    hashtags: '#Coifili #BeautéAlgérie #CoiffureAlgérie #RéservationEnLigne #Algérie #DZ #Alger',
    emojis: '💛✂️📍', cta: 'Réserve dès maintenant, lien en bio 🔗',
    prompt: "Rose #E11D67 background, white 'Coifili' wordmark with scissors icon centered, minimal brand cover, 1080x1080" },
  { titre: 'Ton salon réservé en 2 min', image: '/img/bg2.jpg',
    legende: "Fini les appels sans réponse 📵. Tu choisis ta ville, ton salon, ton créneau — et c'est réservé. Ton temps compte.",
    hashtags: '#Coifili #PriseDeRDV #GainDeTemps #RDVBeauté #Alger #Oran #DZ',
    emojis: '⏱️📱✨', cta: 'Réserve maintenant → lien en bio',
    prompt: "Woman's hand holding a smartphone showing a clean pink salon booking screen, blurred modern salon, soft light, #E11D67 accents, 1080x1080" },
  { titre: '4 univers, 1 plateforme', image: '/img/bg3.jpg',
    legende: "Coiffeur ✂️ Barbier 💈 Institut de beauté 🧴 Manucure 💅 — tout au même endroit. Filtre par ville et par catégorie, compare, réserve.",
    hashtags: '#Coifili #Barbier #Manucure #InstitutDeBeauté #Coiffeur #BeautéAlgérie #DZ',
    emojis: '✂️💈🧴💅', cta: 'Trouve ton salon → lien en bio',
    prompt: "Four-quadrant grid on white: scissors, razor, skincare, nail polish, unified rose #E11D67 grade, flat editorial, 1080x1080" },
  { titre: 'Ton barbier en un tap', image: '/img/bg4.jpg',
    legende: "Dégradé net, taille de barbe, serviette chaude 🔥. Trouve ton barbier et réserve ton créneau sans décrocher le téléphone.",
    hashtags: '#Coifili #Barbier #BarberDZ #Alger #RéservationEnLigne #DZ',
    emojis: '💈🔥✂️', cta: 'Réserve chez ton barbier → bio',
    prompt: "Cinematic close-up of a barber doing a sharp fade, moody background with a single rose #E11D67 light accent, 1080x1080" },
  { titre: 'Prends soin de toi', image: '/img/bg5.jpg',
    legende: "La beauté sans le stress 💛 Réserve, respire, profite.",
    hashtags: '#Coifili #SelfCare #BienÊtre #BeautéAlgérie #Algérie #DZ',
    emojis: '💛🌸', cta: 'Prends soin de toi → lien en bio',
    prompt: "Minimal quote poster, blush pink background, elegant script, rose #E11D67 accent line, 1080x1080" },
  { titre: 'Tous tes RDV au même endroit', image: '/img/bg7.jpg',
    legende: "À venir, passés, annulés : gère tout depuis « Mes rendez-vous ». Reprogramme ou annule en un clic 🔄.",
    hashtags: '#Coifili #RDVEnLigne #PriseDeRDV #Organisation #BeautéAlgérie #DZ',
    emojis: '🗓️🔄✅', cta: 'Crée ton compte → lien en bio',
    prompt: "Smartphone mockup showing a clean 'Mes rendez-vous' screen, pink UI #E11D67, white background, 1080x1080" },
  { titre: 'Salons : reprenez votre agenda', image: '/img/bg8.jpg',
    legende: "Votre espace pro Coifili : agenda, prestations, produits, employés, horaires et réservations — au même endroit. Moins de no-shows, plus de temps pour votre métier.",
    hashtags: '#Coifili #SalonDeCoiffure #GestionSalon #EntrepreneursDZ #Coiffeur #Algérie #DZ',
    emojis: '✂️📅💼', cta: 'Contactez-nous pour inscrire votre salon → bio',
    prompt: "Laptop on a salon reception desk showing a clean pink agenda dashboard, scissors and comb, warm light, #E11D67 UI, 1080x1080" },
  { titre: 'Ta manucure en 2 clics', image: '/img/bg9.jpg',
    legende: "On dit que les mains reflètent la façon dont on prend soin de soi 💅. Réserve ta manucure en quelques secondes.",
    hashtags: '#Coifili #Manucure #NailsDZ #BeautéAlgérie #Oran #RéservationEnLigne #DZ',
    emojis: '💅✨', cta: 'Réserve ta manucure → bio',
    prompt: "Elegant top-down of freshly manicured soft-pink nails on marble, minimal luxurious, rose #E11D67, 1080x1080" },
  { titre: 'Ta ville, tes salons', image: '/img/bg10.jpg',
    legende: "Alger, Oran, Constantine, Annaba… Coifili te montre les salons de ta ville. La beauté locale, à portée de main 🇩🇿.",
    hashtags: '#Coifili #Alger #Oran #Constantine #Annaba #BeautéAlgérie #DZ',
    emojis: '📍🇩🇿', cta: 'Choisis ta ville → lien en bio',
    prompt: "Stylized minimalist map of Algeria with glowing rose #E11D67 location pins over major cities, dark background, 1080x1080" },
  { titre: 'Gratuit pour les clients. Toujours.', image: '/img/bg11.jpg',
    legende: "Réserver avec Coifili ne te coûte rien. Tu paies ta prestation au salon, comme d'habitude. Nous, on te fait gagner du temps.",
    hashtags: '#Coifili #Gratuit #RDVBeauté #PriseDeRDV #Algérie #DZ',
    emojis: '💛✅', cta: 'Réserve gratuitement → bio',
    prompt: "Bold typographic poster '100% GRATUIT pour les clients' with a pink ribbon badge, rose #E11D67 on white, 1080x1080" },
  { titre: 'Ta parenthèse bien-être', image: '/img/bg12.jpg',
    legende: "Détends-toi avec un soin près de chez toi ✨. Trouve ton institut et réserve ton moment rien qu'à toi.",
    hashtags: '#Coifili #InstitutDeBeauté #SpaDZ #BienÊtre #Constantine #BeautéAlgérie #DZ',
    emojis: '🧖‍♀️✨🌿', cta: 'Réserve un soin → bio',
    prompt: "Serene spa scene with rolled towels, candles and eucalyptus, soft pink and cream tones, calming light, 1080x1080" },
  { titre: 'Rejoins la communauté beauté', image: '/img/bg1.jpg',
    legende: "Clients, coiffeurs, barbiers, esthéticiennes 💛 Coifili réunit tout l'univers beauté algérien. Ta place t'attend.",
    hashtags: '#Coifili #Communauté #BeautéAlgérie #CoiffureAlgérie #Alger #Oran #DZ',
    emojis: '💛🇩🇿✂️', cta: 'Rejoins Coifili → lien en bio',
    prompt: "Vibrant collage of diverse Algerian beauty professionals and clients, rose #E11D67 unifying grade, community feel, 1080x1080" },
];

async function main() {
  await initializeDb();
  let crees = 0, ignores = 0;
  for (const p of POSTS) {
    const [dup]: any = await pool.query('SELECT id FROM ig_posts WHERE titre = ? LIMIT 1', [p.titre]);
    if (dup.length > 0) { ignores++; continue; }
    await creerPost({
      titre: p.titre, image_url: p.image, galerie: [p.image], image_prompt: p.prompt,
      legende: p.legende, hashtags: p.hashtags, emojis: p.emojis, cta: p.cta, statut: 'brouillon',
    });
    crees++;
  }
  console.log(`✅ Publications Instagram : ${crees} créées, ${ignores} déjà présentes.`);
  await pool.end();
}
main().catch((e) => { console.error('❌', e); process.exit(1); });
