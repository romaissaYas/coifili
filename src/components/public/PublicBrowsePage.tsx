import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import MarketingSections from '@/components/public/MarketingSections';
import SalonsExplorer from '@/components/salon-search/SalonsExplorer';

type Props = {
  /** Catégorie verrouillée (coiffeur, barbier...). Absent = accueil (tous). */
  categorieFixe?: string;
  title: string;
  subtitle: string;
  bannerImage?: string;
  rotating?: boolean;
};

/**
 * Page publique de navigation — STRICTEMENT identique entre l'accueil et les
 * pages catégorie. Header + explorateur de salons + sections marketing +
 * footer. Seul `categorieFixe` change les salons affichés dans le slider.
 */
export default function PublicBrowsePage(props: Props) {
  return (
    <div className="bg-white">
      <PublicHeader />
      <SalonsExplorer {...props} />
      <MarketingSections />
      <PublicFooter />
    </div>
  );
}
