import { AlertTriangle, Bell, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useData } from '../lib/data';
import { isInCurrentServiceDay } from '../lib/service-day';
import { announcementKindLabels, type Announcement } from '../types';

export const AnnouncementToast = () => {
  const { announcements } = useData();
  const [visible, setVisible] = useState<Announcement | null>(null);
  const initialized = useRef(false);
  const seen = useRef(new Set<string>());
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const current = announcements.filter((item) => isInCurrentServiceDay(item.createdAt));
    if (!initialized.current) {
      current.forEach((item) => seen.current.add(item.id));
      initialized.current = true;
      return;
    }
    const next = current.find((item) => {
      const age = Date.now() - new Date(item.createdAt).getTime();
      return !seen.current.has(item.id) && age >= 0 && age < 20_000;
    });
    current.forEach((item) => seen.current.add(item.id));
    if (!next) return;
    window.clearTimeout(timer.current);
    setVisible(next);
    const remaining = Math.max(0, 20_000 - (Date.now() - new Date(next.createdAt).getTime()));
    timer.current = window.setTimeout(() => setVisible(null), remaining);
  }, [announcements]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!visible) return null;
  const Icon = visible.kind === 'urgent' ? AlertTriangle : Bell;
  return <aside className={`announcement-toast announcement-${visible.kind}`} role={visible.kind === 'urgent' ? 'alert' : 'status'}>
    <Icon />
    <div><span>{announcementKindLabels[visible.kind]}・{visible.creatorName}</span><p>{visible.message}</p></div>
    <button type="button" onClick={() => setVisible(null)} aria-label="通知を閉じる"><X /></button>
  </aside>;
};
