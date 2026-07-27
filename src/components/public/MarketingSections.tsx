'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ProduitsSection from '@/components/products/ProduitsSection';

const PROFESSIONNELS = [
  {
    title: 'Manucure',
    description: 'On raconte que les mains sont le reflet de la façon dont on prend soin de soi.',
    image: '/img/bg1.jpg',
    link: '/manucure',
  },
  {
    title: 'Coiffeur',
    description: 'Un bon style commence par une bonne coupe.',
    image: '/img/bg2.jpg',
    link: '/coiffeur',
  },
  {
    title: 'Institut de Beauté',
    description: 'Détendez-vous avec nos soins bien-être.',
    image: '/img/bg3.jpg',
    link: '/institut',
  },
];

/**
 * Sections marketing communes (accueil + pages catégorie) : carrousel
 * « Découvrez nos professionnels » + section « Nos Produits Beauté ».
 */
export default function MarketingSections() {
  return (
    <>
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            loop
          >
            {PROFESSIONNELS.map((item, index) => (
              <SwiperSlide key={index}>
                <div className="grid items-center gap-8 md:grid-cols-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-[400px] w-full rounded-xl object-cover shadow-md"
                  />
                  <div>
                    <h2 className="mb-4 text-4xl font-bold">
                      Découvrez nos <br />
                      Professionnels
                    </h2>
                    <hr className="mb-4 w-10 border-b-2 border-rose-500" />
                    <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                    <p className="mb-4 text-gray-600">{item.description}</p>
                    <a
                      href={item.link}
                      className="font-medium text-black underline hover:text-rose-600"
                    >
                      Voir plus
                    </a>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Section « Nos Produits Beauté » (remplace « Partout en Algérie »). */}
      <ProduitsSection />
    </>
  );
}
