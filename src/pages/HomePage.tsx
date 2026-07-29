import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CircularGallery } from '../components/CircularGallery';
import { assetPath } from '../lib/assets';

const slideshowImages = [
  { src: assetPath('slideshow/gallery-01.webp'), orientation: 'landscape' },
  { src: assetPath('slideshow/gallery-02.webp'), orientation: 'landscape' },
  { src: assetPath('slideshow/gallery-03.webp'), orientation: 'portrait' },
  { src: assetPath('slideshow/gallery-04.webp'), orientation: 'portrait' },
  { src: assetPath('slideshow/gallery-05.webp'), orientation: 'portrait' },
  { src: assetPath('slideshow/gallery-06.webp'), orientation: 'portrait' },
  { src: assetPath('slideshow/gallery-07.webp'), orientation: 'portrait' },
  { src: assetPath('slideshow/gallery-08.webp'), orientation: 'portrait' },
  { src: assetPath('slideshow/gallery-10.webp'), orientation: 'portrait' },
  { src: assetPath('slideshow/gallery-11.webp'), orientation: 'portrait' },
  { src: assetPath('slideshow/gallery-12.webp'), orientation: 'landscape' },
  { src: assetPath('slideshow/gallery-13.webp'), orientation: 'landscape' },
  { src: assetPath('slideshow/gallery-14.webp'), orientation: 'landscape' },
  { src: assetPath('slideshow/gallery-15.webp'), orientation: 'square' },
  { src: assetPath('slideshow/gallery-16.webp'), orientation: 'portrait' },
] as const;

export const HomePage = () => {
  return <div className="page home-page">
    <section className="hero-card">
      <div className="hero-title-wrap"><h1 className="hero-heading">BARMISAKI</h1></div>
      <div className="hero-copy"><span className="eyebrow light">REALTIME ORDER EXPERIENCE</span><p>好きな一杯を選んでカートへ。<br />テーブルからまとめて注文できます。</p></div>
      <Link className="hero-order-button" to="/menu">注文画面へ<ChevronRight /></Link>
      <div className="hero-art" aria-hidden="true"><img className="hero-character" src={assetPath('hero/character-cutout.png')} alt="" /></div>
    </section>

    <CircularGallery items={slideshowImages} />
  </div>
};
