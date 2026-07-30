import { CircleUserRound, ClipboardList, Coffee, House, Plus, Radio } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useEffect } from 'react';

import { useData } from '../lib/data';
import { installNotificationSoundUnlock } from '../lib/notification-sounds';
import { EmergencySystem } from './EmergencySystem';
import { AnnouncementToast } from './AnnouncementToast';

const links = [
  { to: '/', label: 'ホーム', icon: House, end: true },
  { to: '/menu', label: '注文', icon: Coffee },
  { to: '/orders', label: '注文管理', icon: ClipboardList },
  { to: '/add', label: '商品追加', icon: Plus },
  { to: '/account', label: 'アカウント', icon: CircleUserRound },
];

export const AppShell = () => {
  const { profile, runtimeMode, ready, error } = useData();
  useEffect(() => installNotificationSoundUnlock(), []);
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand"><span className="brand-mark"><Coffee /></span><span><b>BarMisaki</b><small>ORDER SYSTEM</small></span></NavLink>
        <nav className="desktop-nav" aria-label="メインナビゲーション">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon size={18} />{label}</NavLink>)}
        </nav>
        <NavLink to="/account" className="profile-chip">
          {profile ? <img src={profile.iconUrl} alt="" /> : <CircleUserRound />}
          <span>{profile?.displayName || '未登録'}</span>
        </NavLink>
      </header>
      {runtimeMode === 'sample' && <div className="demo-bar"><Radio size={15} />デモモード：操作内容はこのブラウザにリアルタイム保存されます</div>}
      {error && <div className="global-error">{error}</div>}
      <main>{ready ? <Outlet /> : <div className="loading-state"><span className="spinner" />データを読み込んでいます</div>}</main>
      <AnnouncementToast />
      <EmergencySystem />
      <nav className="mobile-nav" aria-label="メインナビゲーション">
        {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon /><span>{label}</span></NavLink>)}
      </nav>
    </div>
  );
};
