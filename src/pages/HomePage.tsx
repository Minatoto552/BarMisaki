import { AlertTriangle, Bell, ChevronRight, CircleUserRound, ClipboardList, Coffee, House, Plus, Send } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { CircularGallery } from '../components/CircularGallery';
import { assetPath } from '../lib/assets';
import { useData } from '../lib/data';
import { getCurrentServiceDayStart } from '../lib/service-day';
import { announcementKindLabels, type AnnouncementKind } from '../types';

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
  const { announcements, profile, sendAnnouncement } = useData();
  const [serviceDayStart, setServiceDayStart] = useState(() => getCurrentServiceDayStart());
  const [kind, setKind] = useState<AnnouncementKind>('notice');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setServiceDayStart(getCurrentServiceDayStart()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const currentAnnouncements = useMemo(() => announcements.filter((item) => new Date(item.createdAt).getTime() >= serviceDayStart), [announcements, serviceDayStart]);

  const submitAnnouncement = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) { setFeedback('送信するには、先にアカウントを登録してください。'); return; }
    if (!message.trim()) { setFeedback('お知らせの内容を入力してください。'); return; }
    setBusy(true); setFeedback(null);
    try {
      await sendAnnouncement(kind, message);
      setMessage(''); setFeedback('お知らせを送信しました。全員の画面に20秒間表示されます。');
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'お知らせを送信できませんでした。');
    } finally { setBusy(false); }
  };

  return <div className="page home-page">
    <section className="hero-card" id="home-top">
      <div className="hero-title-wrap"><h1 className="hero-heading">BARMISAKI</h1></div>
      <div className="hero-copy"><span className="eyebrow light">REALTIME ORDER EXPERIENCE</span><p>好きな一杯を選んでカートへ。<br />テーブルからまとめて注文できます。</p></div>
      <Link className="hero-order-button" to="/menu">注文画面へ<ChevronRight /></Link>
      <div className="hero-art" aria-hidden="true"><img className="hero-character" src={assetPath('hero/character-cutout.png')} alt="" /></div>
    </section>

    <CircularGallery items={slideshowImages} />

    <section className="home-notices" id="announcements">
      <div className="home-notices-heading"><div><span className="eyebrow light">TODAY'S ANNOUNCEMENTS</span><h2>本日のお知らせ</h2><p>午前5時から現在までのお知らせを表示しています。</p></div><Bell /></div>
      {currentAnnouncements.length ? <div className="notice-list">{currentAnnouncements.map((item) => <article className={`notice-card notice-${item.kind}`} key={item.id}>
        <span className="notice-kind">{item.kind === 'urgent' ? <AlertTriangle /> : <Bell />}{announcementKindLabels[item.kind]}</span>
        <p>{item.message}</p>
        <footer><b>{item.creatorName}</b><time dateTime={item.createdAt}>{new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.createdAt))}</time></footer>
      </article>)}</div> : <div className="notice-empty"><Bell /><p>本日のお知らせはまだありません。</p></div>}
    </section>

    <footer className="home-footer-tools">
      <div className="home-shortcuts"><span className="eyebrow light">SHORTCUTS</span><h2>各項目へ移動</h2><nav aria-label="ホームショートカット">
        <Link to="/"><House />ホーム</Link><Link to="/menu"><Coffee />注文</Link><Link to="/orders"><ClipboardList />注文管理</Link><Link to="/add"><Plus />商品追加</Link><Link to="/account"><CircleUserRound />アカウント</Link>
      </nav></div>
      <form className="announcement-composer" onSubmit={(event) => void submitAnnouncement(event)}>
        <span className="eyebrow light">SEND ANNOUNCEMENT</span><h2>お知らせを送信</h2><p>送信後、一覧への追加と同時に全員の画面上部へ20秒間表示します。</p>
        <div className="announcement-kind-picker" role="radiogroup" aria-label="お知らせカテゴリー">
          <button type="button" role="radio" aria-checked={kind === 'urgent'} className={kind === 'urgent' ? 'selected urgent' : ''} onClick={() => setKind('urgent')}><AlertTriangle />緊急</button>
          <button type="button" role="radio" aria-checked={kind === 'notice'} className={kind === 'notice' ? 'selected notice' : ''} onClick={() => setKind('notice')}><Bell />連絡</button>
        </div>
        <label><span>お知らせ内容</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={300} rows={4} placeholder="全員へ伝える内容を入力してください" /><small>{message.length} / 300</small></label>
        {feedback && <p className="announcement-feedback" role="status">{feedback}</p>}
        {!profile && <Link className="announcement-account-link" to="/account">先にアカウントを登録する<ChevronRight /></Link>}
        <button className="announcement-submit" type="submit" disabled={busy || !message.trim()}><Send />{busy ? '送信中…' : `${announcementKindLabels[kind]}として送信`}</button>
      </form>
    </footer>
  </div>;
};
